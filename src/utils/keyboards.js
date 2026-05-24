import { Markup } from 'telegraf';

export function getMainMenuInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📥 Download', 'menu_download'),
      Markup.button.callback('👑 Premium', 'menu_premium'),
    ],
    [
      Markup.button.callback('💰 Earn Coins', 'menu_earn'),
      Markup.button.callback('👥 Referral', 'menu_referral'),
    ],
    [
      Markup.button.callback('📜 History', 'menu_history'),
      Markup.button.callback('⚙️ Profile', 'menu_profile'),
    ],
    [Markup.button.callback('❓ Help', 'menu_help')],
  ]);
}

export function getQualityKeyboard(userId, timestamp) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('360p', `dl_${userId}_360_${timestamp}`),
      Markup.button.callback('720p', `dl_${userId}_720_${timestamp}`),
    ],
    [
      Markup.button.callback('1080p', `dl_${userId}_1080_${timestamp}`),
      Markup.button.callback('🎵 MP3 Audio', `dl_${userId}_audio_${timestamp}`),
    ],
    [Markup.button.callback('📥 Direct Download (Best)', `dl_${userId}_best_${timestamp}`)],
  ]);
}

export function getPremiumKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💎 Buy Premium (Coming Soon)', 'buy_premium')],
    [Markup.button.callback('🎁 Daily Check-in', 'daily_checkin')],
  ]);
}
