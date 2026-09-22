import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from 'h3';

const ensureFfmpeg = () => {
  if (!ffmpegStatic) {
    throw createError({
      statusCode: 500,
      message: '未找到 ffmpeg-static 二进制文件',
    });
  }
  ffmpeg.setFfmpegPath(ffmpegStatic);
};

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const ALLOWED_HOST_HINTS = [
  'douyin',
  'iesdouyin',
  'snssdk',
  'byteicdn',
  'douyinvod',
  'zjcdn',
  'bytedance',
  'douyinstatic',
];

const isAllowedMediaUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOST_HINTS.some(hint => host.includes(hint));
  } catch {
    return false;
  }
};

const ensureTempDir = () => {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

const safeUnlink = (filePath: string) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
};

const sanitizeFilename = (name: string) =>
  String(name || 'douyin-audio')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'douyin-audio';

const extractAudio = (inputPath: string, outputPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    let stderrLog = '';
    ffmpeg(inputPath)
      .inputOptions(['-err_detect', 'ignore_err'])
      .outputOptions(['-vn', '-map', '0:a:0', '-y', '-ac', '2', '-ar', '44100'])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .format('mp3')
      .on('stderr', (line: string) => {
        stderrLog += `${line}\n`;
      })
      .on('end', () => resolve())
      .on('error', (err: Error, _stdout: string, stderr: string) => {
        reject(new Error(stderr || stderrLog || err.message));
      })
      .save(outputPath);
  });

export default defineEventHandler(async event => {
  let videoPath = '';
  let audioPath = '';

  try {
    const query = getQuery(event);
    const url = String(query.url || '').trim();
    const filename = sanitizeFilename(String(query.filename || 'douyin-audio'));

    if (!url) {
      throw createError({ statusCode: 400, message: '缺少视频地址' });
    }
    if (!isAllowedMediaUrl(url)) {
      throw createError({ statusCode: 400, message: '不支持的下载域名' });
    }

    ensureFfmpeg();

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120000,
      maxRedirects: 8,
      headers: {
        'User-Agent': MOBILE_UA,
        Referer: 'https://www.douyin.com/',
        Accept: '*/*',
      },
    });

    const tempDir = ensureTempDir();
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    videoPath = path.join(tempDir, `dy_video_${stamp}.mp4`);
    audioPath = path.join(tempDir, `dy_audio_${stamp}.mp3`);
    fs.writeFileSync(videoPath, Buffer.from(response.data));

    await extractAudio(videoPath, audioPath);

    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
      throw createError({
        statusCode: 500,
        message: '提取音频失败，该视频可能没有音轨',
      });
    }

    const audioData = fs.readFileSync(audioPath);
    const downloadName = `${filename}.mp3`;
    const asciiName = downloadName.replace(/[^\x20-\x7E]/g, '_') || 'douyin-audio.mp3';

    setResponseHeader(event, 'Content-Type', 'audio/mpeg');
    setResponseHeader(event, 'Content-Length', String(audioData.length));
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
    );

    return audioData;
  } catch (error: unknown) {
    console.error('抖音音频提取失败:', error);
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '音频提取失败，请稍后重试';
    throw createError({ statusCode: 500, message });
  } finally {
    safeUnlink(videoPath);
    safeUnlink(audioPath);
  }
});
