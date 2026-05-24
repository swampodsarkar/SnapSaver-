import config from '../config/index.js';

const levels = ['error', 'warn', 'info', 'debug'];

function shouldLog(level) {
  const current = levels.indexOf(config.logLevel);
  const target = levels.indexOf(level);
  return target <= current;
}

export const logger = {
  info: (...args) => {
    if (shouldLog('info')) console.log('[INFO]', new Date().toISOString(), ...args);
  },
  warn: (...args) => {
    if (shouldLog('warn')) console.warn('[WARN]', new Date().toISOString(), ...args);
  },
  error: (...args) => {
    if (shouldLog('error')) console.error('[ERROR]', new Date().toISOString(), ...args);
  },
  debug: (...args) => {
    if (shouldLog('debug')) console.log('[DEBUG]', new Date().toISOString(), ...args);
  },
};
