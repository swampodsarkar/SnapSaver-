import fs from 'fs-extra';
import path from 'path';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getTodayDateString } from '../utils/helpers.js';

let firebaseApp = null;
let db = null;
let isFirebaseReady = false;

// Local JSON fallback (always available)
const DATA_FILES = {
  USERS: path.join(config.dataDir, 'users.json'),
  STATS: path.join(config.dataDir, 'stats.json'),
  PREMIUM: path.join(config.dataDir, 'premium.json'),
  REFERRALS: path.join(config.dataDir, 'referrals.json'),
};

let localCache = {
  users: {},
  stats: { totalDownloads: 0, totalUsers: 0 },
  premium: {},
  referrals: {},
};

async function loadJson(file, defaultValue = {}) {
  try {
    await fs.ensureFile(file);
    const data = await fs.readJson(file, { throws: false });
    return data || defaultValue;
  } catch (err) {
    logger.error('Local DB load error', file, err.message);
    return defaultValue;
  }
}

async function saveJson(file, data) {
  try {
    await fs.writeJson(file, data, { spaces: 2 });
  } catch (err) {
    logger.error('Local DB save error', file, err.message);
    throw err;
  }
}

// ==================== FIREBASE INITIALIZATION ====================
async function initFirebase() {
  if (isFirebaseReady) return;

  try {
    const { default: admin } = await import('firebase-admin');

    if (!config.firebase?.projectId && !config.firebase?.databaseURL) {
      throw new Error('Firebase config missing');
    }

    let credential;
    const hasServiceAccount = config.firebase.serviceAccountPath && await fs.pathExists(config.firebase.serviceAccountPath);

    if (hasServiceAccount) {
      const serviceAccount = await fs.readJson(config.firebase.serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(sa);
      } catch (e) {
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    }

    const dbUrl = config.firebase.databaseURL || `https://${config.firebase.projectId}-default-rtdb.firebaseio.com`;

    if (credential) {
      firebaseApp = admin.initializeApp({
        credential,
        databaseURL: dbUrl,
      });
    } else {
      // Fallback: initialize with databaseURL only (works for many Realtime DB setups)
      firebaseApp = admin.initializeApp({
        databaseURL: dbUrl,
      });
      logger.warn('Firebase initialized without credentials (using databaseURL only). Update security rules if needed.');
    }

    db = admin.database();
    isFirebaseReady = true;
    logger.info('Firebase Realtime Database connected successfully');
  } catch (err) {
    logger.error('Firebase init failed, falling back to local JSON', err.message);
    isFirebaseReady = false;
  }
}

// ==================== UNIFIED DATABASE API ====================

export async function initDatabase() {
  await fs.ensureDir(config.dataDir);

  if (config.useFirebase) {
    await initFirebase();
  }

  if (!isFirebaseReady) {
    // Load local JSON cache
    localCache.users = await loadJson(DATA_FILES.USERS, {});
    localCache.stats = await loadJson(DATA_FILES.STATS, { totalDownloads: 0, totalUsers: 0 });
    localCache.premium = await loadJson(DATA_FILES.PREMIUM, {});
    localCache.referrals = await loadJson(DATA_FILES.REFERRALS, {});
    logger.info('Local JSON database initialized (Firebase disabled or failed)');
  }
}

// ---------- USER ----------
export async function getUser(userId) {
  const id = String(userId);

  if (isFirebaseReady && db) {
    const snap = await db.ref(`users/${id}`).once('value');
    if (snap.exists()) return snap.val();

    // Create default user in Firebase
    const newUser = {
      userId: id,
      username: null,
      firstName: null,
      coins: 0,
      downloads: 0,
      premium: false,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      dailyDownloads: 0,
      lastDownloadDate: null,
      referredBy: null,
    };
    await db.ref(`users/${id}`).set(newUser);
    return newUser;
  }

  // Local fallback
  if (!localCache.users[id]) {
    localCache.users[id] = {
      userId: id,
      username: null,
      firstName: null,
      coins: 0,
      downloads: 0,
      premium: false,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      dailyDownloads: 0,
      lastDownloadDate: null,
      referredBy: null,
    };
    await saveUser(userId, localCache.users[id]);
  }
  return localCache.users[id];
}

export async function saveUser(userId, userData) {
  const id = String(userId);
  const updated = { ... (await getUser(id)), ...userData, userId: id, lastActive: new Date().toISOString() };

  if (isFirebaseReady && db) {
    await db.ref(`users/${id}`).set(updated);
    return;
  }

  localCache.users[id] = updated;
  await saveJson(DATA_FILES.USERS, localCache.users);
}

export async function updateUser(userId, updates) {
  const user = await getUser(userId);
  Object.assign(user, updates, { lastActive: new Date().toISOString() });
  await saveUser(userId, user);
  return user;
}

// ---------- COINS & DOWNLOADS ----------
export async function updateBalance(userId, amount) {
  const user = await getUser(userId);
  user.coins = Math.max(0, (user.coins || 0) + amount);
  await saveUser(userId, user);
  return user.coins;
}

export async function canDownloadFree(userId) {
  const user = await getUser(userId);
  const today = getTodayDateString();
  if (user.lastDownloadDate !== today) {
    user.dailyDownloads = 0;
    user.lastDownloadDate = today;
    await saveUser(userId, user);
  }
  return (user.dailyDownloads || 0) < config.dailyFreeDownloads;
}

export async function recordDownload(userId, cost = 0) {
  const user = await getUser(userId);
  const today = getTodayDateString();
  const isFirstDownload = (user.downloads || 0) === 0;

  user.downloads = (user.downloads || 0) + 1;
  user.lastDownloadDate = today;

  if (user.lastDownloadDate !== today) {
    user.dailyDownloads = 1;
  } else {
    user.dailyDownloads = (user.dailyDownloads || 0) + 1;
  }

  if (cost > 0) user.coins = Math.max(0, (user.coins || 0) - cost);

  await saveUser(userId, user);

  if (isFirebaseReady && db) {
    await db.ref('stats/totalDownloads').transaction(val => (val || 0) + 1);
  } else {
    localCache.stats.totalDownloads = (localCache.stats.totalDownloads || 0) + 1;
    await saveJson(DATA_FILES.STATS, localCache.stats);
  }

  // Referral reward on first download (same logic as before)
  if (isFirstDownload && user.referredBy) {
    try {
      await markReferralSuccessful(user.referredBy);
      await rewardReferral(user.referredBy);
    } catch (e) {
      logger.error('Referral reward error', e);
    }
  }
}

// ---------- REFERRALS ----------
export async function addReferral(referrerId, referredId) {
  const refKey = String(referrerId);
  if (isFirebaseReady && db) {
    const refSnap = await db.ref(`referrals/${refKey}`).once('value');
    const ref = refSnap.val() || { total: 0, successful: 0, rewarded: 0, referredUsers: [] };
    if (!ref.referredUsers.includes(String(referredId))) {
      ref.referredUsers.push(String(referredId));
      ref.total += 1;
      await db.ref(`referrals/${refKey}`).set(ref);
    }
    return ref;
  }

  // Local
  if (!localCache.referrals[refKey]) {
    localCache.referrals[refKey] = { total: 0, successful: 0, rewarded: 0, referredUsers: [] };
  }
  const ref = localCache.referrals[refKey];
  if (!ref.referredUsers.includes(String(referredId))) {
    ref.referredUsers.push(String(referredId));
    ref.total += 1;
    await saveJson(DATA_FILES.REFERRALS, localCache.referrals);
  }
  return ref;
}

export async function markReferralSuccessful(referrerId) {
  const refKey = String(referrerId);
  if (isFirebaseReady && db) {
    const refSnap = await db.ref(`referrals/${refKey}`).once('value');
    const ref = refSnap.val() || {};
    ref.successful = (ref.successful || 0) + 1;
    await db.ref(`referrals/${refKey}`).set(ref);
    return;
  }
  if (localCache.referrals[refKey]) {
    localCache.referrals[refKey].successful = (localCache.referrals[refKey].successful || 0) + 1;
    await saveJson(DATA_FILES.REFERRALS, localCache.referrals);
  }
}

export async function rewardReferral(referrerId, amount = null) {
  const reward = amount || config.referralReward;
  const newBalance = await updateBalance(referrerId, reward);

  if (isFirebaseReady && db) {
    const refSnap = await db.ref(`referrals/${referrerId}`).once('value');
    const ref = refSnap.val() || {};
    ref.rewarded = (ref.rewarded || 0) + reward;
    await db.ref(`referrals/${referrerId}`).set(ref);
  } else if (localCache.referrals[referrerId]) {
    localCache.referrals[referrerId].rewarded = (localCache.referrals[referrerId].rewarded || 0) + reward;
    await saveJson(DATA_FILES.REFERRALS, localCache.referrals);
  }
  return newBalance;
}

export async function getReferralStats(userId) {
  const refKey = String(userId);
  if (isFirebaseReady && db) {
    const snap = await db.ref(`referrals/${refKey}`).once('value');
    return snap.val() || { total: 0, successful: 0, rewarded: 0 };
  }
  return localCache.referrals[refKey] || { total: 0, successful: 0, rewarded: 0 };
}

// ---------- PREMIUM ----------
export async function isPremium(userId) {
  const id = String(userId);
  if (isFirebaseReady && db) {
    const snap = await db.ref(`premium/${id}`).once('value');
    const prem = snap.val();
    if (!prem) return false;
    if (prem.expiresAt && new Date(prem.expiresAt) < new Date()) return false;
    return true;
  }
  const prem = localCache.premium[id];
  if (!prem) return false;
  if (prem.expiresAt && new Date(prem.expiresAt) < new Date()) return false;
  return true;
}

export async function addPremium(userId, days = 30) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  const data = {
    userId: String(userId),
    grantedAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
    type: 'manual',
  };

  if (isFirebaseReady && db) {
    await db.ref(`premium/${userId}`).set(data);
  } else {
    localCache.premium[String(userId)] = data;
    await saveJson(DATA_FILES.PREMIUM, localCache.premium);
  }
}

export async function removePremium(userId) {
  if (isFirebaseReady && db) {
    await db.ref(`premium/${userId}`).remove();
  } else {
    delete localCache.premium[String(userId)];
    await saveJson(DATA_FILES.PREMIUM, localCache.premium);
  }
}

// ---------- STATS & HELPERS ----------
export async function getGlobalStats() {
  if (isFirebaseReady && db) {
    const totalDownloadsSnap = await db.ref('stats/totalDownloads').once('value');
    const totalUsersSnap = await db.ref('users').once('value');
    return {
      totalDownloads: totalDownloadsSnap.val() || 0,
      totalUsers: totalUsersSnap.numChildren() || 0,
    };
  }
  return {
    ...localCache.stats,
    totalUsers: Object.keys(localCache.users).length,
  };
}

export async function getUserProfile(userId) {
  const user = await getUser(userId);
  const isPrem = await isPremium(userId);
  const refs = await getReferralStats(userId);
  return { ...user, premium: isPrem, referrals: refs };
}

export async function getAllUserIds() {
  if (isFirebaseReady && db) {
    const snap = await db.ref('users').once('value');
    return snap.exists() ? Object.keys(snap.val()) : [];
  }
  return Object.keys(localCache.users);
}
