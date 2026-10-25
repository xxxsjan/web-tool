import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import {
  buildSambertWsUrl,
  getSambertExportFormat,
  getSambertVoice,
  type SambertExportFormat,
} from '~/utils/sambert-tts';
import { convertMp3Buffer } from './convert-audio';

type RunTaskMessage = {
  header: {
    action: string;
    task_id: string;
    streaming: string;
  };
  payload: {
    model: string;
    task_group: string;
    task: string;
    function: string;
    input: { text: string };
    parameters: {
      text_type: string;
      format: string;
      sample_rate: number;
      volume: number;
      rate: number;
      pitch: number;
      word_timestamp_enabled: boolean;
      phoneme_timestamp_enabled: boolean;
    };
  };
};

/**
 * 服务端经 WebSocket 调用百炼 Sambert，返回完整音频 Buffer。
 * API Key 不可暴露到浏览器，故走服务端。
 */
export function synthesizeSambertTtsServer(options: {
  text: string;
  voice: string;
  rate?: number;
  volume?: number;
  pitch?: number;
  format?: SambertExportFormat | string;
  apiKey: string;
  workspaceId?: string;
  timeoutMs?: number;
}): Promise<{ audio: Buffer; mime: string; ext: string; format: string }> {
  const {
    text,
    voice,
    rate = 1,
    volume = 50,
    pitch = 1,
    format = 'mp3',
    apiKey,
    workspaceId,
    timeoutMs = 120000,
  } = options;

  const formatConfig = getSambertExportFormat(format);
  const voiceMeta = getSambertVoice(voice);
  const trimmed = text.trim();
  if (!trimmed) {
    return Promise.reject(new Error('文本为空'));
  }
  if (!apiKey.trim()) {
    return Promise.reject(new Error('未配置 DASHSCOPE_API_KEY'));
  }
  if (!voiceMeta) {
    return Promise.reject(new Error(`不支持的 Sambert 音色：${voice}`));
  }

  const clampRate = Math.min(2, Math.max(0.5, Number(rate) || 1));
  const clampVol = Math.min(100, Math.max(0, Math.round(Number(volume) || 50)));
  const clampPitch = Math.min(2, Math.max(0.5, Number(pitch) || 1));

  return new Promise((resolve, reject) => {
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
      const raw = Buffer.concat(chunks);
      if (!raw.length) {
        reject(new Error('未收到音频数据'));
        return;
      }

      void (async () => {
        try {
          let audio = raw;
          if (formatConfig.value === 'ogg') {
            audio = await convertMp3Buffer(raw, 'ogg');
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
      const url = buildSambertWsUrl(workspaceId);
      const taskId = randomUUID();
      const runTask: RunTaskMessage = {
        header: {
          action: 'run-task',
          task_id: taskId,
          streaming: 'out',
        },
        payload: {
          model: voiceMeta.ShortName,
          task_group: 'audio',
          task: 'tts',
          function: 'SpeechSynthesizer',
          input: { text: trimmed },
          parameters: {
            text_type: 'PlainText',
            format: formatConfig.apiFormat,
            sample_rate: voiceMeta.sampleRate,
            volume: clampVol,
            rate: clampRate,
            pitch: clampPitch,
            word_timestamp_enabled: false,
            phoneme_timestamp_enabled: false,
          },
        },
      };

      ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'X-DashScope-DataInspection': 'enable',
        },
        handshakeTimeout: 15000,
      });

      ws.on('open', () => {
        ws!.send(JSON.stringify(runTask));
      });

      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          const buf = Buffer.isBuffer(data)
            ? data
            : Buffer.from(data as ArrayBuffer);
          if (buf.length) chunks.push(buf);
          return;
        }

        let msg: {
          header?: {
            event?: string;
            error_code?: string;
            error_message?: string;
          };
        };
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }

        const event = msg.header?.event;
        if (event === 'task-finished') {
          finish();
          return;
        }
        if (event === 'task-failed') {
          const detail =
            msg.header?.error_message ||
            msg.header?.error_code ||
            '未知错误';
          finish(new Error(`Sambert 合成失败：${detail}`));
        }
      });

      ws.on('error', err => {
        finish(
          new Error(
            err?.message
              ? `Sambert 连接失败：${err.message}`
              : 'Sambert 连接失败',
          ),
        );
      });

      ws.on('close', () => {
        if (!settled) {
          if (chunks.length) finish();
          else finish(new Error('Sambert 连接已关闭'));
        }
      });
    } catch (e: any) {
      finish(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
