import { Markup } from 'telegraf';
import { addReferral, getUser, updateUser } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';
import { getMainMenuInlineKeyboard } from '../utils/keyboards.js';

export async function startCommand(ctx) {
  const payload = ctx.startPayload;

  // Handle referral
  if (payload && payload.startsWith('ref_')) {
    const referrerId = payload.split('_')[1];
    if (referrerId && referrerId !== String(ctx.from.id)) {
      try {
        await addReferral(referrerId, ctx.from.id);
        const user = await getUser(ctx.from.id);
        if (!user.referredBy) {
          await updateUser(ctx.from.id, { referredBy: referrerId });
        }
        ctx.telegram.sendMessage(referrerId, 
          `🎉 New referral joined!\n\n` +
          `User: ${ctx.from.first_name || 'Someone'}\n` +
          `You will receive +10 coins after their first successful download.`
        ).catch(() => {});
        logger.info(`Referral tracked: ${referrerId} <- ${ctx.from.id}`);
      } catch (e) {
        logger.error('Referral error', e);
      }
    }
  }

  // Send beautiful welcome + inline main menu (above chat)
  const lang = ctx.from.language_code?.startsWith('bn') ? 'bn' : 'en';
  const welcomeText = MESSAGES.WELCOME[lang] || MESSAGES.WELCOME.en;

  await ctx.replyWithHTML(welcomeText);

  // Send the clean inline menu
  await ctx.replyWithHTML(
    lang === 'bn' 
      ? `📋 <b>মেইন মেনু</b> — নিচের বাটনগুলো ব্যবহার করুন:`
      : `📋 <b>Main Menu</b> — Use the buttons below:`,
    getMainMenuInlineKeyboard()
  );
}
