import { MESSAGES } from '../utils/messages.js';
import { getMainMenuInlineKeyboard } from '../utils/keyboards.js';

export async function helpCommand(ctx) {
  const lang = ctx.from?.language_code?.startsWith('bn') ? 'bn' : 'en';

  await ctx.replyWithHTML(
    `<b>❓ How to Use FastVid</b>\n\n` +
    `1. Send any video link (YouTube, TikTok, Instagram Reels, Facebook, X/Twitter, Vimeo)\n` +
    `2. Bot automatically detects platform & shows quality options\n` +
    `3. Tap 360p / 720p / 1080p / MP3\n` +
    `4. Fast download delivered directly to you\n\n` +
    `<b>Supported Platforms</b>\n` +
    `YouTube • TikTok (no watermark) • Instagram • Facebook • X/Twitter • Vimeo\n\n` +
    `<b>Pro Tip:</b> Use the menu buttons below for quick navigation.`,
    getMainMenuInlineKeyboard()
  );
}
