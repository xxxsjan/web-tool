/** Breeze Blue TTS：内置音色、导出格式与请求辅助。 */

export type BreezeBlueVoice = {
  /** Voice ID，如 voc_u3nxkd5578wc */
  ShortName: string;
  FriendlyName: string;
  Gender: 'Male' | 'Female';
  Locale: string;
  /** 特色描述 */
  Style: string;
  /** 音色库页面 */
  libraryUrl?: string;
};

export type BreezeBlueExportFormat = 'mp3' | 'wav' | 'ogg';

export type BreezeBlueExportFormatConfig = {
  value: BreezeBlueExportFormat;
  label: string;
  /** 传给 Breeze Blue 的 output_format；ogg 先合成 mp3 再转码 */
  apiFormat: 'mp3' | 'wav_24000';
  mime: string;
  ext: string;
};

export const BREEZEBLUE_API_BASE = 'https://api.breeze.blue/v1';

export const BREEZEBLUE_EXPORT_FORMATS: BreezeBlueExportFormatConfig[] = [
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
    apiFormat: 'wav_24000',
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

export function getBreezeBlueExportFormat(
  value?: string | null,
): BreezeBlueExportFormatConfig {
  return (
    BREEZEBLUE_EXPORT_FORMATS.find(f => f.value === value) ||
    BREEZEBLUE_EXPORT_FORMATS[0]
  );
}

/** 页面内置默认音色：大肥鱼机灵版 / 迷糊版 */
export const BREEZEBLUE_VOICES: BreezeBlueVoice[] = [
  {
    ShortName: 'voc_u3nxkd5578wc',
    FriendlyName: '大肥鱼（机灵版）',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '机灵女声',
    libraryUrl:
      'https://breezeblue.ai/zh/voice-library/dafeiyu-clever-girl-voice-vu3nxkd5578wc',
  },
  {
    ShortName: 'voc_8yud7hz7c9q2',
    FriendlyName: '大肥鱼（迷糊版）',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '迷糊女声',
    libraryUrl:
      'https://breezeblue.ai/zh/voice-library/dafeiyu-dreamy-girl-voice-v8yud7hz7c9q2',
  },
];

export const BREEZEBLUE_DEFAULT_VOICE = 'voc_u3nxkd5578wc';

/** HTTP 同步合成默认字数上限（账号更高额度另议） */
export const BREEZEBLUE_MAX_TEXT_LEN = 1000;

export function isBreezeBlueVoiceId(id?: string | null): boolean {
  if (!id) return false;
  return id.startsWith('voc_');
}

export function getBreezeBlueVoice(id?: string | null): BreezeBlueVoice | null {
  if (!id) return null;
  return BREEZEBLUE_VOICES.find(v => v.ShortName === id) || null;
}

function breezeGenderLabel(v: BreezeBlueVoice) {
  return v.Gender === 'Male' ? '男声' : '女声';
}

/** 列表/徽章用：大肥鱼（机灵版） · 女声 · 机灵女声 */
export function shortBreezeBlueVoiceName(v: BreezeBlueVoice) {
  return `${v.FriendlyName} · ${breezeGenderLabel(v)} · ${v.Style}`;
}

/** 悬停/播放提示 */
export function friendlyBreezeBlueVoiceLabel(v: BreezeBlueVoice) {
  return `${v.FriendlyName}（${breezeGenderLabel(v)}，${v.Style}，中文）`;
}

export function sortBreezeBlueVoices(
  list: BreezeBlueVoice[],
): BreezeBlueVoice[] {
  const order = new Map(
    BREEZEBLUE_VOICES.map((v, i) => [v.ShortName, i] as const),
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

export function clampBreezeBlueSpeed(val: number) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 1;
  return Math.min(2, Math.max(0.5, Math.round(n * 10) / 10));
}
