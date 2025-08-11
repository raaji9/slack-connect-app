import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '../db.json');

// Ensure the directory exists
const dir = dirname(file);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Ensure the file exists
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({ tokens: {}, scheduledMessages: [] }));
}

type Data = {
  tokens: {
    [key: string]: {
      accessToken: string;
      refreshToken?: string;
      expiresAt: number;
    };
  };
  scheduledMessages: {
    id: string;
    channel: string;
    text: string;
    sendAt: number;
    userId: string;
  }[];
};

const adapter = new JSONFile<Data>(file);
const defaultData: Data = { tokens: {}, scheduledMessages: [] };
const db = new Low(adapter, defaultData);

export default db;
