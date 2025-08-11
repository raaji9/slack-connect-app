import schedule from 'node-schedule';
import { WebClient } from '@slack/web-api';
import db from './db.js';
import { getAccessToken } from './token-utils.js';
import { v4 as uuidv4 } from 'uuid';

export function scheduleMessage(
  channel: string,
  text: string,
  sendAt: number,
  userId: string
) {
  const id = uuidv4();
  db.data.scheduledMessages.push({ id, channel, text, sendAt, userId });
  db.write();
  return id;
}

export function cancelScheduledMessage(id: string) {
  db.data.scheduledMessages = db.data.scheduledMessages.filter(
    (msg) => msg.id !== id
  );
  db.write();
}

async function sendScheduledMessages() {
  const now = Date.now();
  const dueMessages = db.data.scheduledMessages.filter(
    (msg) => msg.sendAt <= now
  );

  for (const msg of dueMessages) {
    try {
      const token = await getAccessToken(msg.userId);
      if (token) {
        const web = new WebClient(token);
        await web.chat.postMessage({
          channel: msg.channel,
          text: msg.text,
        });
      }
    } catch (error) {
      console.error(`Failed to send scheduled message ${msg.id}:`, error);
    } finally {
      // Remove the message from the queue whether it succeeded or failed
      cancelScheduledMessage(msg.id);
    }
  }
}

// Run every minute to check for due messages
schedule.scheduleJob('* * * * *', sendScheduledMessages);
