/** GPT-SoVITS api_v2 调试用常量与类型（对齐官方 TTS_Request） */

export type GptSovitsMediaType = 'wav' | 'ogg' | 'aac' | 'raw';

/** 与 api_v2 POST /tts 文档字段一致 */
export type GptSovitsTtsPayload = {
  text: string;
  text_lang: string;
  ref_audio_path: string;
  prompt_lang: string;
  prompt_text?: string;
  aux_ref_audio_paths?: string[];
  top_k?: number;
  top_p?: number;
  temperature?: number;
  text_split_method?: string;
  batch_size?: number;
  batch_threshold?: number;
  split_bucket?: boolean;
  speed_factor?: number;
  fragment_interval?: number;
  seed?: number;
  media_type?: GptSovitsMediaType;
  streaming_mode?: boolean | number;
  parallel_infer?: boolean;
  repetition_penalty?: number;
  sample_steps?: number;
  super_sampling?: boolean;
  overlap_length?: number;
  min_chunk_length?: number;
};

export const GPTSOVITS_DEFAULT_BASE = 'http://127.0.0.1:9880';

export const GPTSOVITS_LANGS: { value: string; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'yue', label: '粤语' },
  { value: 'auto', label: '多语种混合' },
  { value: 'auto_yue', label: '多语种混合(粤语)' },
];

export const GPTSOVITS_SPLIT_METHODS: { value: string; label: string }[] = [
  { value: 'cut0', label: '不切分' },
  { value: 'cut1', label: '凑四句一切' },
  { value: 'cut2', label: '凑 50 字一切' },
  { value: 'cut3', label: '按中文句号切' },
  { value: 'cut4', label: '按英文句号切' },
  { value: 'cut5', label: '按标点切(推荐)' },
];

export const GPTSOVITS_MEDIA_TYPES: {
  value: GptSovitsMediaType;
  label: string;
  mime: string;
  ext: string;
}[] = [
  { value: 'wav', label: 'WAV', mime: 'audio/wav', ext: 'wav' },
  { value: 'ogg', label: 'OGG', mime: 'audio/ogg', ext: 'ogg' },
  { value: 'aac', label: 'AAC', mime: 'audio/aac', ext: 'aac' },
  { value: 'raw', label: 'RAW PCM', mime: 'application/octet-stream', ext: 'pcm' },
];

/** 与 api_v2 tts_handle 一致：False→0，True→1 */
export const GPTSOVITS_STREAMING_MODES: {
  value: number;
  label: string;
}[] = [
  { value: 0, label: '0 关闭（整段返回）' },
  { value: 1, label: '1 高质量片段（慢）' },
  { value: 2, label: '2 中等流式' },
  { value: 3, label: '3 低质快速流式' },
];

export const getGptSovitsMediaType = (value?: string | null) => {
  const found = GPTSOVITS_MEDIA_TYPES.find(item => item.value === value);
  return found || GPTSOVITS_MEDIA_TYPES[0];
};

export const normalizeGptSovitsBaseUrl = (raw?: string | null) => {
  const text = String(raw || '').trim().replace(/\/+$/, '');
  return text || GPTSOVITS_DEFAULT_BASE;
};

const toFiniteNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeStreamingMode = (value: unknown): number => {
  if (value === true || value === 'true') return 1;
  if (value === false || value === 'false') return 0;
  const n = Number(value);
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return 0;
};

/**
 * 生成最终 POST /tts JSON（与官方 TTS_Request 默认值对齐）。
 * 页面预览与服务端代理共用，避免两边不一致。
 */
export const buildGptSovitsUpstreamBody = (
  payload: Partial<GptSovitsTtsPayload> = {},
): Record<string, unknown> => {
  const media = getGptSovitsMediaType(payload.media_type);
  const aux = Array.isArray(payload.aux_ref_audio_paths)
    ? payload.aux_ref_audio_paths.map(p => String(p || '').trim()).filter(Boolean)
    : [];

  const body: Record<string, unknown> = {
    text: String(payload.text || '').trim(),
    text_lang: String(payload.text_lang || '').trim().toLowerCase(),
    ref_audio_path: String(payload.ref_audio_path || '').trim(),
    aux_ref_audio_paths: aux,
    prompt_text: String(payload.prompt_text || ''),
    prompt_lang: String(payload.prompt_lang || '').trim().toLowerCase(),
    top_k: toFiniteNumber(payload.top_k, 15),
    top_p: toFiniteNumber(payload.top_p, 1),
    temperature: toFiniteNumber(payload.temperature, 1),
    text_split_method: String(payload.text_split_method || 'cut5'),
    batch_size: toFiniteNumber(payload.batch_size, 1),
    batch_threshold: toFiniteNumber(payload.batch_threshold, 0.75),
    split_bucket: payload.split_bucket !== false,
    speed_factor: toFiniteNumber(payload.speed_factor, 1),
    fragment_interval: toFiniteNumber(payload.fragment_interval, 0.3),
    seed: toFiniteNumber(payload.seed, -1),
    media_type: media.value,
    streaming_mode: normalizeStreamingMode(payload.streaming_mode),
    parallel_infer: payload.parallel_infer !== false,
    repetition_penalty: toFiniteNumber(payload.repetition_penalty, 1.35),
    sample_steps: toFiniteNumber(payload.sample_steps, 32),
    super_sampling: !!payload.super_sampling,
    overlap_length: toFiniteNumber(payload.overlap_length, 2),
    min_chunk_length: toFiniteNumber(payload.min_chunk_length, 16),
  };

  return body;
};
