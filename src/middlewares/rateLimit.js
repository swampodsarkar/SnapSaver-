import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const cooldowns = new Map(); // userId -> timestamp
const hourlyCounts = new Map(); // userId -> {count, resetTime}

export function rateLimitMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const userId = ctx.from.id;
  const now = Date.now();

  // Cooldown check
  const last = cooldowns.get(userId) || 0;
  if (now - last < config.cooldownSeconds * 1000) {
    // Only warn once per cooldown window
    if (!ctx.cooldownWarned) {
      ctx.reply('⏳ Slow down! Please wait before sending another request.');
      ctx.cooldownWarned = true;
    }
    return; // block
  }

  // Hourly limit
  let hourly = hourlyCounts.get(userId);
  if (!hourly || now > hourly.resetTime) {
    hourly = { count: 0, resetTime: now + 60 * 60 * 1000 };
    hourlyCounts.set(userId, hourly);
  }

  if (hourly.count >= config.maxDownloadsPerHour) {
    ctx.reply('🚦 Hourly download limit reached. Try again later.');
    return;
  }

  // Update trackers
  cooldowns.set(userId, now);
  hourly.count += 1;

  // Clean old cooldowns occasionally
  if (cooldowns.size > 1000) {
    for (const [id, ts] of cooldowns) {
      if (now - ts > 60000) cooldowns.delete(id);
    }
  }

  return next();
}
