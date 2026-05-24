import ffmpeg from 'fluent-ffmpeg';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs-extra';
import path from 'path';

ffmpeg.setFfmpegPath(config.ffmpegPath);

export async function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        logger.error('FFmpeg audio extract error', err);
        reject(err);
      })
      .run();
  });
}

export async function compressVideo(inputPath, outputPath, targetHeight = 720) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .size(`?x${targetHeight}`)
      .outputOptions('-crf 28', '-preset fast')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

export async function generateThumbnail(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '320x?'
      })
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });
}

// Merge audio + video if separate streams needed (advanced)
export async function mergeAudioVideo(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions('-c:v copy', '-c:a aac', '-shortest')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}
