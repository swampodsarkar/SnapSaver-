export async function premiumCommand(ctx) {
  const isPrem = ctx.isPremium;

  await ctx.replyWithHTML(
    `<b>⭐ Premium Benefits</b>\n\n` +
    `${isPrem ? '✅ You are Premium!' : 'Unlock unlimited downloads and priority processing.'}\n\n` +
    `<b>Premium Perks:</b>\n` +
    `• Unlimited daily downloads\n` +
    `• No cooldowns\n` +
    `• Priority queue\n` +
    `• Higher quality options\n` +
    `• Faster downloads\n` +
    `• Exclusive future features\n\n` +
    `Contact admin or check future monetization options to get Premium.`
  );
}
