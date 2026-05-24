import { addPremium } from '../../database/index.js';

export async function addPremiumCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 1) {
    return ctx.reply('Usage: /addpremium <userId> [days]');
  }

  const targetId = args[0];
  const days = parseInt(args[1] || '30', 10);

  try {
    await addPremium(targetId, days);
    await ctx.reply(`✅ Premium granted to ${targetId} for ${days} days.`);
  } catch (e) {
    await ctx.reply('❌ Failed to grant premium.');
  }
}
