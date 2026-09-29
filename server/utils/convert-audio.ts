import { randomUUID } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (!ffmpegStatic) {
  throw new Error('未找到 ffmpeg-static 二进制文件');
}
ffmpeg.setFfmpegPath(ffmpegStatic);

function bufferToStream(buf: Buffer) {
  return Readable.from(buf);
}

async function readFileSafe(path: string) {
  const data = await fs.readFile(path);
  await fs.unlink(path).catch(() => undefined);
  return data;
}

/**
 * 将 MP3 Buffer 转成 WAV / OGG。
 * WAV 必须落到可寻址文件再读回：管道输出无法回写 RIFF 长度，手机端常表现为无声。
 */
export function convertMp3Buffer(
  mp3: Buffer,
  target: 'wav' | 'ogg',
): Promise<Buffer> {
  if (target === 'wav') {
    return convertMp3ToWavFile(mp3);
  }
  return convertMp3ToOggPipe(mp3);
}

function convertMp3ToWavFile(mp3: Buffer): Promise<Buffer> {
  const outPath = join(tmpdir(), `edge-tts-${randomUUID()}.wav`);

  return new Promise((resolve, reject) => {
    ffmpeg(bufferToStream(mp3))
      .inputFormat('mp3')
      // 44.1kHz 立体声：抖音等 App 对 24kHz 单声道 WAV 兼容性差
      .audioFrequency(44100)
      .audioChannels(2)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', (err: Error) => {
        void fs.unlink(outPath).catch(() => undefined);
        reject(
          new Error(
            err?.message
              ? `转码为 WAV 失败：${err.message}`
              : '转码为 WAV 失败',
          ),
        );
      })
      .on('end', () => {
        void readFileSafe(outPath)
          .then(buf => {
            if (!buf.length) {
              reject(new Error('转码为 WAV 失败：无输出数据'));
              return;
            }
            resolve(buf);
          })
          .catch(reject);
      })
      .save(outPath);
  });
}

function convertMp3ToOggPipe(mp3: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const output = new PassThrough();
    output.on('data', chunk => chunks.push(Buffer.from(chunk)));
    output.on('error', reject);
    output.on('end', () => {
      const out = Buffer.concat(chunks);
      if (!out.length) {
        reject(new Error('转码为 OGG 失败：无输出数据'));
        return;
      }
      resolve(out);
    });

    ffmpeg(bufferToStream(mp3))
      .inputFormat('mp3')
      .audioCodec('libopus')
      .audioBitrate('64k')
      .format('ogg')
      .on('error', (err: Error) => {
        reject(
          new Error(
            err?.message
              ? `转码为 OGG 失败：${err.message}`
              : '转码为 OGG 失败',
          ),
        );
      })
      .pipe(output, { end: true });
  });
}
