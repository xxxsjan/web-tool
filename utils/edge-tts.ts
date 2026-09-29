/** Microsoft Edge Read Aloud TTS helpers (Sec-MS-GEC + SSML). */

export const EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
export const EDGE_TTS_CHROMIUM_VERSION = '143.0.3650.75';
export const EDGE_TTS_SEC_MS_GEC_VERSION = `1-${EDGE_TTS_CHROMIUM_VERSION}`;

const CHROMIUM_MAJOR = EDGE_TTS_CHROMIUM_VERSION.split('.')[0];

export const EDGE_TTS_VOICES_URL =
  'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list';

export const EDGE_TTS_WSS_BASE =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

export type EdgeVoice = {
  ShortName: string;
  FriendlyName: string;
  Gender: string;
  Locale: string;
  Name?: string;
};

export type EdgeExportFormat = 'mp3' | 'wav' | 'ogg';

export type EdgeExportFormatConfig = {
  value: EdgeExportFormat;
  label: string;
  /** Edge TTS speech.config outputFormat */
  edgeFormat: string;
  mime: string;
  ext: string;
};

/**
 * 导出可选格式。
 * Edge 免费接口稳定输出主要为 MP3；WAV / OGG 由服务端转码得到。
 */
export const EDGE_EXPORT_FORMATS: EdgeExportFormatConfig[] = [
  {
    value: 'mp3',
    label: 'MP3',
    edgeFormat: 'audio-24khz-48kbitrate-mono-mp3',
    mime: 'audio/mpeg',
    ext: 'mp3',
  },
  {
    value: 'wav',
    label: 'WAV',
    edgeFormat: 'audio-24khz-48kbitrate-mono-mp3',
    mime: 'audio/wav',
    ext: 'wav',
  },
  {
    value: 'ogg',
    label: 'OGG',
    edgeFormat: 'audio-24khz-48kbitrate-mono-mp3',
    mime: 'audio/ogg',
    ext: 'ogg',
  },
];

export function getEdgeExportFormat(
  value?: string | null,
): EdgeExportFormatConfig {
  return (
    EDGE_EXPORT_FORMATS.find(f => f.value === value) || EDGE_EXPORT_FORMATS[0]
  );
}

export const EDGE_VOICE_ALIAS: Record<string, string> = {
  'Microsoft Xiaoxiao Online (Natural)': '晓晓（女声，普通话）',
  'Microsoft Xiaoyi Online (Natural)': '晓伊（女声，普通话）',
  'Microsoft Yunjian Online (Natural)': '云健（男声，普通话）',
  'Microsoft Yunxi Online (Natural)': '云希（男声，普通话）',
  'Microsoft Yunxia Online (Natural)': '云夏（女声，普通话）',
  'Microsoft Yunyang Online (Natural)': '云阳（男声，普通话）',
  'Microsoft Xiaobei Online (Natural)': '晓北（女声，东北话）',
  'Microsoft HsiaoChen Online (Natural)': '晓辰（女声，台湾话）',
  'Microsoft HsiaoYu Online (Natural)': '晓雨（女声，台湾国语）',
  'Microsoft YunJhe Online (Natural)': '云哲（男声，台湾话）',
  'Microsoft HiuGaai Online (Natural)': '曉佳（女声，粤语）',
  'Microsoft HiuMaan Online (Natural)': '曉曼（女声，香港粤语）',
  'Microsoft WanLung Online (Natural)': '雲龍（男声，香港粤语）',
  'Microsoft Xiaoni Online (Natural)': '晓妮（女声，陕西话）',
};

/** 由 EDGE_VOICE_ALIAS 推导兜底音色（接口失败 / 首屏用） */
export function getFallbackZhVoices(): EdgeVoice[] {
  return sortEdgeVoices(
    Object.keys(EDGE_VOICE_ALIAS)
      .map(voiceFromAliasKey)
      .filter((v): v is EdgeVoice => !!v),
  );
}

function voiceFromAliasKey(friendly: string): EdgeVoice | null {
  const match = /^Microsoft\s+(\w+)\s+Online\s*\(Natural\)$/i.exec(friendly);
  if (!match?.[1]) return null;

  const name = match[1];
  const label = EDGE_VOICE_ALIAS[friendly] || '';
  const gender = /男声/.test(label) ? 'Male' : 'Female';

  let locale = 'zh-CN';
  let shortName = `zh-CN-${name}Neural`;
  if (name === 'Xiaobei') {
    locale = 'zh-CN-liaoning';
    shortName = 'zh-CN-liaoning-XiaobeiNeural';
  } else if (name === 'Xiaoni') {
    locale = 'zh-CN-shaanxi';
    shortName = 'zh-CN-shaanxi-XiaoniNeural';
  } else if (name.startsWith('Hsiao') || name === 'YunJhe') {
    locale = 'zh-TW';
    shortName = `zh-TW-${name}Neural`;
  } else if (name.startsWith('Hiu') || name === 'WanLung') {
    locale = 'zh-HK';
    shortName = `zh-HK-${name}Neural`;
  }

  return {
    ShortName: shortName,
    FriendlyName: friendly,
    Gender: gender,
    Locale: locale,
  };
}

/** 普通话优先，其次方言 / 台港，再其他 */
export function sortEdgeVoices(list: EdgeVoice[]): EdgeVoice[] {
  const aliasKeys = Object.keys(EDGE_VOICE_ALIAS);

  const rank = (v: EdgeVoice) => {
    const label = shortVoiceName(v);
    if (/普通话/.test(label)) return 0;
    // 标准大陆普通话 locale（不含辽宁、陕西等子地区）
    if (v.Locale === 'zh-CN') return 0;
    if (v.Locale.startsWith('zh-CN')) return 1;
    if (v.Locale.startsWith('zh-TW')) return 2;
    if (v.Locale.startsWith('zh-HK')) return 3;
    if (v.Locale.toLowerCase().startsWith('zh')) return 4;
    return 5;
  };

  const aliasIndex = (v: EdgeVoice) => {
    const key = edgeAliasKeyFromShortName(v.ShortName);
    const fromFriendly = (v.FriendlyName || '').split(' - ')[0].trim();
    const idx = aliasKeys.findIndex(
      k => k === key || k === fromFriendly || fromFriendly.startsWith(k),
    );
    return idx === -1 ? 999 : idx;
  };

  return [...list].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const byAlias = aliasIndex(a) - aliasIndex(b);
    if (byAlias !== 0) return byAlias;
    return shortVoiceName(a).localeCompare(shortVoiceName(b), 'zh');
  });
}

export function edgeTtsUserAgent() {
  return (
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
    `(KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR}.0.0.0 Safari/537.36 ` +
    `Edg/${CHROMIUM_MAJOR}.0.0.0`
  );
}

/** Node/ws 握手所需 headers（浏览器无法自定义） */
export function edgeTtsWsHeaders() {
  const ua = edgeTtsUserAgent();
  const muid = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return {
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': ua,
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Cookie: `muid=${muid};`,
  };
}

/** 与官方 edge-tts 一致的时间戳格式 */
export function edgeTtsTimestamp() {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${pad(d.getUTCDate())} ` +
    `${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ` +
    `GMT+0000 (Coordinated Universal Time)`
  );
}

export async function generateSecMsGec(
  token: string = EDGE_TTS_TOKEN,
): Promise<string> {
  // Unix → Windows FILETIME epoch, round down to 5 minutes, SHA-256
  const ticks = Math.floor(Date.now() / 1000) + 11644473600;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10_000_000;
  const data = new TextEncoder().encode(`${windowsTicks}${token}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function buildVoicesListUrl(secMsGec: string) {
  const q = new URLSearchParams({
    trustedclienttoken: EDGE_TTS_TOKEN,
    'Sec-MS-GEC': secMsGec,
    'Sec-MS-GEC-Version': EDGE_TTS_SEC_MS_GEC_VERSION,
  });
  return `${EDGE_TTS_VOICES_URL}?${q.toString()}`;
}

export async function buildSynthWsUrl(connectionId: string) {
  const secMsGec = await generateSecMsGec();
  const q = new URLSearchParams({
    TrustedClientToken: EDGE_TTS_TOKEN,
    'Sec-MS-GEC': secMsGec,
    'Sec-MS-GEC-Version': EDGE_TTS_SEC_MS_GEC_VERSION,
    ConnectionId: connectionId,
  });
  return `${EDGE_TTS_WSS_BASE}?${q.toString()}`;
}

export function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 将 0.5–2.0 倍速转为 Edge SSML rate（相对默认语速的百分比） */
export function rateToProsody(rate: number) {
  const pct = Math.round((Math.min(2, Math.max(0.5, rate)) - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export function buildSsml(
  text: string,
  voice: string,
  rate: number,
  locale = 'zh-CN',
) {
  const rateStr = rateToProsody(rate);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}">` +
    `<prosody rate="${rateStr}" pitch="+0Hz" volume="+0%">` +
    `${escapeXml(text)}` +
    `</prosody></voice></speak>`
  );
}

export function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/** 从 ShortName 推导 Edge Online 友好名 key */
function edgeAliasKeyFromShortName(shortName: string) {
  // zh-CN-XiaoxiaoNeural / zh-CN-liaoning-XiaobeiNeural / zh-TW-HsiaoChenNeural
  const match = shortName.match(
    /-([A-Za-z]+)(?:Neural|MultilingualNeural)?$/i,
  );
  if (!match?.[1]) return '';
  return `Microsoft ${match[1]} Online (Natural)`;
}

/** tag / 列表展示名 */
export function shortVoiceName(v: EdgeVoice) {
  const friendlyRaw = (v.FriendlyName || '').trim();
  const friendlyBase = friendlyRaw.split(' - ')[0].trim();

  if (friendlyBase && EDGE_VOICE_ALIAS[friendlyBase]) {
    return EDGE_VOICE_ALIAS[friendlyBase];
  }
  if (friendlyRaw && EDGE_VOICE_ALIAS[friendlyRaw]) {
    return EDGE_VOICE_ALIAS[friendlyRaw];
  }

  // FriendlyName 可能带 locale 后缀，用 startsWith 再碰一次
  for (const [key, label] of Object.entries(EDGE_VOICE_ALIAS)) {
    if (friendlyRaw.startsWith(key) || friendlyBase.startsWith(key)) {
      return label;
    }
  }

  const fromShort = edgeAliasKeyFromShortName(v.ShortName);
  if (fromShort && EDGE_VOICE_ALIAS[fromShort]) {
    return EDGE_VOICE_ALIAS[fromShort];
  }

  // 大小写不敏感兜底（ShortName 段）
  const lower = fromShort.toLowerCase();
  for (const [key, label] of Object.entries(EDGE_VOICE_ALIAS)) {
    if (key.toLowerCase() === lower) return label;
  }

  return (
    friendlyBase ||
    friendlyRaw ||
    v.ShortName
      .replace(/^Microsoft\s+/i, '')
      .replace(/\s*Online\s*\(Natural\)\s*/i, '')
      .split(' - ')[0]
      .trim()
  );
}

export function voiceGenderLabel(v: EdgeVoice) {
  // 别名里已含「女声/男声」时不再重复标注
  const alias = shortVoiceName(v);
  if (/[男女]声/.test(alias)) return '';
  if (v.Gender === 'Female') return '女';
  if (v.Gender === 'Male') return '男';
  return '';
}

export function friendlyVoiceLabel(v: EdgeVoice) {
  const name = shortVoiceName(v);
  if (EDGE_VOICE_ALIAS[edgeAliasKeyFromShortName(v.ShortName)] || /（/.test(name)) {
    return `${name} · ${v.Locale}`;
  }
  const gender = voiceGenderLabel(v);
  return `${name} · ${v.Locale}${gender ? ` · ${gender}` : ''}`;
}

export function normalizeEdgeVoices(data: unknown): EdgeVoice[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { voices?: unknown })?.voices)
      ? ((data as { voices: unknown[] }).voices as unknown[])
      : [];

  return list
    .map((item: any) => ({
      ShortName: String(item?.ShortName || item?.Name || ''),
      FriendlyName: String(
        item?.FriendlyName || item?.DisplayName || item?.ShortName || '',
      ),
      Gender: String(item?.Gender || ''),
      Locale: String(item?.Locale || ''),
      Name: item?.Name ? String(item.Name) : undefined,
    }))
    .filter(v => v.ShortName);
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array) {
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function concatChunks(chunks: Uint8Array[]) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * 浏览器端通过 WebSocket 合成 MP3。
 * 返回完整音频字节；调用方可创建 Blob URL 播放。
 */
export function synthesizeEdgeTtsBrowser(
  text: string,
  voice: string,
  rate = 1,
  locale = 'zh-CN',
): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    const trimmed = text.trim();
    if (!trimmed) {
      reject(new Error('文本为空'));
      return;
    }

    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      reject(err);
    };
    const done = (audio: Uint8Array) => {
      if (settled) return;
      settled = true;
      resolve(audio);
    };

    const connectionId = randomHex(16);
    const requestId = randomHex(16);
    let url: string;
    try {
      url = await buildSynthWsUrl(connectionId);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    const chunks: Uint8Array[] = [];
    const delim = new TextEncoder().encode('Path:audio\r\n');
    let inactivityTimer: ReturnType<typeof setTimeout> | undefined;

    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        fail(new Error('合成超时，请检查网络后重试'));
      }, 30000);
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      resetTimer();
      const ts = new Date().toUTCString();
      const config =
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(config);

      const ssml = buildSsml(trimmed, voice, rate, locale);
      const speech =
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${ts}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(speech);
    };

    ws.onmessage = event => {
      resetTimer();
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          ws.close();
        }
        return;
      }

      const buf = new Uint8Array(event.data as ArrayBuffer);
      const idx = indexOfBytes(buf, delim);
      if (idx !== -1) {
        chunks.push(buf.slice(idx + delim.length));
      }
    };

    ws.onerror = () => {
      fail(new Error('Edge TTS 连接失败'));
    };

    ws.onclose = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (settled) return;
      const audio = concatChunks(chunks);
      if (!audio.length) {
        fail(new Error('未收到音频数据'));
        return;
      }
      done(audio);
    };
  });
}
