import config from '../config/index.js';

export function adminMiddleware(ctx, next) {
  if (!ctx.from) return;
  const isAdmin = config.adminIds.includes(String(ctx.from.id));
  if (!isAdmin) {
    ctx.reply('⛔ Admin only command.');
    return;
  }
  ctx.isAdmin = true;
  return next();
}
