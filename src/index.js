import { Telegraf, session } from 'telegraf';
import config, { ensureDirectories } from './config/index.js';
import { initDatabase } from './database/index.js';
import { logger } from './utils/logger.js';
import { userMiddleware } from './middlewares/auth.js';
import { rateLimitMiddleware } from './middlewares/rateLimit.js';
import { adminMiddleware } from './middlewares/admin.js';
import { premiumMiddleware } from './middlewares/premium.js';

// Command handlers
import { startCommand } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { profileCommand } from './commands/profile.js';
import { inviteCommand } from './commands/invite.js';
import { premiumCommand } from './commands/premium.js';
import { statsCommand } from './commands/stats.js';

// Menu button handlers need direct access

// Admin commands
import { adminStatsCommand } from './commands/admin/stats.js';
import { broadcastCommand } from './commands/admin/broadcast.js';
import { addCoinsCommand } from './commands/admin/addcoins.js';
import { addPremiumCommand } from './commands/admin/addpremium.js';
import { banCommand, unbanCommand } from './commands/admin/ban.js';

// Link handler
import { handleLink } from './handlers/linkHandler.js';
import { processQualitySelection } from './handlers/downloadHandler.js';

// Queue & download service
import { downloadQueue } from './services/queue.js';

// Cleanup
import { cleanupOldDownloads } from './utils/cleanup.js';
import cron from 'node-cron';

async function bootstrap() {
  if (!config.botToken) {
    console.error('❌ BOT_TOKEN is missing in .env');
    process.exit(1);
  }

  await ensureDirectories();
  await initDatabase();
  await cleanupOldDownloads();

  const bot = new Telegraf(config.botToken, {
    handlerTimeout: 300000, // 5 min for long downloads
  });

  // Core middlewares (order matters)
  bot.use(session());
  bot.use(userMiddleware);
  bot.use(premiumMiddleware);

  // Global error handler
  bot.catch((err, ctx) => {
    logger.error('Bot error', err);
    if (ctx && ctx.reply) {
      ctx.reply('❌ Unexpected error occurred. Our team has been notified.').catch(() => {});
    }
  });

  // Commands
  bot.start(startCommand);
  bot.command('help', helpCommand);
  bot.command('profile', profileCommand);
  bot.command('invite', inviteCommand);
  bot.command('premium', premiumCommand);
  bot.command('stats', statsCommand);

  // Admin commands (protected)
  bot.command('adminstats', adminMiddleware, adminStatsCommand);
  bot.command('broadcast', adminMiddleware, broadcastCommand);
  bot.command('addcoins', adminMiddleware, addCoinsCommand);
  bot.command('addpremium', adminMiddleware, addPremiumCommand);
  bot.command('ban', adminMiddleware, banCommand);
  bot.command('unban', adminMiddleware, unbanCommand);

  // Text handler for links only (menu is now inline callbacks)
  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();

    // Skip commands
    if (text.startsWith('/')) return next();

    // Auto link detection
    if (text.startsWith('http')) {
      return rateLimitMiddleware(ctx, () => handleLink(ctx, text));
    }

    return next();
  });

  // Callback query handler (quality downloads + new inline main menu)
  bot.on('callback_query', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const data = ctx.callbackQuery.data;

    // Download quality selection
    if (data.startsWith('dl_')) {
      return processQualitySelection(ctx, data);
    }

    // Main Menu inline actions
    const lang = ctx.from?.language_code?.startsWith('bn') ? 'bn' : 'en';

    if (data === 'menu_download') {
      return ctx.replyWithHTML(lang === 'bn' 
        ? '📥 যেকোনো ভিডিও লিংক পাঠান (YouTube, TikTok, Instagram, Facebook, X, Vimeo)'
        : '📥 Send any supported video link (YouTube, TikTok, Instagram, Facebook, X/Twitter, Vimeo)');
    }

    if (data === 'menu_premium') {
      return premiumCommand(ctx);
    }

    if (data === 'menu_referral') {
      return inviteCommand(ctx);
    }

    if (data === 'menu_profile') {
      return profileCommand(ctx);
    }

    if (data === 'menu_help') {
      return helpCommand(ctx);
    }

    if (data === 'menu_earn') {
      return ctx.replyWithHTML(
        lang === 'bn'
          ? `💰 <b>কয়েন আয় করুন</b>\n\n• দৈনিক চেক-ইন (শীঘ্রই)\n• রেফারেল: /invite\n• টাস্ক (শীঘ্রই আসছে)`
          : `💰 <b>Earn Coins</b>\n\n• Daily check-in (coming soon)\n• Refer friends: Use /invite\n• Sponsored tasks (coming soon)`
      );
    }

    if (data === 'menu_history') {
      // Basic history - we'll enhance later
      return ctx.replyWithHTML(
        lang === 'bn'
          ? `📜 <b>আপনার ডাউনলোড হিস্ট্রি</b>\n\n(শীঘ্রই আরও বিস্তারিত হিস্ট্রি দেখা যাবে)`
          : `📜 <b>Your Download History</b>\n\n(Full history with dates coming in next update)`
      );
    }
  });

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // Schedule periodic cleanup every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    cleanupOldDownloads().catch(() => {});
  });

  await bot.launch();
  logger.info('🚀 Telegram Video Downloader Bot started successfully');
}

bootstrap().catch(err => {
  logger.error('Fatal bootstrap error', err);
  process.exit(1);
});
