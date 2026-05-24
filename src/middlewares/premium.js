import { isPremium } from '../database/index.js';

export async function premiumMiddleware(ctx, next) {
  if (!ctx.from) return next();
  try {
    ctx.isPremium = await isPremium(ctx.from.id);
  } catch (e) {
    ctx.isPremium = false;
  }
  return next();
}
