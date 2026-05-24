import { updateBalance } from '../../database/index.js';

export async function addCoinsCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    return ctx.reply('Usage: /addcoins <userId> <amount>');
  }

  const [targetId, amountStr] = args;
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) return ctx.reply('Amount must be number.');

  try {
    const newBal = await updateBalance(targetId, amount);
    await ctx.reply(`✅ Added ${amount} coins to ${targetId}. New balance: ${newBal}`);
  } catch (e) {
    await ctx.reply('❌ Failed to update balance.');
  }
}
