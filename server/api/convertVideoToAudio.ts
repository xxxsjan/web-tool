import { defineEventHandler, readMultipartFormData } from 'h3';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
console.log('ffmpegStatic: ', ffmpegStatic);

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegStatic);

// 确保临时目录存在
const ensureTempDir = () => {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

// 音频格式配置映射
type AudioFormat =
  | 'mp3'
  | 'wav'
  | 'wma'
  | 'ogg'
  | 'aac'
  | 'au'
  | 'flac'
  | 'm4a'
  | 'mka'
  | 'aiff'
  | 'opus'
  | 'ra';

interface FormatConfig {
  encoder: string;
  contentType: string;
  extension: string;
}

const formatConfigs: Record<AudioFormat, FormatConfig> = {
  mp3: {
    encoder: 'libmp3lame',
    contentType: 'audio/mpeg',
    extension: 'mp3',
  },
  wav: {
    encoder: 'pcm_s16le',
    contentType: 'audio/wav',
    extension: 'wav',
  },
  wma: {
    encoder: 'wmav2',
    contentType: 'audio/x-ms-wma',
    extension: 'wma',
  },
  ogg: {
    encoder: 'libvorbis',
    contentType: 'audio/ogg',
    extension: 'ogg',
  },
  aac: {
    encoder: 'aac',
    contentType: 'audio/aac',
    extension: 'aac',
  },
  au: {
    encoder: 'pcm_s16be',
    contentType: 'audio/basic',
    extension: 'au',
  },
  flac: {
    encoder: 'flac',
    contentType: 'audio/flac',
    extension: 'flac',
  },
  m4a: {
    encoder: 'aac',
    contentType: 'audio/mp4',
    extension: 'm4a',
  },
  mka: {
    encoder: 'aac',
    contentType: 'audio/x-matroska',
    extension: 'mka',
  },
  aiff: {
    encoder: 'pcm_s16be',
    contentType: 'audio/aiff',
    extension: 'aiff',
  },
  opus: {
    encoder: 'libopus',
    contentType: 'audio/opus',
    extension: 'opus',
  },
  ra: {
    encoder: 'real_144',
    contentType: 'audio/vnd.rn-realaudio',
    extension: 'ra',
  },
};

// 转换promise形式的ffmpeg函数
const convertVideoToAudio = (
  inputPath: string,
  outputPath: string,
  format: AudioFormat,
): Promise<void> => {
  const config = formatConfigs[format];

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .noVideo() // 去掉视频部分
      .audioCodec(config.encoder) // 设置音频编码器
      .audioQuality(2); // 设置音频质量(1-32，1最好)

    // 根据不同格式可能需要添加特殊参数
    if (format === 'opus') {
      command.audioBitrate('128k');
    } else if (format === 'flac') {
      command.audioBitrate('320k');
    }

    command
      .on('end', () => resolve())
      .on('error', err => reject(err))
      .save(outputPath);
  });
};

export default defineEventHandler(async event => {
  try {
    // 1. 获取上传的视频文件和格式参数
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw new Error('请上传视频文件');
    }

    const videoFile = formData.find(item => item.name === 'video');
    if (!videoFile || !videoFile.data) {
      throw new Error('视频文件不存在或格式错误');
    }

    // 获取用户指定的音频格式，默认为mp3
    const formatField = formData.find(item => item.name === 'format');
    let format: AudioFormat = 'mp3';

    if (formatField && formatField.data) {
      const requestedFormat = formatField.data
        .toString()
        .toLowerCase() as AudioFormat;
      if (formatConfigs[requestedFormat]) {
        format = requestedFormat;
      }
    }

    // 2. 创建临时文件
    const tempDir = ensureTempDir();
    const videoFileName = `input_${Date.now()}.${
      videoFile.filename?.split('.').pop() || 'mp4'
    }`;
    const audioFileName = `output_${Date.now()}.${
      formatConfigs[format].extension
    }`;

    const videoFilePath = path.join(tempDir, videoFileName);
    const audioFilePath = path.join(tempDir, audioFileName);

    // 3. 保存视频文件到临时目录
    fs.writeFileSync(videoFilePath, Buffer.from(videoFile.data));

    try {
      // 4. 使用ffmpeg转换视频到音频
      await convertVideoToAudio(videoFilePath, audioFilePath, format);

      // 5. 读取转换后的音频文件
      const audioData = fs.readFileSync(audioFilePath);

      // 6. 设置响应头
      const config = formatConfigs[format];
      event.node.res.setHeader('Content-Type', config.contentType);
      event.node.res.setHeader(
        'Content-Disposition',
        `attachment; filename="${audioFileName}"`,
      );
      event.node.res.setHeader('Content-Length', audioData.length);

      // 7. 返回音频数据
      event.node.res.end(audioData);
    } finally {
      // 8. 清理临时文件
      setTimeout(() => {
        try {
          if (fs.existsSync(videoFilePath)) fs.unlinkSync(videoFilePath);
          if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
        } catch (error) {
          console.error('清理临时文件失败:', error);
        }
      }, 5000); // 延迟5秒后清理，确保文件已被读取
    }
  } catch (error) {
    console.error('视频转音频失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
    };
  }
});
