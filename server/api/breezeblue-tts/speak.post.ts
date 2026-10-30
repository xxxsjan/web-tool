import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import {
  BREEZEBLUE_MAX_TEXT_LEN,
  getBreezeBlueExportFormat,
  isBreezeBlueVoiceId,
} from '~/utils/breezeblue-tts';
import { synthesizeBreezeBlueTtsServer } from '../../utils/breezeblue-tts-speak';

export default defineEventHandler(async event => {
  const config = useRuntimeConfig();
  const envKey = String(config.breezeApiKey || '').trim();

  const body = await readBody<{
    text?: string;
    voice?: string;
    rate?: number;
    format?: string;
    apiKey?: string;
    languageCode?: string;
  }>(event);

  const apiKey = String(body?.apiKey || envKey || '').trim();
  const text = String(body?.text || '').trim();
  const voice = String(body?.voice || '').trim();
  const rate = Number(body?.rate ?? 1);
  const languageCode = String(body?.languageCode || 'zh').trim() || 'zh';
  const formatConfig = getBreezeBlueExportFormat(body?.format);

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: '请填写 Breeze Blue API Key',
    });
  }
  if (!text) {
    throw createError({ statusCode: 400, message: '文本不能为空' });
  }
  if (text.length > BREEZEBLUE_MAX_TEXT_LEN) {
    throw createError({
      statusCode: 400,
      message: `文本过长，最多 ${BREEZEBLUE_MAX_TEXT_LEN} 字`,
    });
  }
  if (!voice || !isBreezeBlueVoiceId(voice)) {
    throw createError({
      statusCode: 400,
      message: '请选择有效的 Breeze Blue 音色',
    });
  }

  try {
    const result = await synthesizeBreezeBlueTtsServer({
      text,
      voice,
      rate: Number.isFinite(rate) ? rate : 1,
      format: formatConfig.value,
      apiKey,
      languageCode,
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
      message: error?.message || 'Breeze Blue 语音合成失败',
    });
  }
});
