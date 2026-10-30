import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import {
  FISH_AUDIO_DEFAULT_MODEL,
  FISH_AUDIO_MAX_TEXT_LEN,
  getFishAudioExportFormat,
  isFishAudioVoiceId,
} from '~/utils/fish-audio-tts';
import { synthesizeFishAudioTtsServer } from '../../utils/fish-audio-tts-speak';

export default defineEventHandler(async event => {
  const config = useRuntimeConfig();
  const envKey = String(config.fishApiKey || '').trim();
  const apiBase = String(config.fishApiBase || '').trim();

  const body = await readBody<{
    text?: string;
    voice?: string;
    rate?: number;
    format?: string;
    apiKey?: string;
    model?: string;
  }>(event);

  const apiKey = String(body?.apiKey || envKey || '').trim();
  const text = String(body?.text || '').trim();
  const voice = String(body?.voice ?? '').trim();
  const rate = Number(body?.rate ?? 1);
  const model = String(body?.model || FISH_AUDIO_DEFAULT_MODEL).trim();
  const formatConfig = getFishAudioExportFormat(body?.format);

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: '请填写 Fish Audio API Key',
    });
  }
  if (!text) {
    throw createError({ statusCode: 400, message: '文本不能为空' });
  }
  if (text.length > FISH_AUDIO_MAX_TEXT_LEN) {
    throw createError({
      statusCode: 400,
      message: `文本过长，最多 ${FISH_AUDIO_MAX_TEXT_LEN} 字`,
    });
  }
  if (!isFishAudioVoiceId(voice)) {
    throw createError({
      statusCode: 400,
      message: '请选择有效的 Fish Audio 音色',
    });
  }

  try {
    const result = await synthesizeFishAudioTtsServer({
      text,
      voice,
      rate: Number.isFinite(rate) ? rate : 1,
      format: formatConfig.value,
      apiKey,
      model,
      apiBase,
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
      message: error?.message || 'Fish Audio 语音合成失败',
    });
  }
});
