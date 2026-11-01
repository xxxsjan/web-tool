import { Readable } from 'node:stream';
import {
  BREEZEBLUE_API_BASE,
  BREEZEBLUE_MAX_TEXT_LEN,
  clampBreezeBlueSpeed,
  getBreezeBlueExportFormat,
  getBreezeBlueVoice,
  isBreezeBlueVoiceId,
  type BreezeBlueExportFormat,
} from '~/utils/breezeblue-tts';
import { convertMp3Buffer } from './convert-audio';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

type BreezeErrorBody = {
  ok?: boolean;
  code?: string;
  detail?: unknown;
  error?: string | { message?: string };
  message?: string;
  meta?: { retry_after_seconds?: number };
};

type BreezeStreamWireFormat = 'pcm' | 'mp3' | 'wav';

type BreezeSpeakOptions = {
  text: string;
  voice: string;
  rate?: number;
  format?: BreezeBlueExportFormat | string;
  /** 流式线路格式；朗读请用 pcm（官方默认，首包更快） */
  streamFormat?: BreezeStreamWireFormat | string;
  apiKey: string;
  languageCode?: string;
  timeoutMs?: number;
};

type BreezeStreamResult = {
  stream: Readable;
  mime: string;
  ext: string;
  format: string;
  streamFormat: BreezeStreamWireFormat;
};

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function resolveModelId(languageCode?: string) {
  const lang = String(languageCode || '').trim().toLowerCase();
  // 文档：显式 en/zh 选 breeze-tts-2；其它或省略选 multilingual
  if (lang === 'zh' || lang === 'en') return 'breeze-tts-2';
  return 'breeze-tts-2-multilingual';
}

/** 流式接口 output_format：pcm / mp3 / wav（与非流式 wav_24000 不同） */
function resolveStreamOutputFormat(
  formatConfig: ReturnType<typeof getBreezeBlueExportFormat>,
  prefer?: string,
): BreezeStreamWireFormat {
  const p = String(prefer || '').trim().toLowerCase();
  if (p === 'pcm' || p === 'mp3' || p === 'wav') return p;
  // 下载默认跟导出格式；朗读应显式传 pcm
  return formatConfig.value === 'wav' ? 'wav' : 'mp3';
}

function streamMime(streamFormat: BreezeStreamWireFormat) {
  if (streamFormat === 'wav') return 'audio/wav';
  if (streamFormat === 'pcm') return 'application/octet-stream';
  return 'audio/mpeg';
}

function streamExt(streamFormat: BreezeStreamWireFormat) {
  if (streamFormat === 'wav') return 'wav';
  if (streamFormat === 'pcm') return 'pcm';
  return 'mp3';
}

function parseErrorBody(raw: string): BreezeErrorBody | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BreezeErrorBody;
  } catch {
    return null;
  }
}

function extractErrorDetail(raw: string, json: BreezeErrorBody | null) {
  if (json) {
    if (typeof json.detail === 'string' && json.detail.trim()) return json.detail.trim();
    if (typeof json.error === 'string' && json.error.trim()) return json.error.trim();
    if (
      json.error &&
      typeof json.error === 'object' &&
      typeof json.error.message === 'string'
    ) {
      return json.error.message.trim();
    }
    if (typeof json.message === 'string' && json.message.trim()) {
      return json.message.trim();
    }
    if (typeof json.code === 'string' && json.code.trim()) return json.code.trim();
  }
  return raw ? raw.slice(0, 240) : '';
}

function friendlyUpstreamMessage(
  status: number,
  code?: string,
  detail?: string,
  retried = false,
) {
  const c = String(code || '').toUpperCase();
  const retryHint = retried ? '（已自动重试仍失败）' : '';
  if (status === 401 || status === 403) {
    return 'API Key 无效或无权限，请检查 Breeze Blue 密钥';
  }
  if (status === 402 || c.includes('CREDIT') || c.includes('BILLING')) {
    return '账户额度不足，请到 Breeze Blue 控制台充值后再试';
  }
  if (c === 'GENERATION_CAPACITY_EXCEEDED') {
    // 官方文档：此码不可重试，需等共享容量释放
    return 'Breeze Blue 公共生成容量已满，请过几分钟再试，或稍晚在官网重试';
  }
  if (status === 429 || c.includes('RATE') || c.includes('CONCURRENCY')) {
    return `请求过于频繁或并发已满${retryHint}，请稍后再试`;
  }
  if (
    status === 503 ||
    status === 504 ||
    c.includes('TIMEOUT') ||
    c.includes('UPSTREAM')
  ) {
    return `Breeze Blue 上游暂时不可用或超时${retryHint}，请稍后再试`;
  }
  return detail || `HTTP ${status}`;
}

function isRetryableBreezeError(status: number, code?: string) {
  if (!RETRYABLE_STATUS.has(status)) return false;
  // 文档：下列错误明确标为不可重试
  if (
    code === 'UPSTREAM_GENERATION_SERVICE_ERROR' ||
    code === 'GENERATION_CAPACITY_EXCEEDED'
  ) {
    return false;
  }
  return true;
}

function retryDelayMs(attempt: number, response: Response, json: BreezeErrorBody | null) {
  const header = response.headers.get('retry-after');
  if (header) {
    const sec = Number(header);
    if (Number.isFinite(sec) && sec >= 0) {
      return Math.min(10000, Math.max(200, sec * 1000));
    }
  }
  const metaSec = Number(json?.meta?.retry_after_seconds);
  if (Number.isFinite(metaSec) && metaSec >= 0) {
    return Math.min(10000, Math.max(200, metaSec * 1000));
  }
  // 文档建议：指数退避 + 少量抖动，上限约 4s
  const base = Math.min(4000, 500 * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

function assertBreezeSpeakOptions(options: BreezeSpeakOptions) {
  const trimmed = String(options.text || '').trim();
  const key = String(options.apiKey || '').trim();
  const voiceId = String(options.voice || '').trim();
  const formatConfig = getBreezeBlueExportFormat(options.format);
  const languageCode = String(options.languageCode || 'zh').trim() || 'zh';

  if (!trimmed) throw new Error('文本为空');
  if (trimmed.length > BREEZEBLUE_MAX_TEXT_LEN) {
    throw new Error(`文本过长，最多 ${BREEZEBLUE_MAX_TEXT_LEN} 字`);
  }
  if (!key) throw new Error('未配置 Breeze Blue API Key');
  if (!isBreezeBlueVoiceId(voiceId)) {
    throw new Error(`不支持的 Breeze Blue 音色：${voiceId || '(空)'}`);
  }

  // 内置表外的 voc_* 也允许（账号自有音色）；内置项仅作展示兜底
  void getBreezeBlueVoice(voiceId);

  return { trimmed, key, voiceId, formatConfig, languageCode };
}

/**
 * 打开 Breeze Blue 官方流式合成接口，成功时返回上游 Response（body 为音频流）。
 * @see https://docs.breezeblue.ai/api-reference/text-to-speech/stream-text-to-speech
 */
async function openBreezeBlueStreamResponse(
  options: BreezeSpeakOptions,
): Promise<{
  response: Response;
  formatConfig: ReturnType<typeof getBreezeBlueExportFormat>;
  streamFormat: BreezeStreamWireFormat;
}> {
  const { trimmed, key, voiceId, formatConfig, languageCode } =
    assertBreezeSpeakOptions(options);
  const timeoutMs = options.timeoutMs ?? 120000;
  const speed = clampBreezeBlueSpeed(options.rate ?? 1);
  const modelId = resolveModelId(languageCode);
  const streamFormat = resolveStreamOutputFormat(
    formatConfig,
    options.streamFormat,
  );
  const url = `${BREEZEBLUE_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=${encodeURIComponent(streamFormat)}`;
  const body = JSON.stringify({
    text: trimmed,
    model_id: modelId,
    language_code: languageCode,
    voice_settings: {
      speed,
      // 音量由页面 GainNode 控制，接口固定默认
      volume: 1,
    },
  });

  let lastError = 'Breeze Blue 合成失败';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'content-type': 'application/json',
          accept: 'audio/*,application/octet-stream',
        },
        body,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        lastError = 'Breeze Blue 合成超时，请稍后重试';
      } else {
        lastError = err?.message || 'Breeze Blue 网络请求失败';
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(Math.min(4000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250));
        continue;
      }
      throw new Error(lastError);
    }

    // 成功后由调用方消费 body；此处不再 clearTimeout 以免长流被中断——
    // 用 response 完成后的 finally 由消费侧管理。改为：成功则解除 abort 计时。
    clearTimeout(timer);

    if (response.ok) {
      if (!response.body) {
        throw new Error('Breeze Blue 未返回音频流');
      }
      return { response, formatConfig, streamFormat };
    }

    const raw = await response.text().catch(() => '');
    const json = parseErrorBody(raw);
    const detail = extractErrorDetail(raw, json);
    const code = typeof json?.code === 'string' ? json.code : undefined;
    const canRetry =
      isRetryableBreezeError(response.status, code) &&
      attempt < MAX_ATTEMPTS - 1;

    lastError = `Breeze Blue 合成失败（${response.status}${code ? ` ${code}` : ''}）：${friendlyUpstreamMessage(
      response.status,
      code,
      detail,
      attempt > 0,
    )}`;

    if (canRetry) {
      await sleep(retryDelayMs(attempt, response, json));
      continue;
    }

    throw new Error(lastError);
  }

  throw new Error(lastError);
}

function webStreamToNode(stream: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(stream as import('node:stream/web').ReadableStream);
}

/**
 * 流式转发：返回 Node Readable，供 sendStream 边收边写。
 * ogg 需整段转码，请改用 synthesizeBreezeBlueTtsServer。
 */
export async function streamBreezeBlueTtsServer(
  options: BreezeSpeakOptions,
): Promise<BreezeStreamResult> {
  const formatConfig = getBreezeBlueExportFormat(options.format);
  const prefer = String(options.streamFormat || '').toLowerCase();
  // ogg 导出仍需整段；但朗读 pcm 不受导出格式限制
  if (formatConfig.value === 'ogg' && prefer !== 'pcm') {
    throw new Error('OGG 需整段转码，请使用非流式合成');
  }

  const { response, streamFormat } = await openBreezeBlueStreamResponse(options);
  const webBody = response.body;
  if (!webBody) {
    throw new Error('Breeze Blue 未返回音频流');
  }

  return {
    stream: webStreamToNode(webBody),
    mime: streamMime(streamFormat),
    ext: streamExt(streamFormat),
    format: streamFormat === 'pcm' ? 'wav' : formatConfig.value,
    streamFormat,
  };
}

/**
 * 服务端转发 Breeze Blue TTS，返回完整音频 Buffer（下载 / ogg 转码 / 试听兜底）。
 * 内部走官方 /stream 接口收齐后再返回。
 */
export async function synthesizeBreezeBlueTtsServer(
  options: BreezeSpeakOptions,
): Promise<{ audio: Buffer; mime: string; ext: string; format: string }> {
  const formatConfig = getBreezeBlueExportFormat(options.format);
  const { response } = await openBreezeBlueStreamResponse(options);
  const ab = await response.arrayBuffer();
  let audio = Buffer.from(ab);
  if (!audio.length) {
    throw new Error('Breeze Blue 返回空音频');
  }
  if (formatConfig.value === 'ogg') {
    audio = await convertMp3Buffer(audio, 'ogg');
  }
  return {
    audio,
    mime: formatConfig.mime,
    ext: formatConfig.ext,
    format: formatConfig.value,
  };
}
