import { WebClient } from '@slack/web-api';
import db from './db.js';

export async function getAccessToken(userId: string): Promise<string | null> {
  const tokenData = db.data.tokens[userId];

  if (!tokenData) {
    return null;
  }

  if (Date.now() >= tokenData.expiresAt) {
    // Token has expired, refresh it
    try {
      const web = new WebClient();
      const refreshResult = await web.oauth.v2.access({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: tokenData.refreshToken,
      });

      const { access_token, refresh_token, expires_in } = refreshResult;

      if (!access_token || !refresh_token || !expires_in) {
        throw new Error('Failed to refresh token');
      }

      db.data.tokens[userId] = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in as number) * 1000,
      };
      await db.write();

      return access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, the user may need to re-authenticate
      delete db.data.tokens[userId];
      await db.write();
      return null;
    }
  }

  return tokenData.accessToken;
}
