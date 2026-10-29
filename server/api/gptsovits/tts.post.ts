import {
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
} from 'h3';
import {
  buildGptSovitsUpstreamBody,
  getGptSovitsMediaType,
  type GptSovitsTtsPayload,
} from '~/utils/gptsovits';
import {
  readUpstreamError,
  repairStreamingWavHeader,
  resolveGptSovitsBase,
} from '../../utils/gptsovits-proxy';

const MAX_TEXT_LEN = 5000;

export default defineEventHandler(async event => {
  const body = await readBody<{
    baseUrl?: string;
    payload?: GptSovitsTtsPayload;
  }>(event);

  const baseUrl = resolveGptSovitsBase(body?.baseUrl);
  const payload = body?.payload || ({} as GptSovitsTtsPayload);
  // 本代理会整段缓冲后再返回；流式 WAV 头 data=0 会导致浏览器无声，强制非流式
  const upstreamBody = buildGptSovitsUpstreamBody({
    ...payload,
    streaming_mode: 0,
  });

  const text = String(upstreamBody.text || '');
  const textLang = String(upstreamBody.text_lang || '');
  const refAudioPath = String(upstreamBody.ref_audio_path || '');
  const promptLang = String(upstreamBody.prompt_lang || '');
  const media = getGptSovitsMediaType(String(upstreamBody.media_type || 'wav'));

  if (!text) {
    throw createError({ statusCode: 400, message: '文本不能为空' });
  }
  if (text.length > MAX_TEXT_LEN) {
    throw createError({
      statusCode: 400,
      message: `文本过长，最多 ${MAX_TEXT_LEN} 字`,
    });
  }
  if (!textLang) {
    throw createError({ statusCode: 400, message: '请选择合成文本语言' });
  }
  if (!refAudioPath) {
    throw createError({ statusCode: 400, message: '请填写参考音频路径' });
  }
  if (!promptLang) {
    throw createError({ statusCode: 400, message: '请选择参考音频语言' });
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `无法连接 GPT-SoVITS：${error?.message || '网络错误'}`,
    });
  }

  if (!res.ok) {
    const msg = await readUpstreamError(res, `合成失败 (${res.status})`);
    throw createError({
      statusCode: res.status === 400 ? 400 : 502,
      message: msg,
    });
  }

  let buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) {
    throw createError({ statusCode: 502, message: '上游返回空音频' });
  }

  // 上游失败时偶发仍返回 200 + JSON；按内容类型兜底
  const contentType = res.headers.get('content-type') || media.mime;
  if (contentType.includes('application/json')) {
    try {
      const json = JSON.parse(buf.toString('utf8')) as {
        message?: string;
        Exception?: string;
      };
      const msg = json.Exception
        ? `${json.message || '合成失败'}: ${json.Exception}`
        : json.message || '合成失败';
      throw createError({ statusCode: 400, message: msg });
    } catch (e: any) {
      if (e?.statusCode) throw e;
      throw createError({ statusCode: 502, message: '上游返回异常 JSON' });
    }
  }

  // 再兜底修一遍（若上游仍回了流式拼接 wav）
  if (media.value === 'wav' || contentType.includes('wav')) {
    buf = repairStreamingWavHeader(buf);
  }

  // 明显不是音频（例如误把 JSON/HTML 当二进制）
  const head = buf.subarray(0, 4).toString('ascii');
  if (
    media.value === 'wav' &&
    head !== 'RIFF' &&
    !contentType.includes('ogg') &&
    !contentType.includes('aac')
  ) {
    const maybeText = buf.subarray(0, 200).toString('utf8');
    throw createError({
      statusCode: 502,
      message: `上游未返回有效 WAV（开头=${JSON.stringify(head)}）：${maybeText.slice(0, 120)}`,
    });
  }

  const outType =
    media.value === 'wav'
      ? 'audio/wav'
      : media.value === 'ogg'
        ? 'audio/ogg'
        : media.value === 'aac'
          ? 'audio/aac'
          : contentType || media.mime;

  setResponseHeader(event, 'Content-Type', outType);
  setResponseHeader(event, 'Content-Length', String(buf.length));
  setResponseHeader(event, 'Cache-Control', 'no-store');
  setResponseHeader(
    event,
    'Content-Disposition',
    `inline; filename="gptsovits.${media.ext}"`,
  );
  setResponseHeader(event, 'X-GptSovits-Media-Type', media.value);
  return buf;
});
