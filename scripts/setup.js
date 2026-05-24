#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setup() {
  console.log('🚀 Setting up Telegram Video Downloader Bot...');

  const dataDir = path.join(__dirname, '../data');
  const downloadsDir = path.join(__dirname, '../downloads');

  await fs.ensureDir(dataDir);
  await fs.ensureDir(downloadsDir);

  // Create empty data files if not exist
  const files = ['users.json', 'stats.json', 'premium.json', 'referrals.json'];
  for (const f of files) {
    const fp = path.join(dataDir, f);
    if (!await fs.pathExists(fp)) {
      await fs.writeJson(fp, f.includes('stats') ? { totalDownloads: 0, totalUsers: 0 } : {});
      console.log(`  Created ${f}`);
    }
  }

  console.log('\n✅ Setup complete!');
  console.log('1. Copy .env.example → .env and fill your BOT_TOKEN + ADMIN_IDS');
  console.log('2. Make sure yt-dlp and ffmpeg are installed and in your PATH');
  console.log('3. Run: npm start');
}

setup().catch(console.error);
