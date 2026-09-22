import axios from 'axios';
import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
  setResponseStatus,
} from 'h3';

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const ALLOWED_HOST_HINTS = [
  'douyin',
  'iesdouyin',
  'snssdk',
  'byteicdn',
  'byteimg',
  'bytecdn',
  'douyinpic',
  'douyinstatic',
  'douyinvod',
  'zjcdn',
  'bytedance',
  'toutiao',
  'ixigua',
  'ibytedtos',
  'amemv',
];

const isAllowedMediaUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOST_HINTS.some(hint => host.includes(hint));
  } catch {
    return false;
  }
};

const sanitizeFilename = (name: string, fallback: string) => {
  const cleaned = String(name || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
};

const guessExt = (contentType: string, filename: string, kind: string) => {
  if (/\.\w{2,5}$/i.test(filename)) return '';
  if (contentType.includes('audio') || kind === 'audio') return '.mp3';
  if (contentType.includes('image')) return '.jpg';
  return '.mp4';
};

export default defineEventHandler(async event => {
  const query = getQuery(event);
  const url = String(query.url || '').trim();
  const kind = String(query.kind || 'video').toLowerCase();
  const filenameRaw = String(query.filename || (kind === 'audio' ? 'douyin-audio' : 'douyin-video'));

  if (!url) {
    throw createError({ statusCode: 400, message: '缺少下载地址' });
  }
  if (!isAllowedMediaUrl(url)) {
    throw createError({ statusCode: 400, message: '不支持的下载域名' });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120000,
      maxRedirects: 8,
      headers: {
        'User-Agent': MOBILE_UA,
        Referer: 'https://www.douyin.com/',
        Accept: '*/*',
      },
      validateStatus: status => status >= 200 && status < 400,
    });

    const contentType =
      String(response.headers['content-type'] || '').split(';')[0] ||
      (kind === 'audio' ? 'audio/mpeg' : 'video/mp4');

    const baseName = sanitizeFilename(filenameRaw, kind === 'audio' ? 'douyin-audio' : 'douyin-video');
    const ext = guessExt(contentType, baseName, kind);
    const downloadName = `${baseName}${ext}`;
    const asciiName =
      downloadName.replace(/[^\x20-\x7E]/g, '_') ||
      (kind === 'audio' ? 'douyin-audio.mp3' : 'douyin-video.mp4');

    const buffer = Buffer.from(response.data);

    setResponseStatus(event, 200);
    setResponseHeader(event, 'Content-Type', contentType);
    setResponseHeader(event, 'Content-Length', String(buffer.length));
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
    );
    setResponseHeader(event, 'Cache-Control', 'no-store');

    return buffer;
  } catch (error: unknown) {
    console.error('抖音代理下载失败:', error);
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : '下载失败，请稍后重试';
    throw createError({ statusCode: 502, message });
  }
});
