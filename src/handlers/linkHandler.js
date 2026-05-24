import { extractPlatformFromUrl, isValidUrl } from '../utils/helpers.js';
import { PLATFORMS, MESSAGES, QUALITY_OPTIONS } from '../utils/constants.js';
import { Markup } from 'telegraf';
import { getVideoInfo } from '../services/ytdlp.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';
import { canDownloadFree, isPremium } from '../database/index.js';

export async function handleLink(ctx, url) {
  if (!isValidUrl(url)) {
    return ctx.reply(MESSAGES.UNSUPPORTED);
  }

  const platform = extractPlatformFromUrl(url);
  if (!platform) {
    return ctx.reply(MESSAGES.UNSUPPORTED);
  }

  // Check coins / daily limit
  const hasFree = await canDownloadFree(ctx.from.id);
  const prem = await isPremium(ctx.from.id);
  const userCoins = ctx.user?.coins || 0;

  const cost = config.coinsPerDownload;

  if (!prem && !hasFree && userCoins < cost) {
    return ctx.reply(MESSAGES.NO_COINS + `\n\nYou have ${userCoins} coins.`);
  }

  // Show processing
  const processingMsg = await ctx.reply(`⚡ Processing ${platform} link...\n📥 Fetching info...`);

  try {
    const info = await getVideoInfo(url, platform);

    if (!info || !info.formats || info.formats.length === 0) {
      await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, '❌ Could not extract video info.');
      return;
    }

    // Store context for callback
    ctx.session = ctx.session || {};
    ctx.session.pendingDownload = {
      url,
      platform,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      cost,
      userId: ctx.from.id,
      timestamp: Date.now(),
    };

    // Build quality keyboard
    const buttons = QUALITY_OPTIONS.map(q => 
      Markup.button.callback(
        `${q.label}${q.value === 'audio' ? ' 🎵' : ''}`, 
        `dl_${ctx.from.id}_${q.value}_${Date.now()}`
      )
    );

    const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });

    const metaText = 
      `🎬 <b>${info.title || 'Video'}</b>\n` +
      (info.duration ? `⏱ ${info.duration}\n` : '') +
      `🌐 ${platform}\n\n` +
      `Choose quality below:`;

    await ctx.telegram.editMessageText(
      ctx.chat.id, 
      processingMsg.message_id, 
      null, 
      metaText, 
      { parse_mode: 'HTML', ...keyboard }
    );

  } catch (err) {
    logger.error('handleLink error', err);

    let userMessage = MESSAGES.ERROR;

    if (err.message === 'VIDEO_UNAVAILABLE') {
      userMessage = '❌ This video is unavailable, private, or deleted.';
    } else if (err.message === 'TIMEOUT') {
      userMessage = '⏳ Taking too long to fetch info. Please try again.';
    } else if (err.message === 'YT_DLP_NOT_FOUND') {
      userMessage = '⚠️ yt-dlp is not installed or not in PATH. Please install it.';
    }

    await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, userMessage).catch(() => {});
  }
}
