import {
  createError,
  defineEventHandler,
  readMultipartFormData,
  setResponseHeader,
} from 'h3';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (!ffmpegStatic) {
  throw new Error('未找到 ffmpeg-static 二进制文件');
}
ffmpeg.setFfmpegPath(ffmpegStatic);

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

type AudioFormat = 'mp3' | 'wav' | 'aac';

interface FormatConfig {
  encoder: string;
  contentType: string;
  extension: string;
  format: string;
  bitrate?: string;
}

const formatConfigs: Record<AudioFormat, FormatConfig> = {
  mp3: {
    encoder: 'libmp3lame',
    contentType: 'audio/mpeg',
    extension: 'mp3',
    format: 'mp3',
    bitrate: '192k',
  },
  wav: {
    encoder: 'pcm_s16le',
    contentType: 'audio/wav',
    extension: 'wav',
    format: 'wav',
  },
  aac: {
    encoder: 'aac',
    contentType: 'audio/aac',
    extension: 'aac',
    format: 'adts',
    bitrate: '192k',
  },
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
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('清理临时文件失败:', error);
  }
};

const getBaseName = (filename?: string) => {
  if (!filename) return 'converted-audio';
  const base = path.basename(filename);
  const extIndex = base.lastIndexOf('.');
  return extIndex > 0 ? base.slice(0, extIndex) : base;
};

/** 从 ffmpeg stderr 提取可读错误（fluent-ffmpeg 默认会丢掉以 [ 开头的行） */
const toFriendlyFfmpegError = (stderr: string, fallback: string) => {
  const text = stderr || '';

  if (
    /Output file does not contain any stream/i.test(text) ||
    /Stream map.*matches no streams/i.test(text) ||
    /does not contain any stream/i.test(text)
  ) {
    return '该视频没有音轨，无法提取音频，请换一个带声音的视频';
  }

  if (/Invalid data found when processing input/i.test(text)) {
    return '视频文件损坏或格式无法识别，请换一个文件重试';
  }

  if (/moov atom not found/i.test(text)) {
    return '视频文件不完整（缺少 moov 信息），请重新导出后再试';
  }

  if (/Permission denied|Access is denied/i.test(text)) {
    return '无法读写临时文件，请检查磁盘权限后重试';
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const useful =
    lines.find(line => /^Error\b/i.test(line)) ||
    [...lines].reverse().find(line => /error|failed|invalid|unknown/i.test(line));

  if (useful) {
    return useful.replace(/^\[[^\]]+\]\s*/, '').slice(0, 200);
  }

  return fallback.replace(/ffmpeg exited with code \d+:\s*/i, '').trim() ||
    '音频转换失败，请换一个视频或格式后重试';
};

const convertVideoToAudio = (
  inputPath: string,
  outputPath: string,
  format: AudioFormat,
): Promise<void> => {
  const config = formatConfigs[format];

  return new Promise((resolve, reject) => {
    let stderrLog = '';

    const command = ffmpeg(inputPath)
      .inputOptions(['-err_detect', 'ignore_err'])
      .outputOptions([
        '-vn',
        '-map',
        '0:a:0',
        '-y',
        '-ac',
        '2',
        '-ar',
        '44100',
      ])
      .audioCodec(config.encoder)
      .format(config.format);

    if (config.bitrate) {
      command.audioBitrate(config.bitrate);
    }

    command
      .on('start', (cmd: string) => {
        console.log('ffmpeg command:', cmd);
      })
      .on('stderr', (line: string) => {
        stderrLog += `${line}\n`;
      })
      .on('end', () => resolve())
      .on('error', (err: Error, _stdout: string, stderr: string) => {
        const detail = toFriendlyFfmpegError(stderr || stderrLog, err.message);
        console.error('ffmpeg stderr:', stderr || stderrLog);
        reject(new Error(detail));
      })
      .save(outputPath);
  });
};

export default defineEventHandler(async event => {
  let videoFilePath = '';
  let audioFilePath = '';

  try {
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: '请上传视频文件',
      });
    }

    const videoFile = formData.find(item => item.name === 'video');
    if (!videoFile?.data?.length) {
      throw createError({
        statusCode: 400,
        message: '视频文件不存在或格式错误',
      });
    }

    if (videoFile.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 413,
        message: '视频文件过大，请上传不超过 200MB 的文件',
      });
    }

    const formatField = formData.find(item => item.name === 'format');
    let format: AudioFormat = 'mp3';
    if (formatField?.data) {
      const requestedFormat = formatField.data
        .toString()
        .toLowerCase() as AudioFormat;
      if (formatConfigs[requestedFormat]) {
        format = requestedFormat;
      }
    }

    const config = formatConfigs[format];
    const tempDir = ensureTempDir();
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inputExt =
      videoFile.filename?.split('.').pop()?.toLowerCase() || 'mp4';
    const outputBaseName = getBaseName(videoFile.filename);
    const downloadName = `${outputBaseName}.${config.extension}`;

    videoFilePath = path.join(tempDir, `input_${stamp}.${inputExt}`);
    audioFilePath = path.join(tempDir, `output_${stamp}.${config.extension}`);

    fs.writeFileSync(videoFilePath, Buffer.from(videoFile.data));

    await convertVideoToAudio(videoFilePath, audioFilePath, format);

    if (!fs.existsSync(audioFilePath) || fs.statSync(audioFilePath).size === 0) {
      throw createError({
        statusCode: 500,
        message: '转换结果为空，请换一个带音轨的视频重试',
      });
    }

    const audioData = fs.readFileSync(audioFilePath);
    const asciiName =
      downloadName.replace(/[^\x20-\x7E]/g, '_') ||
      `converted-audio.${config.extension}`;

    setResponseHeader(event, 'Content-Type', config.contentType);
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
    );
    setResponseHeader(event, 'Content-Length', String(audioData.length));

    return audioData;
  } catch (error: unknown) {
    console.error('视频转音频失败:', error);

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : '视频转音频失败，请重试';

    throw createError({
      statusCode: 500,
      message,
    });
  } finally {
    safeUnlink(videoFilePath);
    safeUnlink(audioFilePath);
  }
});
