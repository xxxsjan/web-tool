/** Fish Audio TTS：内置音色、导出格式与请求辅助。
 * @see https://docs.fish.audio/
 */

export type FishAudioVoice = {
  /** reference_id / model _id */
  ShortName: string;
  FriendlyName: string;
  Gender: 'Male' | 'Female' | 'Neutral';
  Locale: string;
  Style: string;
  libraryUrl?: string;
};

export type FishAudioExportFormat = 'mp3' | 'wav' | 'ogg';

export type FishAudioExportFormatConfig = {
  value: FishAudioExportFormat;
  label: string;
  /** 传给 Fish Audio 的 format；ogg 先合成 mp3 再转码 */
  apiFormat: 'mp3' | 'wav';
  mime: string;
  ext: string;
};

export const FISH_AUDIO_API_BASE = 'https://api.fish.audio';

/** 规范化 API 根地址，去掉末尾斜杠 */
export function normalizeFishAudioApiBase(base?: string | null) {
  const raw = String(base || '').trim().replace(/\/+$/, '');
  return raw || FISH_AUDIO_API_BASE;
}

/** 免费开发档模型，新账号零额度可用；见官方 Quick Start */
export const FISH_AUDIO_DEFAULT_MODEL = 's2.1-pro-free';

/** 兼容旧版「平台默认」哨兵（本地缓存可能仍有） */
const FISH_AUDIO_LEGACY_DEFAULT = '__fish_default__';

/** 默认音色：曼波 */
export const FISH_AUDIO_DEFAULT_VOICE = '0f08cacd3e354471a4b94dd00b4cc4a3';

export const FISH_AUDIO_EXPORT_FORMATS: FishAudioExportFormatConfig[] = [
  {
    value: 'mp3',
    label: 'MP3',
    apiFormat: 'mp3',
    mime: 'audio/mpeg',
    ext: 'mp3',
  },
  {
    value: 'wav',
    label: 'WAV',
    apiFormat: 'wav',
    mime: 'audio/wav',
    ext: 'wav',
  },
  {
    value: 'ogg',
    label: 'OGG',
    apiFormat: 'mp3',
    mime: 'audio/ogg',
    ext: 'ogg',
  },
];

export function getFishAudioExportFormat(
  value?: string | null,
): FishAudioExportFormatConfig {
  return (
    FISH_AUDIO_EXPORT_FORMATS.find(f => f.value === value) ||
    FISH_AUDIO_EXPORT_FORMATS[0]
  );
}

/** 内置音色：热门中文 */
export const FISH_AUDIO_VOICES: FishAudioVoice[] = [
  {
    // https://fish.audio/zh-CN/m/0f08cacd3e354471a4b94dd00b4cc4a3/
    ShortName: FISH_AUDIO_DEFAULT_VOICE,
    FriendlyName: '曼波',
    Gender: 'Neutral',
    Locale: 'zh-CN',
    Style: '年轻社交媒体声',
    libraryUrl: 'https://fish.audio/zh-CN/m/0f08cacd3e354471a4b94dd00b4cc4a3/',
  },
  {
    // https://fish.audio/zh-CN/m/0eb38bc974e1459facca38b359e13511/
    ShortName: '0eb38bc974e1459facca38b359e13511',
    FriendlyName: '赛马娘',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '年轻活力女声',
    libraryUrl: 'https://fish.audio/zh-CN/m/0eb38bc974e1459facca38b359e13511/',
  },
  {
    // https://fish.audio/m/4ed45d53ee9245d9abf20db5221b19b2/
    ShortName: '4ed45d53ee9245d9abf20db5221b19b2',
    FriendlyName: '莫提斯',
    Gender: 'Neutral',
    Locale: 'zh-CN',
    Style: '高亢活力角色声',
    libraryUrl: 'https://fish.audio/zh-CN/m/4ed45d53ee9245d9abf20db5221b19b2/',
  },
  {
    // https://fish.audio/zh-CN/m/0ab6ea77e6684c76b57bada57c414698/
    ShortName: '0ab6ea77e6684c76b57bada57c414698',
    FriendlyName: '齐静春',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '沉稳中年男声',
    libraryUrl: 'https://fish.audio/zh-CN/m/0ab6ea77e6684c76b57bada57c414698/',
  },
  {
    // https://fish.audio/m/918a8277663d476b95e2c4867da0f6a6/
    ShortName: '918a8277663d476b95e2c4867da0f6a6',
    FriendlyName: '蒋介石',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '威严中年男声',
    libraryUrl: 'https://fish.audio/zh-CN/m/918a8277663d476b95e2c4867da0f6a6/',
  },
];

/** 单次请求建议上限（保守值；官方按额度计费） */
export const FISH_AUDIO_MAX_TEXT_LEN = 10000;

/** Fish model id 多为 32 位 hex；兼容旧版默认哨兵 */
export function isFishAudioVoiceId(id?: string | null): boolean {
  if (id == null) return false;
  const key = id.trim();
  if (key === FISH_AUDIO_LEGACY_DEFAULT) return true;
  return /^[a-f0-9]{32}$/i.test(key);
}

/** 转成 API 的 reference_id；旧版哨兵映射为曼波 */
export function toFishAudioReferenceId(id?: string | null): string {
  const key = String(id ?? '').trim();
  if (!key || key === FISH_AUDIO_LEGACY_DEFAULT) {
    return FISH_AUDIO_DEFAULT_VOICE;
  }
  return key;
}

export function getFishAudioVoice(id?: string | null): FishAudioVoice | null {
  if (id == null) return null;
  const key = id.trim();
  return FISH_AUDIO_VOICES.find(v => v.ShortName === key) || null;
}

function fishGenderLabel(v: FishAudioVoice) {
  if (v.Gender === 'Male') return '男声';
  if (v.Gender === 'Female') return '女声';
  return '中性';
}

export function shortFishAudioVoiceName(v: FishAudioVoice) {
  return `${v.FriendlyName} · ${fishGenderLabel(v)} · ${v.Style}`;
}

export function friendlyFishAudioVoiceLabel(v: FishAudioVoice) {
  return `${v.FriendlyName}（${fishGenderLabel(v)}，${v.Style}）`;
}

export function sortFishAudioVoices(list: FishAudioVoice[]): FishAudioVoice[] {
  const order = new Map(
    FISH_AUDIO_VOICES.map((v, i) => [v.ShortName, i] as const),
  );
  return [...list].sort((a, b) => {
    const ia = order.has(a.ShortName)
      ? (order.get(a.ShortName) as number)
      : 1000;
    const ib = order.has(b.ShortName)
      ? (order.get(b.ShortName) as number)
      : 1000;
    if (ia !== ib) return ia - ib;
    return a.FriendlyName.localeCompare(b.FriendlyName, 'zh');
  });
}

export function clampFishAudioSpeed(val: number) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 1;
  return Math.min(2, Math.max(0.5, Math.round(n * 10) / 10));
}
