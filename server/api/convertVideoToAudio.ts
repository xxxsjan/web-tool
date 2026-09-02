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

const convertVideoToAudio = (
  inputPath: string,
  outputPath: string,
  format: AudioFormat,
): Promise<void> => {
  const config = formatConfigs[format];

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .noVideo()
      .audioCodec(config.encoder)
      .format(config.format);

    if (config.bitrate) {
      command.audioBitrate(config.bitrate);
    } else if (format === 'mp3') {
      command.audioQuality(2);
    }

    command
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
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

    const audioData = fs.readFileSync(audioFilePath);
    // filename 仅允许 ASCII；中文等非 ASCII 名走 filename*（RFC 5987）
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
