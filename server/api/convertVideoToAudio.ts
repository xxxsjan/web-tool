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

// 转换promise形式的ffmpeg函数
const convertVideoToAudio = (
  inputPath: string,
  outputPath: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo() // 去掉视频部分
      .audioCodec('libmp3lame') // 设置音频编码器
      .audioQuality(2) // 设置音频质量(1-32，1最好)
      .on('end', () => resolve())
      .on('error', err => reject(err))
      .save(outputPath);
  });
};

export default defineEventHandler(async event => {
  try {
    // 1. 获取上传的视频文件
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw new Error('请上传视频文件');
    }

    const videoFile = formData.find(item => item.name === 'video');
    if (!videoFile || !videoFile.data) {
      throw new Error('视频文件不存在或格式错误');
    }

    // 2. 创建临时文件
    const tempDir = ensureTempDir();
    const videoFileName = `input_${Date.now()}.${
      videoFile.filename?.split('.').pop() || 'mp4'
    }`;
    const audioFileName = `output_${Date.now()}.mp3`;

    const videoFilePath = path.join(tempDir, videoFileName);
    console.log('videoFilePath: ', videoFilePath);
    const audioFilePath = path.join(tempDir, audioFileName);
    console.log('audioFilePath: ', audioFilePath);

    // 3. 保存视频文件到临时目录
    fs.writeFileSync(videoFilePath, Buffer.from(videoFile.data));

    try {
      // 4. 使用ffmpeg转换视频到音频
      await convertVideoToAudio(videoFilePath, audioFilePath);

      // 5. 读取转换后的音频文件
      const audioData = fs.readFileSync(audioFilePath);

      // 6. 设置响应头
      event.node.res.setHeader('Content-Type', 'audio/mpeg');
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
