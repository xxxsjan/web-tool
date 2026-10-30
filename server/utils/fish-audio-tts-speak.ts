import {
  FISH_AUDIO_DEFAULT_MODEL,
  FISH_AUDIO_MAX_TEXT_LEN,
  clampFishAudioSpeed,
  getFishAudioExportFormat,
  isFishAudioVoiceId,
  normalizeFishAudioApiBase,
  toFishAudioReferenceId,
  type FishAudioExportFormat,
} from '~/utils/fish-audio-tts';
import { convertMp3Buffer } from './convert-audio';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
/** 免费档本身较慢，失败重试不宜过多 */
const MAX_ATTEMPTS = 2;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function parseErrorDetail(raw: string) {
  if (!raw) return '';
  try {
    const json = JSON.parse(raw) as {
      message?: string;
      reason?: string;
      detail?: string;
      error?: string | { message?: string };
    };
    if (typeof json.message === 'string' && json.message.trim()) {
      return json.message.trim();
    }
    if (typeof json.reason === 'string' && json.reason.trim()) {
      return json.reason.trim();
    }
    if (typeof json.detail === 'string' && json.detail.trim()) {
      return json.detail.trim();
    }
    if (typeof json.error === 'string' && json.error.trim()) {
      return json.error.trim();
    }
    if (
      json.error &&
      typeof json.error === 'object' &&
      typeof json.error.message === 'string'
    ) {
      return json.error.message.trim();
    }
  } catch {
    /* ignore */
  }
  return raw.slice(0, 240);
}

function friendlyMessage(status: number, detail: string) {
  if (status === 401 || status === 403) {
    return 'API Key 无效或无权限，请检查 Fish Audio 密钥';
  }
  if (status === 402) {
    return '额度不足：免费档请使用 s2.1-pro-free，或到官网充值后再试';
  }
  if (status === 429) {
    return '请求过于频繁，请稍后再试';
  }
  if (status === 400) {
    return detail || '请求参数无效，请检查音色 ID';
  }
  if (status >= 500) {
    return detail || 'Fish Audio 服务暂时不可用，请稍后再试';
  }
  return detail || `HTTP ${status}`;
}

/** 把 undici `fetch failed` 展开成可读原因 */
function friendlyFetchError(err: any) {
  const cause = err?.cause;
  const code = String(cause?.code || err?.code || '');
  const msg = String(cause?.message || err?.message || '');

  if (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    /Connect Timeout/i.test(msg)
  ) {
    return '无法连接 api.fish.audio（连接超时）。当前网络可能访问不到 Fish Audio，请检查代理/VPN 后重试';
  }
  if (
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    /getaddrinfo/i.test(msg)
  ) {
    return '无法解析 api.fish.audio 域名，请检查 DNS 或网络';
  }
  if (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'UND_ERR_SOCKET' ||
    /ECONNRESET|ECONNREFUSED/i.test(msg)
  ) {
    return '连接 Fish Audio 被重置或拒绝，请检查网络/代理后重试';
  }
  if (code === 'CERT_HAS_EXPIRED' || /certificate/i.test(msg)) {
    return '连接 Fish Audio 时证书校验失败，请检查系统时间或代理 HTTPS 设置';
  }
  if (err?.name === 'AbortError' || code === 'ABORT_ERR') {
    return 'Fish Audio 合成超时，请稍后重试';
  }
  if (msg && msg !== 'fetch failed') return msg;
  if (cause?.message) return `网络请求失败：${cause.message}`;
  return 'Fish Audio 网络请求失败（fetch failed）';
}

/**
 * 服务端转发 Fish Audio TTS。
 * @see https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
 * @see https://docs.fish.audio/developer-guide/getting-started/quickstart
 */
export async function synthesizeFishAudioTtsServer(options: {
  text: string;
  voice: string;
  rate?: number;
  format?: FishAudioExportFormat | string;
  apiKey: string;
  model?: string;
  apiBase?: string;
  timeoutMs?: number;
}): Promise<{ audio: Buffer; mime: string; ext: string; format: string }> {
  const {
    text,
    voice,
    rate = 1,
    format = 'mp3',
    apiKey,
    model = FISH_AUDIO_DEFAULT_MODEL,
    apiBase,
    timeoutMs = 120000,
  } = options;
  const apiRoot = normalizeFishAudioApiBase(apiBase);

  const trimmed = text.trim();
  const key = apiKey.trim();
  const rawVoice = String(voice ?? '').trim();
  const formatConfig = getFishAudioExportFormat(format);
  const modelHeader = String(model || FISH_AUDIO_DEFAULT_MODEL).trim();

  if (!trimmed) {
    throw new Error('文本为空');
  }
  if (trimmed.length > FISH_AUDIO_MAX_TEXT_LEN) {
    throw new Error(`文本过长，最多 ${FISH_AUDIO_MAX_TEXT_LEN} 字`);
  }
  if (!key) {
    throw new Error('未配置 Fish Audio API Key');
  }
  if (!isFishAudioVoiceId(rawVoice)) {
    throw new Error(`不支持的 Fish Audio 音色：${rawVoice || '(空)'}`);
  }

  const referenceId = toFishAudioReferenceId(rawVoice);
  const speed = clampFishAudioSpeed(rate);
  const url = `${apiRoot}/v1/tts`;
  // latency: low 优先首包速度；免费档 s2.1-pro-free 本身无 TTFA 保障，仍会比付费慢
  // @see https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
  const payload: Record<string, unknown> = {
    text: trimmed,
    format: formatConfig.apiFormat,
    normalize: true,
    latency: 'low',
    mp3_bitrate: formatConfig.apiFormat === 'mp3' ? 128 : undefined,
    condition_on_previous_chunks: false,
    prosody: {
      speed,
      volume: 0,
      normalize_loudness: true,
    },
  };
  if (referenceId) {
    payload.reference_id = referenceId;
  }
  // 去掉 undefined，避免部分网关校验异常
  if (payload.mp3_bitrate == null) delete payload.mp3_bitrate;

  const body = JSON.stringify(payload);
  let lastError = 'Fish Audio 合成失败';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          accept: 'audio/*,application/octet-stream',
          model: modelHeader,
        },
        body,
        signal: controller.signal,
      });
    } catch (err: any) {
      lastError = friendlyFetchError(err);
      // 连通性问题重试收益很小，最多再试 1 次
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(800 + Math.floor(Math.random() * 200));
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
        throw new Error('Fish Audio 返回空音频');
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
    const detail = parseErrorDetail(raw);
    lastError = `Fish Audio 合成失败（${response.status}）：${friendlyMessage(response.status, detail)}`;

    if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_ATTEMPTS - 1) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter >= 0
        ? Math.min(10000, Math.max(200, retryAfter * 1000))
        : Math.min(4000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(wait);
      continue;
    }

    throw new Error(lastError);
  }

  throw new Error(lastError);
}
