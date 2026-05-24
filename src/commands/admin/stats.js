import { getGlobalStats, getAllUserIds } from '../../database/index.js';

export async function adminStatsCommand(ctx) {
  const stats = await getGlobalStats();
  const userCount = (await getAllUserIds()).length;

  await ctx.replyWithHTML(
    `<b>🛠 Admin Stats</b>\n\n` +
    `Users: ${userCount}\n` +
    `Downloads: ${stats.totalDownloads}\n` +
    `Admins: ${ctx.config?.adminIds?.length || 'N/A'}`
  );
}
