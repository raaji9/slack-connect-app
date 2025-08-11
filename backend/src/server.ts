import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { WebClient } from '@slack/web-api';
import db from './db.js';
import { getAccessToken } from './token-utils.js';
import { scheduleMessage, cancelScheduledMessage } from './scheduler.js';

dotenv.config();

const app = express();
const port = 3001;

const clientId = process.env.SLACK_CLIENT_ID;
const clientSecret = process.env.SLACK_CLIENT_SECRET;
const redirectUri = 'https://newly-relevant-marlin.ngrok-free.app/auth/slack/callback';

app.use(cors());
app.use(bodyParser.json());

app.get('/auth/slack', (req: Request, res: Response) => {
  const scopes = ['chat:write', 'channels:read', 'team:read', 'users:read'];
  const authorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes.join(',')}&user_scope=users:read&redirect_uri=${redirectUri}`;
  res.redirect(authorizeUrl);
});

app.get('/api/channels', async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const token = await getAccessToken(userId as string);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const web = new WebClient(token);
    const result = await web.conversations.list({
      types: 'public_channel',
    });
    res.json({ success: true, channels: result.channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/send-message', async (req: Request, res: Response) => {
  const { channel, text, userId } = req.body;

  if (!channel || !text || !userId) {
    return res.status(400).json({ error: 'Channel, text, and user ID are required' });
  }

  try {
    const token = await getAccessToken(userId);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const web = new WebClient(token);
    const result = await web.chat.postMessage({
      channel: channel,
      text: text,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error sending message to Slack:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error.data) {
      switch (error.data.error) {
        case 'channel_not_found':
          errorMessage = 'The specified channel does not exist or the bot is not a member of it.';
          break;
        case 'not_in_channel':
          errorMessage = 'The bot is not in the specified channel. Please invite it.';
          break;
        case 'invalid_auth':
          errorMessage = 'Invalid authentication token. Please check your .env file.';
          break;
        default:
          errorMessage = `An API error occurred: ${error.data.error}`;
      }
    }
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post('/schedule-message', async (req: Request, res: Response) => {
  const { channel, text, sendAt, userId } = req.body;

  if (!channel || !text || !sendAt || !userId) {
    return res.status(400).json({ error: 'Channel, text, sendAt, and user ID are required' });
  }

  try {
    const token = await getAccessToken(userId);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const messageId = scheduleMessage(channel, text, sendAt, userId);
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/scheduled-messages', async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const token = await getAccessToken(userId as string);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userMessages = db.data.scheduledMessages.filter(
      (msg: any) => msg.userId === userId
    );
    res.json({ success: true, messages: userMessages });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/cancel-message/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!id || !userId) {
    return res.status(400).json({ error: 'Message ID and user ID are required' });
  }

  try {
    const token = await getAccessToken(userId);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    cancelScheduledMessage(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling message:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/auth/slack/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const web = new WebClient();
    const oauthResult = await web.oauth.v2.access({
      client_id: clientId!,
      client_secret: clientSecret!,
      code: code as string,
      redirect_uri: redirectUri,
    });

    console.log('Slack OAuth Result:', oauthResult);

    const { authed_user, team, access_token, refresh_token, expires_in } = oauthResult as any;
    if (!authed_user || !team || !authed_user.id || !team.id) {
      throw new Error('Missing user or team information');
    }

    const userId = authed_user.id;
    const teamId = team.id;
    const accessToken = access_token;
    const refreshToken = refresh_token;
    const expiresAt = Date.now() + (expires_in || 3600) * 1000;

    if (!accessToken) {
      throw new Error('Missing access token');
    }

    db.data.tokens[userId] = {
      accessToken,
      refreshToken,
      expiresAt,
    };
    await db.write();

    res.redirect(`https://localhost:3000?userId=${userId}`);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(port, async () => {
  await db.read();
  console.log(`Backend server is running on http://localhost:${port}`);
});
