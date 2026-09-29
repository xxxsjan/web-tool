import {
  createError,
  defineEventHandler,
  setResponseHeader,
} from 'h3';
import {
  buildVoicesListUrl,
  edgeTtsUserAgent,
  generateSecMsGec,
  normalizeEdgeVoices,
} from '~/utils/edge-tts';

export default defineEventHandler(async event => {
  try {
    const secMsGec = await generateSecMsGec();
    const url = buildVoicesListUrl(secMsGec);
    const res = await fetch(url, {
      headers: {
        Accept: '*/*',
        'User-Agent': edgeTtsUserAgent(),
      },
    });

    if (!res.ok) {
      throw createError({
        statusCode: res.status,
        statusMessage: `获取音色列表失败 (${res.status})`,
      });
    }

    const data = await res.json();
    const voices = normalizeEdgeVoices(data);
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
    return { voices };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    throw createError({
      statusCode: 502,
      statusMessage: error?.message || 'Edge TTS 音色列表请求失败',
    });
  }
});
