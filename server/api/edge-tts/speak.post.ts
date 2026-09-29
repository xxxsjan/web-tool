import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import { getEdgeExportFormat } from '~/utils/edge-tts';
import { synthesizeEdgeTtsServer } from '../../utils/edge-tts-speak';

const MAX_TEXT_LEN = 3000;

export default defineEventHandler(async event => {
  const body = await readBody<{
    text?: string;
    voice?: string;
    rate?: number;
    locale?: string;
    format?: string;
  }>(event);

  const text = String(body?.text || '').trim();
  const voice = String(body?.voice || '').trim();
  const rate = Number(body?.rate ?? 1);
  const locale = String(body?.locale || 'zh-CN').trim() || 'zh-CN';
  const formatConfig = getEdgeExportFormat(body?.format);

  if (!text) {
    throw createError({ statusCode: 400, message: '文本不能为空' });
  }
  if (text.length > MAX_TEXT_LEN) {
    throw createError({
      statusCode: 400,
      message: `文本过长，最多 ${MAX_TEXT_LEN} 字`,
    });
  }
  if (!voice) {
    throw createError({ statusCode: 400, message: '请选择音色' });
  }

  try {
    const result = await synthesizeEdgeTtsServer({
      text,
      voice,
      rate: Number.isFinite(rate) ? rate : 1,
      locale,
      format: formatConfig.value,
    });

    setResponseHeader(event, 'Content-Type', result.mime);
    setResponseHeader(event, 'Content-Length', String(result.audio.length));
    setResponseHeader(event, 'Cache-Control', 'no-store');
    setResponseHeader(
      event,
      'Content-Disposition',
      `inline; filename="speech.${result.ext}"`,
    );
    return result.audio;
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: error?.message || '语音合成失败',
    });
  }
});
