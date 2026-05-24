# Telegram Video Downloader Bot

Fast, modern Telegram bot for downloading videos from TikTok, YouTube, YouTube Shorts, Instagram Reels, and Facebook.

## Features
- Auto link detection for 5 platforms
- Quality selection (360p, 720p, 1080p, MP3)
- No-watermark TikTok support via yt-dlp
- Coin economy + daily free downloads
- Referral system with rewards
- Premium users (unlimited, priority)
- Admin panel (/stats, /broadcast, etc.)
- Anti-spam, queue, cooldowns
- Progress updates, thumbnails, metadata
- Local JSON storage (Firebase-ready abstraction layer)

## Tech
- Node.js + Telegraf
- yt-dlp + FFmpeg
- Local JSON DB (easy migration to Firebase Realtime DB)

## Quick Start

1. `npm install`
2. Copy `.env.example` to `.env` and fill `BOT_TOKEN` + `ADMIN_IDS`
3. Ensure `yt-dlp` and `ffmpeg` are installed and in PATH
4. `npm start`

## Commands
/start, /help, /profile, /invite, /premium, /stats

Admins: /stats /broadcast /addcoins /addpremium /ban /unban

## Project Structure
See src/ for modular code:
- commands/
- services/ (download, ffmpeg, queue)
- database/ (local json service - ready for Firebase)
- handlers/
- middlewares/
- utils/

## Production Notes
- Use PM2 or Docker in prod
- Set up proper logging & monitoring
- Monitor disk space (auto-clean downloads)
- Prepare for Firebase swap in database/index.js

Made for high-traffic mobile-first usage (2026 style).
