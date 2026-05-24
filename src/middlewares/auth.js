import { getUser, updateUser } from '../database/index.js';
import { logger } from '../utils/logger.js';

export async function userMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const userId = ctx.from.id;
  try {
    const user = await getUser(userId);

    // Update basic profile info
    const updates = {};
    if (ctx.from.username && user.username !== ctx.from.username) updates.username = ctx.from.username;
    if (ctx.from.first_name && user.firstName !== ctx.from.first_name) updates.firstName = ctx.from.first_name;

    if (Object.keys(updates).length > 0) {
      await updateUser(userId, updates);
    }

    ctx.user = user;
    ctx.isPremium = user.premium || false; // Will be overridden by premium check middleware if needed
  } catch (err) {
    logger.error('userMiddleware error', err);
  }
  return next();
}
