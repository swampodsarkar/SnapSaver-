import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  botToken: process.env.BOT_TOKEN,
  adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean),
  downloadDir: process.env.DOWNLOAD_DIR || './downloads',
  ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',

  // Coin & limits
  coinsPerDownload: parseInt(process.env.COINS_PER_DOWNLOAD || '2', 10),
  dailyFreeDownloads: parseInt(process.env.DAILY_FREE_DOWNLOADS || '5', 10),
  referralReward: parseInt(process.env.REFERRAL_REWARD_COINS || '10', 10),

  // Anti-spam
  cooldownSeconds: parseInt(process.env.COOLDOWN_SECONDS || '10', 10),
  maxDownloadsPerHour: parseInt(process.env.MAX_DOWNLOADS_PER_HOUR || '30', 10),
  queueMaxSize: parseInt(process.env.QUEUE_MAX_SIZE || '20', 10),

  logLevel: process.env.LOG_LEVEL || 'info',

  // Firebase Realtime Database
  useFirebase: process.env.USE_FIREBASE === 'true',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json',
    apiKey: process.env.FIREBASE_API_KEY,
    appId: process.env.FIREBASE_APP_ID,
  },

  // Paths
  dataDir: join(__dirname, '../../data'),
  downloadsPath: join(__dirname, '../../', process.env.DOWNLOAD_DIR || './downloads'),
};

export default config;

// Ensure data and downloads dirs exist
export async function ensureDirectories() {
  await fs.ensureDir(config.dataDir);
  await fs.ensureDir(config.downloadsPath);
}
