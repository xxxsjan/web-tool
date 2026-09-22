import axios from 'axios';
import { createError, defineEventHandler, getQuery, readBody } from 'h3';

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const COMMON_HEADERS = {
  'User-Agent': MOBILE_UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  Referer: 'https://www.iesdouyin.com/',
};

/** 获取 ttwid，分享页 SSR 需要此 Cookie 才会下发 videoInfoRes */
const fetchTtwidCookie = async (): Promise<string> => {
  try {
    const res = await axios.post(
      'https://ttwid.bytedance.com/ttwid/union/register/',
      {
        region: 'cn',
        aid: 1768,
        needFid: false,
        service: 'www.ixigua.com',
        migrate_info: { ticket: '', source: 'node' },
        cbUrlProtocol: 'https',
        union: true,
      },
      {
        headers: {
          'User-Agent': MOBILE_UA,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
        validateStatus: () => true,
      },
    );
    const setCookie = res.headers['set-cookie'] || [];
    const joined = Array.isArray(setCookie)
      ? setCookie.join(';')
      : String(setCookie);
    const match = joined.match(/ttwid=([^;]+)/);
    return match ? `ttwid=${match[1]}` : '';
  } catch (error) {
    console.warn('获取 ttwid 失败:', error);
    return '';
  }
};

type AnyRecord = Record<string, any>;

const extractShareUrl = (text: string): string => {
  const patterns = [
    /https?:\/\/v\.douyin\.com\/[-\w]+\/?/i,
    /https?:\/\/www\.douyin\.com\/video\/\d+[^\s]*/i,
    /https?:\/\/www\.iesdouyin\.com\/share\/video\/\d+[^\s]*/i,
    /https?:\/\/www\.douyin\.com\/note\/\d+[^\s]*/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[0]) {
      const url = m[0];
      return url.endsWith('/') || url.includes('?') ? url : `${url}/`;
    }
  }
  return '';
};

const parseVideoId = (url: string): string => {
  if (!url) return '';
  const patterns = [
    /\/video\/(\d+)/,
    /\/share\/video\/(\d+)/,
    /\/note\/(\d+)/,
    /[?&](?:modal_id|aweme_id|item_ids)=(\d+)/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return '';
};

const findItemList = (obj: unknown, depth = 0): AnyRecord[] | null => {
  if (depth > 12 || obj == null) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findItemList(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === 'object') {
    const record = obj as AnyRecord;
    if (Array.isArray(record.item_list) && record.item_list.length > 0) {
      return record.item_list;
    }
    for (const value of Object.values(record)) {
      const found = findItemList(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
};

const pickFirstUrl = (addr?: AnyRecord): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const list = addr.url_list;
  if (Array.isArray(list) && list.length > 0) {
    return String(list[0] || '');
  }
  return '';
};

const toNoWatermark = (url: string): string => {
  if (!url) return '';
  return url
    .replace(/\/playwm\//g, '/play/')
    .replace(/playwm/g, 'play')
    .replace(/watermark=1/g, 'watermark=0');
};

const buildPlayUrls = (uri: string): string[] => {
  if (!uri) return [];
  if (/^https?:\/\//i.test(uri)) {
    return [toNoWatermark(uri)];
  }
  const ratios = ['1080p', '720p', '540p'];
  return ratios.map(
    ratio =>
      `https://aweme.snssdk.com/aweme/v1/play/?video_id=${encodeURIComponent(uri)}&ratio=${ratio}&line=0`,
  );
};

const resolveRedirectUrl = async (
  url: string,
  cookie = '',
): Promise<string> => {
  const response = await axios.get(url, {
    headers: {
      ...COMMON_HEADERS,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    maxRedirects: 10,
    timeout: 15000,
    validateStatus: status => status >= 200 && status < 400,
  });
  return (
    response.request?.res?.responseUrl ||
    response.request?.responseURL ||
    url
  );
};

const resolveAwemeId = async (
  input: string,
  cookie = '',
): Promise<{ awemeId: string; sourceUrl: string; resolvedUrl: string }> => {
  const sourceUrl = extractShareUrl(input);
  if (!sourceUrl) {
    throw createError({
      statusCode: 400,
      message: '未找到抖音链接，请粘贴含 v.douyin.com 的口令',
    });
  }

  let awemeId = parseVideoId(sourceUrl);
  let resolvedUrl = sourceUrl;

  if (!awemeId) {
    resolvedUrl = await resolveRedirectUrl(sourceUrl, cookie);
    awemeId = parseVideoId(resolvedUrl);
  }

  if (!awemeId) {
    throw createError({
      statusCode: 400,
      message: '无法解析视频 ID，请检查口令是否有效',
    });
  }

  return { awemeId, sourceUrl, resolvedUrl };
};

const parseSharePage = async (awemeId: string, cookie = '') => {
  const shareUrl = `https://www.iesdouyin.com/share/video/${awemeId}/`;
  const response = await axios.get(shareUrl, {
    headers: {
      ...COMMON_HEADERS,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    timeout: 20000,
    responseType: 'text',
  });

  const html = String(response.data || '');
  if (!html.includes('videoInfoRes') && !html.includes('item_list')) {
    throw createError({
      statusCode: 502,
      message: '分享页未返回作品数据，请稍后重试',
    });
  }

  const match = html.match(
    /window\._ROUTER_DATA\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/i,
  );
  if (!match?.[1]) {
    throw createError({
      statusCode: 502,
      message: '分享页未返回视频数据，可能已失效或触发风控',
    });
  }

  let routerData: AnyRecord;
  try {
    routerData = JSON.parse(match[1]);
  } catch {
    throw createError({ statusCode: 502, message: '解析分享页数据失败' });
  }

  const itemList = findItemList(routerData);
  if (!itemList?.length) {
    throw createError({
      statusCode: 404,
      message: '未找到作品信息，可能已删除或设为私密',
    });
  }

  const item = itemList[0] as AnyRecord;
  const video = item.video || {};
  const music = item.music || {};
  const author = item.author || {};
  const playAddr = video.play_addr || video.playAddr || {};
  const downloadAddr = video.download_addr || video.downloadAddr || {};
  const cover =
    pickFirstUrl(video.origin_cover) ||
    pickFirstUrl(video.cover) ||
    pickFirstUrl(video.dynamic_cover) ||
    '';

  const uri = String(playAddr.uri || '');
  const candidates = [
    ...buildPlayUrls(uri),
    toNoWatermark(pickFirstUrl(downloadAddr)),
    toNoWatermark(pickFirstUrl(playAddr)),
  ].filter(Boolean);

  // 去重并保留顺序
  const videoUrls = [...new Set(candidates)];
  if (!videoUrls.length && !item.images?.length) {
    throw createError({
      statusCode: 404,
      message: `未找到可下载视频（类型 ${item.aweme_type ?? '未知'}，可能是图文）`,
    });
  }

  const audioUrl =
    toNoWatermark(
      pickFirstUrl(music.play_url || music.playUrl || music.play_url_h264),
    ) || '';

  const images = Array.isArray(item.images)
    ? item.images
        .map((img: AnyRecord) =>
          pickFirstUrl(img.url_list ? { url_list: img.url_list } : img),
        )
        .filter(Boolean)
    : [];

  return {
    awemeId,
    title: String(item.desc || '').trim() || `douyin_${awemeId}`,
    author: String(author.nickname || author.unique_id || '').trim(),
    cover,
    videoUrl: videoUrls[0] || '',
    videoUrls,
    audioUrl,
    musicTitle: String(music.title || '').trim(),
    images,
    awemeType: item.aweme_type,
    shareUrl,
  };
};

export default defineEventHandler(async event => {
  try {
    const query = getQuery(event);
    let text = String(query.text || query.url || '').trim();

    if (!text && event.method !== 'GET') {
      const body = await readBody<{ text?: string; url?: string }>(event);
      text = String(body?.text || body?.url || '').trim();
    }

    if (!text) {
      throw createError({ statusCode: 400, message: '请提供抖音口令或链接' });
    }

    const cookie = await fetchTtwidCookie();
    const { awemeId, sourceUrl, resolvedUrl } = await resolveAwemeId(
      text,
      cookie,
    );
    const detail = await parseSharePage(awemeId, cookie);

    return {
      status: 'success',
      message: 'success',
      data: {
        ...detail,
        sourceUrl,
        resolvedUrl,
        timestamp: Date.now(),
      },
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    console.error('抖音解析失败:', error);
    const message =
      error instanceof Error ? error.message : '抖音解析失败，请稍后重试';
    throw createError({ statusCode: 500, message });
  }
});
