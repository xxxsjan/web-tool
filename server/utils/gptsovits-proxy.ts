import { createError } from 'h3';
import { normalizeGptSovitsBaseUrl } from '~/utils/gptsovits';

const ALLOWED_HOST_RE =
  /^(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])$/i;

export function resolveGptSovitsBase(raw?: string | null) {
  const base = normalizeGptSovitsBaseUrl(raw);
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw createError({ statusCode: 400, message: 'API 地址格式无效' });
  }

  if (!/^https?:$/i.test(url.protocol)) {
    throw createError({ statusCode: 400, message: '仅支持 http/https 地址' });
  }

  // 调试页默认连本机；禁止任意外网 SSRF
  if (!ALLOWED_HOST_RE.test(url.hostname)) {
    throw createError({
      statusCode: 400,
      message: '调试代理仅允许访问本机地址（127.0.0.1 / localhost）',
    });
  }

  return base;
}

export async function readUpstreamError(res: Response, fallback: string) {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const json = JSON.parse(text) as {
        message?: string;
        Exception?: string;
        detail?: string | { msg?: string }[];
      };
      if (typeof json.message === 'string' && json.message.trim()) {
        return json.Exception
          ? `${json.message}: ${json.Exception}`
          : json.message;
      }
      if (typeof json.detail === 'string' && json.detail.trim()) {
        return json.detail;
      }
      if (Array.isArray(json.detail) && json.detail[0]?.msg) {
        return json.detail.map(d => d.msg).filter(Boolean).join('; ');
      }
    } catch {
      /* plain text */
    }
    return text.slice(0, 500);
  } catch {
    return fallback;
  }
}

/**
 * 修复 api_v2 流式 WAV：首包 wave_header 里 data size=0，
 * 浏览器/部分播放器会当成空音频（有时长或可打开但没声音）。
 */
export function repairStreamingWavHeader(buf: Buffer): Buffer {
  if (buf.length < 44) return buf;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return buf;
  if (buf.toString('ascii', 8, 12) !== 'WAVE') return buf;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'data') {
      const dataStart = offset + 8;
      const actual = buf.length - dataStart;
      if (actual <= 0) return buf;
      if (size === actual) return buf;

      const out = Buffer.from(buf);
      out.writeUInt32LE(actual, offset + 4);
      out.writeUInt32LE(out.length - 8, 4);
      return out;
    }
    // 非法 size 时避免死循环
    if (size < 0 || offset + 8 + size > buf.length + 1) break;
    offset += 8 + size;
    if (size % 2 === 1) offset += 1;
  }
  return buf;
}
