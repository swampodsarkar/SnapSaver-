import { getGlobalStats } from '../database/index.js';

export async function statsCommand(ctx) {
  const stats = await getGlobalStats();
  await ctx.replyWithHTML(
    `<b>📊 Bot Statistics</b>\n\n` +
    `👥 Total users: <b>${stats.totalUsers || 0}</b>\n` +
    `📥 Total downloads: <b>${stats.totalDownloads || 0}</b>\n\n` +
    `Fast & reliable since launch.`
  );
}
