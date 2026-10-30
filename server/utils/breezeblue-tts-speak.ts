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

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function resolveModelId(languageCode?: string) {
  const lang = String(languageCode || '').trim().toLowerCase();
  // 文档：显式 en/zh 选 breeze-tts-2；其它或省略选 multilingual
  if (lang === 'zh' || lang === 'en') return 'breeze-tts-2';
  return 'breeze-tts-2-multilingual';
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

/**
 * 服务端转发 Breeze Blue TTS，返回完整音频 Buffer。
 * 按官方错误文档对 429/5xx 做有限次重试。
 * @see https://docs.breezeblue.ai/reference/errors
 * @see https://docs.breezeblue.ai/guides/text-to-speech
 */
export async function synthesizeBreezeBlueTtsServer(options: {
  text: string;
  voice: string;
  rate?: number;
  format?: BreezeBlueExportFormat | string;
  apiKey: string;
  languageCode?: string;
  timeoutMs?: number;
}): Promise<{ audio: Buffer; mime: string; ext: string; format: string }> {
  const {
    text,
    voice,
    rate = 1,
    format = 'mp3',
    apiKey,
    languageCode = 'zh',
    timeoutMs = 120000,
  } = options;

  const trimmed = text.trim();
  const key = apiKey.trim();
  const voiceId = voice.trim();
  const formatConfig = getBreezeBlueExportFormat(format);

  if (!trimmed) {
    throw new Error('文本为空');
  }
  if (trimmed.length > BREEZEBLUE_MAX_TEXT_LEN) {
    throw new Error(`文本过长，最多 ${BREEZEBLUE_MAX_TEXT_LEN} 字`);
  }
  if (!key) {
    throw new Error('未配置 Breeze Blue API Key');
  }
  if (!isBreezeBlueVoiceId(voiceId)) {
    throw new Error(`不支持的 Breeze Blue 音色：${voiceId || '(空)'}`);
  }

  // 内置表外的 voc_* 也允许（账号自有音色）；内置项仅作展示兜底
  void getBreezeBlueVoice(voiceId);

  const speed = clampBreezeBlueSpeed(rate);
  const modelId = resolveModelId(languageCode);
  const url = `${BREEZEBLUE_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(formatConfig.apiFormat)}`;
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
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) {
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
