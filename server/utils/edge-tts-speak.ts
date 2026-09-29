import WebSocket from 'ws';
import {
  buildSsml,
  buildSynthWsUrl,
  edgeTtsTimestamp,
  edgeTtsWsHeaders,
  getEdgeExportFormat,
  randomHex,
  type EdgeExportFormat,
} from '~/utils/edge-tts';
import { convertMp3Buffer } from './convert-audio';

/** Edge 免费 WebSocket 对 RIFF/OGG 常直接断连，合成一律走 MP3 */
const EDGE_SYNTH_FORMAT = 'mp3' as const;

function parseBinaryAudioFrame(raw: Buffer): Buffer | null {
  if (raw.length < 2) return null;

  // 官方协议：前 2 字节为大端 header 长度
  const headerLength = raw.readUInt16BE(0);
  if (headerLength > 0 && headerLength + 2 <= raw.length) {
    const header = raw.subarray(2, 2 + headerLength).toString('utf8');
    const body = raw.subarray(2 + headerLength);
    if (header.includes('Path:audio')) {
      if (!header.includes('Content-Type:') && body.length === 0) return null;
      if (body.length === 0) return null;
      return body;
    }
  }

  // 兼容旧格式：直接搜 Path:audio\r\n
  const delim = Buffer.from('Path:audio\r\n');
  const idx = raw.indexOf(delim);
  if (idx === -1) return null;
  const body = raw.subarray(idx + delim.length);
  return body.length ? body : null;
}

/**
 * 服务端经 WebSocket 调用 Edge TTS，返回完整音频 Buffer。
 * 浏览器无法设置 Origin / Cookie 等握手头，直连常失败，故走服务端。
 */
export function synthesizeEdgeTtsServer(options: {
  text: string;
  voice: string;
  rate?: number;
  locale?: string;
  format?: EdgeExportFormat | string;
  timeoutMs?: number;
}): Promise<{ audio: Buffer; mime: string; ext: string; format: string }> {
  const {
    text,
    voice,
    rate = 1,
    locale = 'zh-CN',
    format = 'mp3',
    timeoutMs = 45000,
  } = options;

  const formatConfig = getEdgeExportFormat(format);
  const edgeFormatConfig = getEdgeExportFormat(EDGE_SYNTH_FORMAT);
  const trimmed = text.trim();
  if (!trimmed) {
    return Promise.reject(new Error('文本为空'));
  }

  return new Promise(async (resolve, reject) => {
    let settled = false;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const chunks: Buffer[] = [];

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      if (err) {
        reject(err);
        return;
      }
      const mp3 = Buffer.concat(chunks);
      if (!mp3.length) {
        reject(new Error('未收到音频数据'));
        return;
      }

      void (async () => {
        try {
          let audio = mp3;
          if (formatConfig.value === 'wav' || formatConfig.value === 'ogg') {
            audio = await convertMp3Buffer(mp3, formatConfig.value);
          }
          resolve({
            audio,
            mime: formatConfig.mime,
            ext: formatConfig.ext,
            format: formatConfig.value,
          });
        } catch (e: any) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      })();
    };

    timer = setTimeout(() => {
      finish(new Error('合成超时，请稍后重试'));
    }, timeoutMs);

    try {
      const connectionId = randomHex(16);
      const requestId = randomHex(16);
      const url = await buildSynthWsUrl(connectionId);

      ws = new WebSocket(url, {
        headers: edgeTtsWsHeaders(),
        handshakeTimeout: 15000,
      });

      ws.on('open', () => {
        const ts = edgeTtsTimestamp();
        const config =
          `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"${edgeFormatConfig.edgeFormat}"}}}}\r\n`;
        ws!.send(config);

        const ssml = buildSsml(trimmed, voice, rate, locale);
        // 官方实现故意在时间戳后加 Z（Edge 服务端 bug）
        const speech =
          `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\n` +
          `X-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`;
        ws!.send(speech);
      });

      ws.on('message', (data, isBinary) => {
        if (!isBinary) {
          const textMsg = data.toString();
          if (textMsg.includes('Path:turn.end')) {
            finish();
          }
          return;
        }

        const buf = Buffer.isBuffer(data)
          ? data
          : Buffer.from(data as ArrayBuffer);
        const audio = parseBinaryAudioFrame(buf);
        if (audio) chunks.push(audio);
      });

      ws.on('error', err => {
        finish(
          new Error(
            err?.message
              ? `Edge TTS 连接失败：${err.message}`
              : 'Edge TTS 连接失败',
          ),
        );
      });

      ws.on('close', () => {
        if (!settled) {
          if (chunks.length) finish();
          else finish(new Error('Edge TTS 连接已关闭'));
        }
      });
    } catch (e: any) {
      finish(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
