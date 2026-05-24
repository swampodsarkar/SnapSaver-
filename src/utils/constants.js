export const PLATFORMS = {
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  YOUTUBE_SHORTS: 'youtube_shorts',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
};

export const SUPPORTED_DOMAINS = {
  tiktok: ['tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com'],
  youtube: ['youtube.com', 'youtu.be', 'm.youtube.com'],
  youtube_shorts: ['youtube.com/shorts', 'youtu.be'],
  instagram: ['instagram.com', 'www.instagram.com'],
  facebook: ['facebook.com', 'fb.watch', 'm.facebook.com', 'fb.com'],
};

export const QUALITY_OPTIONS = [
  { label: '360p', value: '360', format: 'best[height<=360]' },
  { label: '720p', value: '720', format: 'best[height<=720]' },
  { label: '1080p', value: '1080', format: 'best[height<=1080]' },
  { label: 'MP3 Audio', value: 'audio', format: 'bestaudio/best' },
];

export const DEFAULT_QUALITY = '720';

export const MESSAGES = {
  WELCOME: '👋 Welcome to the fastest video downloader!\n\nSend me any supported link to get started.',
  UNSUPPORTED: '❌ Unsupported link. Supported: TikTok, YouTube, Shorts, Instagram Reels, Facebook.',
  PROCESSING: '⚡ Analyzing your link...',
  FETCHING_FORMATS: '📥 Fetching available qualities...',
  CHOOSE_QUALITY: '🎥 Choose quality:',
  DOWNLOADING: '⬇️ Downloading...',
  UPLOADING: '📤 Uploading to Telegram...',
  SUCCESS: '✅ Download complete!',
  ERROR: '❌ Something went wrong. Please try again later.',
  NO_COINS: '💰 Not enough coins. Use /profile or refer friends.',
  COOLDOWN: '⏳ Please wait a few seconds before requesting another download.',
  QUEUE_FULL: '🚦 Server is busy. Please try again in a moment.',
  PREMIUM_BENEFIT: '⭐ Premium activated! Enjoy unlimited fast downloads.',
};

export const COMMANDS = {
  START: 'start',
  HELP: 'help',
  PROFILE: 'profile',
  INVITE: 'invite',
  PREMIUM: 'premium',
  STATS: 'stats',
};

export const ADMIN_COMMANDS = {
  STATS: 'stats',
  BROADCAST: 'broadcast',
  ADDCOINS: 'addcoins',
  ADDPREMIUM: 'addpremium',
  BAN: 'ban',
  UNBAN: 'unban',
};
