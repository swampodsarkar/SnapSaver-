import PQueue from 'p-queue';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export const downloadQueue = new PQueue({
  concurrency: 2, // simultaneous yt-dlp jobs
  interval: 1000,
  intervalCap: 5,
});

export async function enqueueDownload(jobFn, description = 'download') {
  if (downloadQueue.size >= config.queueMaxSize) {
    throw new Error('QUEUE_FULL');
  }

  logger.info(`Queueing ${description}. Queue size: ${downloadQueue.size}`);
  return downloadQueue.add(jobFn);
}
