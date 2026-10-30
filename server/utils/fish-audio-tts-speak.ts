import { setDefaultResultOrder } from 'node:dns';
import {
  FishAudioClient,
  FishAudioError,
  FishAudioTimeoutError,
} from 'fish-audio';
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

// 部分网络下 api.fish.audio 的 IPv6 解析异常，合成请求优先走 IPv4
try {
  setDefaultResultOrder('ipv4first');
} catch {
  /* ignore */
}

function parseErrorDetail(body: unknown) {
  if (body == null) return '';
  if (typeof body === 'string') {
    try {
      return parseErrorDetail(JSON.parse(body));
    } catch {
      return body.slice(0, 240).trim();
    }
  }
  if (typeof body !== 'object') return String(body).slice(0, 240);

  const json = body as {
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
  try {
    return JSON.stringify(body).slice(0, 240);
  } catch {
    return '';
  }
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
  if (status === 400 || status === 422) {
    return detail || '请求参数无效，请检查音色 ID';
  }
  if (status >= 500) {
    return detail || 'Fish Audio 服务暂时不可用，请稍后再试';
  }
  return detail || `HTTP ${status}`;
}

/** 把 SDK / undici 网络错误展开成可读原因 */
function friendlyNetworkError(err: any) {
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
  return 'Fish Audio 网络请求失败';
}

function mapSdkError(err: unknown): Error {
  if (err instanceof FishAudioTimeoutError) {
    return new Error('Fish Audio 合成超时，请稍后重试');
  }
  if (err instanceof FishAudioError) {
    const status = Number(err.statusCode || 0);
    const detail = parseErrorDetail(err.body);
    if (status > 0) {
      return new Error(
        `Fish Audio 合成失败（${status}）：${friendlyMessage(status, detail)}`,
      );
    }
    const network = friendlyNetworkError(err);
    if (network) return new Error(network);
    return new Error(detail || err.message || 'Fish Audio 合成失败');
  }
  if (err instanceof Error) {
    return new Error(friendlyNetworkError(err));
  }
  return new Error('Fish Audio 合成失败');
}

async function collectAudioStream(
  stream: ReadableStream<Uint8Array> | null | undefined,
): Promise<Buffer> {
  if (!stream) {
    throw new Error('Fish Audio 返回空音频流');
  }
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.byteLength) chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

/**
 * 服务端转发 Fish Audio TTS（官方 fish-audio SDK）。
 * @see https://docs.fish.audio/developer-guide/sdk-guide/javascript/text-to-speech
 * @see https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
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
  // npm 0.1.0 默认 backend 仍是已弃用的 s1，必须显式传入
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

  const client = new FishAudioClient({
    apiKey: key,
    baseUrl: apiRoot,
  });

  // latency: balanced 优先首包；免费档 s2.1-pro-free 无 TTFA 保障，仍可能偏慢
  const request = {
    text: trimmed,
    reference_id: referenceId,
    format: formatConfig.apiFormat,
    normalize: true as const,
    latency: 'balanced' as const,
    ...(formatConfig.apiFormat === 'mp3' ? { mp3_bitrate: 128 as const } : {}),
    prosody: {
      speed,
      volume: 0,
    },
  };

  let stream: ReadableStream<Uint8Array>;
  try {
    // SDK Backends 类型仍停在 s1；第二个参数会写入 model 请求头
    stream = await client.textToSpeech.convert(
      request,
      modelHeader as 's1',
      {
        timeoutInSeconds: Math.max(1, Math.ceil(timeoutMs / 1000)),
        // 免费档本身较慢，失败重试不宜过多（SDK 默认会再重试 2 次）
        maxRetries: 1,
      },
    );
  } catch (err) {
    throw mapSdkError(err);
  }

  let audio = await collectAudioStream(stream);
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
