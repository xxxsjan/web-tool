/** 阿里云百炼 Sambert TTS：音色列表与导出格式。 */

export type SambertVoice = {
  /** 模型 ID，如 sambert-zhichu-v1 */
  ShortName: string;
  FriendlyName: string;
  Gender: 'Male' | 'Female';
  Locale: string;
  /** 特色描述 */
  Style: string;
  sampleRate: 16000 | 48000;
};

export type SambertExportFormat = 'mp3' | 'wav' | 'ogg';

export type SambertExportFormatConfig = {
  value: SambertExportFormat;
  label: string;
  /** 传给 Sambert 的 format；ogg 先合成 mp3 再转码 */
  apiFormat: 'mp3' | 'wav';
  mime: string;
  ext: string;
};

export const SAMBERT_EXPORT_FORMATS: SambertExportFormatConfig[] = [
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

export function getSambertExportFormat(
  value?: string | null,
): SambertExportFormatConfig {
  return (
    SAMBERT_EXPORT_FORMATS.find(f => f.value === value) ||
    SAMBERT_EXPORT_FORMATS[0]
  );
}

/** 官方音色表（知系列 + 英文 / 小语种） */
export const SAMBERT_VOICES: SambertVoice[] = [
  {
    ShortName: 'sambert-zhinan-v1',
    FriendlyName: '知楠',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '广告男声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhiqi-v1',
    FriendlyName: '知琪',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '温柔女声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhichu-v1',
    FriendlyName: '知厨',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '舌尖男声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhide-v1',
    FriendlyName: '知德',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '新闻男声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhijia-v1',
    FriendlyName: '知佳',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '标准女声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhiru-v1',
    FriendlyName: '知茹',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '新闻女声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhiqian-v1',
    FriendlyName: '知倩',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '资讯女声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhixiang-v1',
    FriendlyName: '知祥',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '磁性男声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhiwei-v1',
    FriendlyName: '知薇',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '萝莉女声',
    sampleRate: 48000,
  },
  {
    ShortName: 'sambert-zhihao-v1',
    FriendlyName: '知浩',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '咨询男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhijing-v1',
    FriendlyName: '知婧',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '严厉女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiming-v1',
    FriendlyName: '知茗',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '诙谐男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhimo-v1',
    FriendlyName: '知墨',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '情感男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhina-v1',
    FriendlyName: '知娜',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '浙普女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhishu-v1',
    FriendlyName: '知树',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '资讯男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhistella-v1',
    FriendlyName: '知莎',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '知性女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiting-v1',
    FriendlyName: '知婷',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '电台女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhixiao-v1',
    FriendlyName: '知笑',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '资讯女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiya-v1',
    FriendlyName: '知雅',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '客服女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiye-v1',
    FriendlyName: '知晔',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '青年男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiying-v1',
    FriendlyName: '知颖',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '软萌童声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiyuan-v1',
    FriendlyName: '知媛',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '知心姐姐',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhiyue-v1',
    FriendlyName: '知悦',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '温柔女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhigui-v1',
    FriendlyName: '知柜',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '直播女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhishuo-v1',
    FriendlyName: '知硕',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '自然男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhimiao-emo-v1',
    FriendlyName: '知妙',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '多情感女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhimao-v1',
    FriendlyName: '知猫',
    Gender: 'Female',
    Locale: 'zh-CN',
    Style: '直播女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhilun-v1',
    FriendlyName: '知伦',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '悬疑解说',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhifei-v1',
    FriendlyName: '知飞',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '激昂解说',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-zhida-v1',
    FriendlyName: '知达',
    Gender: 'Male',
    Locale: 'zh-CN',
    Style: '标准男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-beth-v1',
    FriendlyName: 'Beth',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '咨询女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-betty-v1',
    FriendlyName: 'Betty',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '客服女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-cally-v1',
    FriendlyName: 'Cally',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '自然女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-cindy-v1',
    FriendlyName: 'Cindy',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '对话女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-eva-v1',
    FriendlyName: 'Eva',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '陪伴女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-donna-v1',
    FriendlyName: 'Donna',
    Gender: 'Female',
    Locale: 'en-US',
    Style: '教育女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-brian-v1',
    FriendlyName: 'Brian',
    Gender: 'Male',
    Locale: 'en-US',
    Style: '客服男声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-camila-v1',
    FriendlyName: 'Camila',
    Gender: 'Female',
    Locale: 'es-ES',
    Style: '西班牙语女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-perla-v1',
    FriendlyName: 'Perla',
    Gender: 'Female',
    Locale: 'it-IT',
    Style: '意大利语女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-indah-v1',
    FriendlyName: 'Indah',
    Gender: 'Female',
    Locale: 'id-ID',
    Style: '印尼语女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-clara-v1',
    FriendlyName: 'Clara',
    Gender: 'Female',
    Locale: 'fr-FR',
    Style: '法语女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-hanna-v1',
    FriendlyName: 'Hanna',
    Gender: 'Female',
    Locale: 'de-DE',
    Style: '德语女声',
    sampleRate: 16000,
  },
  {
    ShortName: 'sambert-waan-v1',
    FriendlyName: 'Waan',
    Gender: 'Female',
    Locale: 'th-TH',
    Style: '泰语女声',
    sampleRate: 16000,
  },
];

export const SAMBERT_DEFAULT_VOICE = 'sambert-zhijia-v1';

export function isSambertVoiceId(id?: string | null): boolean {
  if (!id) return false;
  return SAMBERT_VOICES.some(v => v.ShortName === id);
}

export function getSambertVoice(id?: string | null): SambertVoice | null {
  if (!id) return null;
  return SAMBERT_VOICES.find(v => v.ShortName === id) || null;
}

function sambertGenderLabel(v: SambertVoice) {
  return v.Gender === 'Male' ? '男声' : '女声';
}

function sambertLocaleLabel(v: SambertVoice) {
  if (v.Locale.startsWith('zh')) return '中英';
  if (v.Locale.startsWith('en')) return '美式英文';
  if (v.Locale.startsWith('es')) return '西班牙语';
  if (v.Locale.startsWith('it')) return '意大利语';
  if (v.Locale.startsWith('id')) return '印尼语';
  if (v.Locale.startsWith('fr')) return '法语';
  if (v.Locale.startsWith('de')) return '德语';
  if (v.Locale.startsWith('th')) return '泰语';
  return v.Locale;
}

/** 列表/徽章用：知佳 · 女声 · 标准女声 */
export function shortSambertVoiceName(v: SambertVoice) {
  return `${v.FriendlyName} · ${sambertGenderLabel(v)} · ${v.Style}`;
}

/** 悬停/播放提示：知佳（女声，标准女声，中英） */
export function friendlySambertVoiceLabel(v: SambertVoice) {
  return `${v.FriendlyName}（${sambertGenderLabel(v)}，${v.Style}，${sambertLocaleLabel(v)}）`;
}

export function sortSambertVoices(list: SambertVoice[]): SambertVoice[] {
  const rank = (v: SambertVoice) => {
    if (v.Locale === 'zh-CN') return 0;
    if (v.Locale.startsWith('zh')) return 1;
    if (v.Locale.startsWith('en')) return 2;
    return 3;
  };
  return [...list].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return a.FriendlyName.localeCompare(b.FriendlyName, 'zh');
  });
}

/** 兼容公共域名；有 WorkspaceId 时走业务空间专属域名 */
export function buildSambertWsUrl(workspaceId?: string | null) {
  const id = String(workspaceId || '').trim();
  if (id) {
    return `wss://${id}.cn-beijing.maas.aliyuncs.com/api-ws/v1/inference`;
  }
  return 'wss://dashscope.aliyuncs.com/api-ws/v1/inference';
}
