import fs from 'fs-extra';
import path from 'path';
import config from '../config/index.js';
import { logger } from './logger.js';

const MAX_AGE_MS = 1000 * 60 * 60 * 2; // 2 hours

export async function cleanupOldDownloads() {
  try {
    const dir = config.downloadsPath;
    if (!await fs.pathExists(dir)) return;

    const files = await fs.readdir(dir);
    let cleaned = 0;

    for (const file of files) {
      const full = path.join(dir, file);
      try {
        const stat = await fs.stat(full);
        if (Date.now() - stat.mtimeMs > MAX_AGE_MS) {
          await fs.remove(full);
          cleaned++;
        }
      } catch (_) {}
    }

    if (cleaned > 0) {
      logger.info(`Cleanup: removed ${cleaned} old download files`);
    }
  } catch (err) {
    logger.error('Cleanup error', err);
  }
}
