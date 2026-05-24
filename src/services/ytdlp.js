import { execa } from 'execa';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { sanitizeFilename } from '../utils/helpers.js';
import fs from 'fs-extra';
import path from 'path';

const DOWNLOADS_DIR = config.downloadsPath;

// Run yt-dlp to get JSON info (formats, title, etc)
export async function getVideoInfo(url, platform) {
  try {
    const args = [
      '--dump-json',
      '--no-warnings',
      '--no-playlist',
      '--skip-download',
      url,
    ];

    // Special flags for platforms
    if (platform === 'tiktok') {
      args.push('--no-check-certificate');
    }

    const { stdout } = await execa(config.ytDlpPath, args, { timeout: 30000 });
    const info = JSON.parse(stdout);

    // Normalize
    return {
      title: info.title || 'video',
      duration: info.duration_string || (info.duration ? `${Math.floor(info.duration / 60)}:${(info.duration % 60).toString().padStart(2, '0')}` : null),
      thumbnail: info.thumbnail,
      formats: info.formats || [],
      ext: info.ext || 'mp4',
      url,
    };
  } catch (err) {
    const errorMsg = err.stderr || err.message || err;
    logger.error('yt-dlp getVideoInfo failed', errorMsg);

    // Provide better error for common cases
    if (err.exitCode === 1 || errorMsg.includes('ERROR:')) {
      throw new Error('VIDEO_UNAVAILABLE');
    }
    if (err.timedOut) {
      throw new Error('TIMEOUT');
    }
    if (errorMsg.includes('command not found') || errorMsg.includes('not recognized')) {
      throw new Error('YT_DLP_NOT_FOUND');
    }

    throw new Error('UNKNOWN_ERROR');
  }
}

// Actual download function returning file path
export async function downloadVideo({ url, format, outputName, platform, onProgress }) {
  await fs.ensureDir(DOWNLOADS_DIR);

  const safeName = sanitizeFilename(outputName || 'video');
  const outputTemplate = path.join(DOWNLOADS_DIR, `${safeName}_%(title)s.%(ext)s`);

  let formatSelector = 'best';
  if (format === 'audio') {
    formatSelector = 'bestaudio/best';
  } else if (format) {
    formatSelector = `best[height<=${format}]`;
  }

  const args = [
    '--format', formatSelector,
    '--output', outputTemplate,
    '--no-playlist',
    '--no-warnings',
    '--progress',
    '--newline',
    url,
  ];

  if (platform === 'tiktok') {
    args.push('--no-check-certificate');
  }

  if (format === 'audio') {
    args.push('--extract-audio', '--audio-format', 'mp3');
  }

  logger.info(`Starting yt-dlp download: ${url} format=${format}`);

  return new Promise((resolve, reject) => {
    const child = execa(config.ytDlpPath, args, {
      cwd: DOWNLOADS_DIR,
    });

    let lastProgress = '';
    let finalFile = null;

    child.stdout.on('data', (data) => {
      const str = data.toString();
      // Parse progress lines like [download]  45.2% ...
      const progressMatch = str.match(/\[download\]\s+([\d.]+)%/);
      if (progressMatch && onProgress) {
        const pct = parseFloat(progressMatch[1]);
        if (pct !== lastProgress) {
          lastProgress = pct;
          onProgress(pct);
        }
      }
      // Detect final filename from yt-dlp output
      const filenameMatch = str.match(/\[Merger\] Merging formats into "(.+?)"/) || 
                            str.match(/\[ExtractAudio\] Destination: (.+)/) ||
                            str.match(/\[download\] Destination: (.+)/);
      if (filenameMatch) {
        finalFile = filenameMatch[1].trim();
      }
    });

    child.on('exit', async (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}`));
      }

      // Find the actual downloaded file if not captured
      if (!finalFile) {
        const files = await fs.readdir(DOWNLOADS_DIR);
        const recent = files
          .filter(f => f.includes(safeName) || f.endsWith('.mp4') || f.endsWith('.mp3'))
          .map(f => path.join(DOWNLOADS_DIR, f));
        if (recent.length) finalFile = recent[recent.length - 1];
      }

      if (finalFile && await fs.pathExists(finalFile)) {
        resolve(finalFile);
      } else {
        reject(new Error('Download completed but file not found'));
      }
    });

    child.on('error', reject);
  });
}
