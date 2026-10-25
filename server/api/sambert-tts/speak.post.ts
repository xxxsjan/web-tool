import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import {
  getSambertExportFormat,
  getSambertVoice,
} from '~/utils/sambert-tts';
import { synthesizeSambertTtsServer } from '../../utils/sambert-tts-speak';

const MAX_TEXT_LEN = 10000;

export default defineEventHandler(async event => {
  const config = useRuntimeConfig();
  const envKey = String(config.dashscopeApiKey || '').trim();
  const workspaceId = String(config.dashscopeWorkspaceId || '').trim();

  const body = await readBody<{
    text?: string;
    voice?: string;
    rate?: number;
    volume?: number;
    pitch?: number;
    format?: string;
    apiKey?: string;
  }>(event);

  const apiKey = String(body?.apiKey || envKey || '').trim();
  const text = String(body?.text || '').trim();
  const voice = String(body?.voice || '').trim();
  const rate = Number(body?.rate ?? 1);
  const volume = Number(body?.volume ?? 50);
  const pitch = Number(body?.pitch ?? 1);
  const formatConfig = getSambertExportFormat(body?.format);

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: '请填写阿里云百炼 API Key',
    });
  }
  if (!text) {
    throw createError({ statusCode: 400, message: '文本不能为空' });
  }
  if (text.length > MAX_TEXT_LEN) {
    throw createError({
      statusCode: 400,
      message: `文本过长，最多 ${MAX_TEXT_LEN} 字`,
    });
  }
  if (!voice || !getSambertVoice(voice)) {
    throw createError({ statusCode: 400, message: '请选择有效的 Sambert 音色' });
  }

  try {
    const result = await synthesizeSambertTtsServer({
      text,
      voice,
      rate: Number.isFinite(rate) ? rate : 1,
      volume: Number.isFinite(volume) ? volume : 50,
      pitch: Number.isFinite(pitch) ? pitch : 1,
      format: formatConfig.value,
      apiKey,
      workspaceId: workspaceId || undefined,
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
      message: error?.message || 'Sambert 语音合成失败',
    });
  }
});
