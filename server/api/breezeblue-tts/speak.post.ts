import {
  createError,
  defineEventHandler,
  readBody,
  sendStream,
  setResponseHeader,
} from 'h3';
import {
  BREEZEBLUE_MAX_TEXT_LEN,
  getBreezeBlueExportFormat,
  isBreezeBlueVoiceId,
} from '~/utils/breezeblue-tts';
import {
  streamBreezeBlueTtsServer,
  synthesizeBreezeBlueTtsServer,
} from '../../utils/breezeblue-tts-speak';

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
    /** 为 true 时尽量边生成边推流（ogg 仍整段） */
    stream?: boolean;
    /** pcm=低延迟朗读；mp3/wav=下载友好 */
    streamFormat?: string;
  }>(event);

  const apiKey = String(body?.apiKey || envKey || '').trim();
  const text = String(body?.text || '').trim();
  const voice = String(body?.voice || '').trim();
  const rate = Number(body?.rate ?? 1);
  const languageCode = String(body?.languageCode || 'zh').trim() || 'zh';
  const formatConfig = getBreezeBlueExportFormat(body?.format);
  const streamFormatRaw = String(body?.streamFormat || '')
    .trim()
    .toLowerCase();
  const streamFormat =
    streamFormatRaw === 'pcm' ||
    streamFormatRaw === 'mp3' ||
    streamFormatRaw === 'wav'
      ? streamFormatRaw
      : undefined;
  const wantStream =
    body?.stream !== false &&
    (streamFormat === 'pcm' || formatConfig.value !== 'ogg');

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

  const speakOpts = {
    text,
    voice,
    rate: Number.isFinite(rate) ? rate : 1,
    format: formatConfig.value,
    streamFormat,
    apiKey,
    languageCode,
  };

  try {
    // mp3 / wav：代理官方 /stream，边生成边写出
    if (wantStream) {
      const result = await streamBreezeBlueTtsServer(speakOpts);
      setResponseHeader(event, 'Content-Type', result.mime);
      setResponseHeader(event, 'Cache-Control', 'no-store');
      setResponseHeader(event, 'X-Accel-Buffering', 'no');
      setResponseHeader(
        event,
        'Content-Disposition',
        `inline; filename="speech.${result.ext}"`,
      );
      return sendStream(event, result.stream);
    }

    // ogg 等需整段转码
    const result = await synthesizeBreezeBlueTtsServer(speakOpts);
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
