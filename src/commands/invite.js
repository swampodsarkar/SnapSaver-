import { Markup } from 'telegraf';
import { generateReferralCode } from '../utils/helpers.js';
import { addReferral } from '../database/index.js';

export async function inviteCommand(ctx) {
  const botUsername = ctx.botInfo?.username || 'yourbot';
  const refCode = generateReferralCode(ctx.from.id);
  const inviteLink = `https://t.me/${botUsername}?start=${refCode}`;

  // Track that this user has referral capability
  await addReferral(ctx.from.id, 'pending');

  await ctx.replyWithHTML(
    `<b>🤝 Referral Program</b>\n\n` +
    `Invite friends and earn <b>10 coins</b> for each successful referral!\n\n` +
    `Your unique link:\n` +
    `<code>${inviteLink}</code>\n\n` +
    `• Friend must start the bot using your link\n` +
    `• They must complete at least 1 download\n` +
    `• You get +10 coins instantly\n\n` +
    `Share your link and grow your coins!`,
    Markup.inlineKeyboard([
      [Markup.button.url('📤 Share Invite Link', `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Download videos fast with no watermark!`)],
    ])
  );
}
