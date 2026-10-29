import { createError, defineEventHandler, readBody } from 'h3';
import { resolveGptSovitsBase } from '../../utils/gptsovits-proxy';

type Action =
  | 'ping'
  | 'set_refer_audio'
  | 'set_gpt_weights'
  | 'set_sovits_weights'
  | 'control';

const ACTIONS = new Set<Action>([
  'ping',
  'set_refer_audio',
  'set_gpt_weights',
  'set_sovits_weights',
  'control',
]);

export default defineEventHandler(async event => {
  const body = await readBody<{
    baseUrl?: string;
    action?: string;
    path?: string;
    command?: string;
  }>(event);

  const baseUrl = resolveGptSovitsBase(body?.baseUrl);
  const action = String(body?.action || '').trim() as Action;

  if (!ACTIONS.has(action)) {
    throw createError({ statusCode: 400, message: '未知操作' });
  }

  if (action === 'ping') {
    const started = Date.now();
    // api_v2 无专门 health；对 /docs 或根路径探测连通性
    const candidates = [`${baseUrl}/docs`, `${baseUrl}/openapi.json`, baseUrl];
    let lastError = '连接失败';
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'GET' });
        return {
          ok: true,
          status: res.status,
          latencyMs: Date.now() - started,
          probed: url,
          message: res.ok
            ? '服务可达'
            : `服务有响应但状态码 ${res.status}`,
        };
      } catch (error: any) {
        lastError = error?.message || '网络错误';
      }
    }
    throw createError({
      statusCode: 502,
      message: `无法连接 GPT-SoVITS：${lastError}`,
    });
  }

  let url: string;
  if (action === 'control') {
    const command = String(body?.command || '').trim();
    if (!command) {
      throw createError({ statusCode: 400, message: '请填写 control 命令' });
    }
    url = `${baseUrl}/control?command=${encodeURIComponent(command)}`;
  } else if (action === 'set_refer_audio') {
    const path = String(body?.path || '').trim();
    if (!path) {
      throw createError({ statusCode: 400, message: '请填写参考音频路径' });
    }
    url = `${baseUrl}/set_refer_audio?refer_audio_path=${encodeURIComponent(path)}`;
  } else if (action === 'set_gpt_weights') {
    const path = String(body?.path || '').trim();
    if (!path) {
      throw createError({ statusCode: 400, message: '请填写 GPT 权重路径' });
    }
    url = `${baseUrl}/set_gpt_weights?weights_path=${encodeURIComponent(path)}`;
  } else {
    const path = String(body?.path || '').trim();
    if (!path) {
      throw createError({ statusCode: 400, message: '请填写 SoVITS 权重路径' });
    }
    url = `${baseUrl}/set_sovits_weights?weights_path=${encodeURIComponent(path)}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: `无法连接 GPT-SoVITS：${error?.message || '网络错误'}`,
    });
  }

  const contentType = res.headers.get('content-type') || '';
  let data: unknown = null;
  let text = '';
  try {
    text = await res.text();
    if (contentType.includes('application/json') || text.startsWith('{')) {
      data = JSON.parse(text);
    } else {
      data = text || null;
    }
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    let msg = `操作失败 (${res.status})`;
    if (data && typeof data === 'object') {
      const obj = data as { message?: string; Exception?: string };
      if (obj.message) {
        msg = obj.Exception ? `${obj.message}: ${obj.Exception}` : obj.message;
      }
    } else if (text.trim()) {
      msg = text.slice(0, 500);
    }
    throw createError({ statusCode: 502, message: msg });
  }

  return {
    ok: true,
    action,
    status: res.status,
    data,
  };
});
