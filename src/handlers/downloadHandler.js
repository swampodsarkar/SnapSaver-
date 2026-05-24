import { downloadVideo } from '../services/ytdlp.js';
import { enqueueDownload } from '../services/queue.js';
import { recordDownload, updateBalance, isPremium, canDownloadFree } from '../database/index.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs-extra';
import { Markup } from 'telegraf';
import { formatFileSize } from '../utils/helpers.js';

export async function processQualitySelection(ctx, data) {
  // data format: dl_USERID_QUALITY_TIMESTAMP (we ignore timestamp)
  const parts = data.split('_');
  if (parts.length < 4) {
    return ctx.reply('❌ Invalid selection.');
  }

  const [, userId, quality] = parts;
  if (String(ctx.from.id) !== userId) {
    return ctx.answerCbQuery('This is not your download request.').catch(() => {});
  }

  const pending = ctx.session?.pendingDownload;
  if (!pending || Date.now() - pending.timestamp > 1000 * 60 * 10) { // 10 min expiry
    return ctx.reply('❌ Download session expired. Please send the link again.');
  }

  const { url, platform, title, cost } = pending;

  await ctx.answerCbQuery(`Downloading ${quality}...`).catch(() => {});

  // Check again if user can afford (in case of race)
  const prem = await isPremium(ctx.from.id);
  const freeAllowed = await canDownloadFree(ctx.from.id);
  const user = ctx.user || { coins: 0 };

  const actualCost = (prem || freeAllowed) ? 0 : cost;

  if (actualCost > 0 && (user.coins || 0) < actualCost) {
    return ctx.reply('💰 Insufficient coins.');
  }

  // Start progress message
  const progressMsg = await ctx.reply(`⬇️ Downloading <b>${quality}</b> quality...\nPlease wait...`, { parse_mode: 'HTML' });

  try {
    const filePath = await enqueueDownload(async () => {
      let progress = 0;

      const updateProgress = async (pct) => {
        if (pct - progress > 10) {
          progress = pct;
          try {
            await ctx.telegram.editMessageText(
              ctx.chat.id,
              progressMsg.message_id,
              null,
              `⬇️ Downloading... ${Math.floor(pct)}%`
            );
          } catch (_) {}
        }
      };

      return downloadVideo({
        url,
        format: quality,
        outputName: `${platform}_${Date.now()}`,
        platform,
        onProgress: updateProgress,
      });
    }, `video-${platform}-${quality}`);

    // Record usage
    await recordDownload(ctx.from.id, actualCost);

    // Send the file
    await ctx.telegram.editMessageText(ctx.chat.id, progressMsg.message_id, null, '📤 Uploading to Telegram...');

    const stat = await fs.stat(filePath);
    const fileSize = formatFileSize(stat.size);

    const caption = 
      `✅ <b>${title || 'Video'} • ${quality}</b>\n` +
      `📦 ${fileSize} • ${platform}\n` +
      `🤖 @${ctx.botInfo?.username || 'bot'}`;

    if (quality === 'audio' || filePath.endsWith('.mp3')) {
      await ctx.replyWithAudio(
        { source: filePath },
        { caption, parse_mode: 'HTML' }
      );
    } else {
      await ctx.replyWithVideo(
        { source: filePath },
        { caption, parse_mode: 'HTML', supports_streaming: true }
      );
    }

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await ctx.telegram.deleteMessage(ctx.chat.id, progressMsg.message_id).catch(() => {});

    logger.info(`Download completed for ${ctx.from.id}: ${platform} ${quality}`);

  } catch (err) {
    logger.error('Download failed', err);
    await ctx.telegram.editMessageText(ctx.chat.id, progressMsg.message_id, null, '❌ Download failed. Please try a different quality or link.').catch(() => {});
  } finally {
    // Clear pending
    if (ctx.session) delete ctx.session.pendingDownload;
  }
}
