import { logger } from '../../utils/logger.js';

const bannedUsers = new Set();

export function banCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) return ctx.reply('Usage: /ban <userId>');

  bannedUsers.add(args[0]);
  logger.warn(`User banned: ${args[0]}`);
  ctx.reply(`✅ Banned ${args[0]}`);
}

export function unbanCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) return ctx.reply('Usage: /unban <userId>');

  bannedUsers.delete(args[0]);
  ctx.reply(`✅ Unbanned ${args[0]}`);
}

// Export for use in other middlewares
export function isBanned(userId) {
  return bannedUsers.has(String(userId));
}
