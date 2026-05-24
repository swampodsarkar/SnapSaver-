import { getAllUserIds } from '../../database/index.js';
import { logger } from '../../utils/logger.js';

export async function broadcastCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const message = args.join(' ');

  if (!message) {
    return ctx.reply('Usage: /broadcast <message>');
  }

  const userIds = await getAllUserIds();
  let sent = 0, failed = 0;

  ctx.reply(`📢 Broadcasting to ${userIds.length} users...`).catch(() => {});

  for (const uid of userIds) {
    try {
      await ctx.telegram.sendMessage(uid, `📢 ${message}`);
      sent++;
      // Small delay to avoid flood
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      failed++;
    }
  }

  logger.info(`Broadcast done: sent=${sent} failed=${failed}`);
  await ctx.reply(`✅ Broadcast complete.\nSent: ${sent}\nFailed: ${failed}`);
}
