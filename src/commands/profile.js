import { getUserProfile } from '../database/index.js';
import config from '../config/index.js';
import { MESSAGES } from '../utils/constants.js';

export async function profileCommand(ctx) {
  const profile = await getUserProfile(ctx.from.id);

  const premiumText = profile.premium ? '⭐ Premium' : 'Free';
  const coins = profile.coins || 0;
  const downloads = profile.downloads || 0;
  const daily = profile.dailyDownloads || 0;

  const refStats = profile.referrals || { total: 0, successful: 0, rewarded: 0 };

  await ctx.replyWithHTML(
    `<b>👤 Your Profile</b>\n\n` +
    `🆔 ID: <code>${ctx.from.id}</code>\n` +
    `👤 Username: ${profile.username ? '@' + profile.username : 'N/A'}\n` +
    `💎 Status: ${premiumText}\n\n` +
    `🪙 Coins: <b>${coins}</b>\n` +
    `📥 Total downloads: <b>${downloads}</b>\n` +
    `📅 Today: <b>${daily}/${config.dailyFreeDownloads || 5}</b> free\n\n` +
    `<b>🤝 Referrals</b>\n` +
    `Invited: ${refStats.total}\n` +
    `Successful: ${refStats.successful}\n` +
    `Rewards earned: ${refStats.rewarded} coins\n\n` +
    `Use /invite to earn more coins!`
  );
}
