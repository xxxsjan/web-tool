<template>
  <div class="mx-auto w-full max-w-3xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        文本转语音
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        Microsoft Edge 在线神经音色 · 含晓晓 / 云希等
      </p>
    </header>

    <section class="overflow-hidden rounded-2xl tool-panel">
      <div class="space-y-5 p-4 sm:p-5">
        <!-- 文本 -->
        <div>
          <div class="mb-2 flex items-center justify-between gap-2">
            <label
              for="tts-text"
              class="text-sm font-medium text-base-content/70"
            >
              朗读文本
            </label>
            <span class="font-mono text-[11px] text-base-content/40">
              {{ text.length }} 字
            </span>
          </div>
          <textarea
            id="tts-text"
            v-model="text"
            rows="10"
            class="tts-textarea w-full resize-y text-sm leading-relaxed"
            placeholder="在此输入要朗读的文本…"
            :disabled="busy"
          ></textarea>
        </div>

        <!-- 音色（可折叠：仅用户点击后展开，避免刷新时被浏览器恢复展开） -->
        <div class="rounded-xl border border-app-strong bg-base-200/30">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-base-200/50 sm:px-3.5"
            :aria-expanded="voicePanelOpen"
            @click="voicePanelOpen = !voicePanelOpen"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-base-content/70">
                  音色
                </span>
                <span
                  v-if="!voicePanelOpen"
                  class="tts-badge tts-badge--primary truncate"
                >
                  {{ selectedVoiceLabel }}
                </span>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 shrink-0 text-base-content/45 transition-transform duration-300"
              :class="{ 'rotate-180': voicePanelOpen }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            v-if="voicePanelOpen"
            class="space-y-3 border-t border-app px-3 pb-3 pt-3 sm:px-3.5"
          >
            <div>
              <p class="mb-2 text-xs font-medium text-base-content/55">语言</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in localeOptions"
                  :key="item.value"
                  type="button"
                  class="tts-chip"
                  :class="
                    localeFilter === item.value
                      ? 'tts-chip--active'
                      : 'tts-chip--ghost'
                  "
                  @click="localeFilter = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <p class="text-xs font-medium text-base-content/55">可选音色</p>
                <span class="tts-badge tts-badge--muted">
                  {{ filteredVoices.length }} 个
                </span>
              </div>
              <div
                class="voice-tags flex max-h-44 flex-wrap content-start gap-2 overflow-y-auto pr-1 sm:max-h-52"
              >
                <button
                  v-for="v in filteredVoices"
                  :key="v.ShortName"
                  type="button"
                  class="tts-chip"
                  :class="
                    selectedVoice === v.ShortName
                      ? 'tts-chip--active'
                      : 'tts-chip--ghost'
                  "
                  :title="friendlyVoiceLabel(v)"
                  :disabled="busy"
                  @click="selectVoice(v.ShortName)"
                >
                  <span>{{ shortVoiceName(v) }}</span>
                </button>
                <p
                  v-if="!filteredVoices.length"
                  class="text-xs text-base-content/50"
                >
                  当前语言下暂无音色
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 语速 / 音量：固定一行两列 -->
        <div class="grid w-full grid-cols-2 gap-x-5 gap-y-4">
          <div class="min-w-0">
            <div class="mb-2 flex items-center justify-between gap-2">
              <label
                for="tts-rate"
                class="text-sm font-medium text-base-content/70"
              >
                语速
              </label>
              <span class="font-mono text-sm text-base-content">
                {{ rate.toFixed(1) }}x
              </span>
            </div>
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="w-9 shrink-0 text-right font-mono text-[11px] text-base-content/45"
              >
                0.5x
              </span>
              <input
                id="tts-rate"
                v-model.number="rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                class="tts-range min-w-0 flex-1"
                :disabled="busy"
              />
              <span
                class="w-10 shrink-0 font-mono text-[11px] text-base-content/45"
              >
                2.0x
              </span>
            </div>
          </div>

          <div class="min-w-0">
            <div class="mb-2 flex items-center justify-between gap-2">
              <label
                for="tts-volume"
                class="text-sm font-medium text-base-content/70"
              >
                音量
              </label>
              <span class="font-mono text-sm text-base-content">
                {{ volume }}%
                <span v-if="volume > 100" class="ml-1 text-[11px] text-warning">
                  增强
                </span>
              </span>
            </div>
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="w-9 shrink-0 text-right font-mono text-[11px] text-base-content/45"
              >
                0%
              </span>
              <input
                id="tts-volume"
                v-model.number="volume"
                type="range"
                min="0"
                max="200"
                step="1"
                class="tts-range min-w-0 flex-1"
              />
              <span
                class="w-10 shrink-0 font-mono text-[11px] text-base-content/45"
              >
                200%
              </span>
            </div>
          </div>
        </div>

        <!-- 操作 -->
        <button
          type="button"
          class="wave-panel relative w-full overflow-hidden rounded-xl border border-app bg-base-200/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-base-200/70 disabled:cursor-not-allowed disabled:opacity-60"
          :class="{
            'wave-panel--active': playing && !paused,
            'wave-panel--paused': paused,
            'wave-panel--busy': busy && busyMode === 'speak',
          }"
          :disabled="
            (!canSpeak && !playing && !paused) || (busy && busyMode !== 'speak')
          "
          :aria-label="speakerAriaLabel"
          :title="speakerAriaLabel"
          @click="toggleSpeak"
        >
          <canvas
            ref="waveCanvas"
            class="wave-canvas block h-12 w-full"
            aria-hidden="true"
          ></canvas>
          <p
            v-if="!playing && !paused && !(busy && busyMode === 'speak')"
            class="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-base-content/40"
          >
            点击开始朗读
          </p>
          <p
            v-else-if="busy && busyMode === 'speak'"
            class="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] text-base-content/50"
          >
            <span class="tts-spinner tts-spinner--xs" aria-hidden="true"></span>
            合成中…
          </p>
          <p
            v-else-if="paused"
            class="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-base-content/50"
          >
            已暂停，点击继续播放
          </p>
        </button>

        <audio
          ref="audioEl"
          class="hidden"
          @play="onAudioPlay"
          @pause="onAudioPause"
          @ended="onAudioEnded"
        ></audio>

        <div
          v-if="errorMessage"
          class="rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="statusTip"
          class="rounded-xl border border-app bg-base-200/40 px-3 py-2 text-xs text-base-content/60"
        >
          {{ statusTip }}
        </div>
        <!-- 导出 -->
        <div
          class="export-bar rounded-xl border border-app bg-base-200/30 p-3 sm:p-3.5"
        >
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="mb-2 flex items-center gap-2">
                <p class="text-sm font-medium text-base-content/70">导出格式</p>
                <span class="text-[11px] text-base-content/40">
                  下载为 {{ exportFormatLabel }}
                </span>
              </div>
              <div
                class="inline-flex rounded-full border border-app-strong bg-base-100 p-1"
                role="group"
                aria-label="导出格式"
              >
                <button
                  v-for="item in EDGE_EXPORT_FORMATS"
                  :key="item.value"
                  type="button"
                  class="tts-chip h-8 px-4"
                  :class="
                    exportFormat === item.value
                      ? 'tts-chip--active'
                      : 'tts-chip--ghost'
                  "
                  :disabled="busy"
                  @click="exportFormat = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <button
              type="button"
              class="tts-btn-success inline-flex items-center justify-center gap-2 sm:min-w-[8.5rem]"
              :disabled="!canDownload"
              @click="download"
            >
              <span
                v-if="busy && busyMode === 'download'"
                class="tts-spinner tts-spinner--sm"
                aria-hidden="true"
              ></span>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              {{
                busy && busyMode === 'download'
                  ? '准备中…'
                  : `下载 ${exportFormatLabel}`
              }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <p class="mt-5 text-center text-[11px] text-base-content/40 sm:text-xs">
      使用 Edge 在线 TTS，需联网 · 导出支持 MP3 / WAV / OGG
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '🔊文本转语音',
  group: '媒体类',
  ssr: false,
});

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  EDGE_EXPORT_FORMATS,
  friendlyVoiceLabel,
  getEdgeExportFormat,
  getFallbackZhVoices,
  shortVoiceName,
  sortEdgeVoices,
  type EdgeExportFormat,
  type EdgeVoice,
} from '~/utils/edge-tts';

const STORAGE_KEY = 'web-tool-text-to-speech';
const LOCALE_VALUES = ['zh', 'en', 'ja', 'ko', 'all'] as const;

const localeOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'all', label: '全部' },
] as const;

const DEFAULT_TEXT =
  '本网页直接调用 Microsoft Edge 在线神经语音合成，默认音色为晓晓，支持调节语速并下载音频。';

const text = ref(DEFAULT_TEXT);
const rate = ref(1.5);
const volume = ref(100);
const exportFormat = ref<EdgeExportFormat>('wav');
const voices = ref<EdgeVoice[]>(getFallbackZhVoices());
const selectedVoice = ref('zh-CN-XiaoxiaoNeural');
const localeFilter = ref<string>('zh');
const voicePanelOpen = ref(false);
const busy = ref(false);
const busyMode = ref<'speak' | 'download' | ''>('');
const playing = ref(false);
const paused = ref(false);
const statusTip = ref('');
const errorMessage = ref('');
const audioEl = ref<HTMLAudioElement | null>(null);
const waveCanvas = ref<HTMLCanvasElement | null>(null);
const lastAudioBlob = ref<Blob | null>(null);
const lastAudioMeta = ref<{
  text: string;
  voice: string;
  rate: number;
  format: EdgeExportFormat;
} | null>(null);

let prefsReady = false;

const clampRate = (val: number) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return 1.5;
  return Math.min(2, Math.max(0.5, Math.round(n * 10) / 10));
};

const clampVolumePct = (val: number) =>
  Math.min(200, Math.max(0, Number(val) || 0));

const loadPrefs = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      text?: string;
      rate?: number;
      volume?: number;
      selectedVoice?: string;
      localeFilter?: string;
      exportFormat?: string;
    };

    if (typeof parsed.text === 'string') text.value = parsed.text;
    if (parsed.rate != null) rate.value = clampRate(parsed.rate);
    if (parsed.volume != null) volume.value = clampVolumePct(parsed.volume);
    if (
      typeof parsed.selectedVoice === 'string' &&
      parsed.selectedVoice.trim()
    ) {
      selectedVoice.value = parsed.selectedVoice.trim();
    }
    if (
      typeof parsed.localeFilter === 'string' &&
      (LOCALE_VALUES as readonly string[]).includes(parsed.localeFilter)
    ) {
      localeFilter.value = parsed.localeFilter;
    }
    if (typeof parsed.exportFormat === 'string') {
      exportFormat.value = getEdgeExportFormat(parsed.exportFormat).value;
    }
  } catch {
    /* ignore */
  }
};

const persistPrefs = () => {
  if (!prefsReady || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        text: text.value,
        rate: rate.value,
        volume: volume.value,
        selectedVoice: selectedVoice.value,
        localeFilter: localeFilter.value,
        exportFormat: exportFormat.value,
      }),
    );
  } catch {
    /* ignore */
  }
};

const ensureVoiceSelection = (list: EdgeVoice[]) => {
  if (!list.length) return;
  if (list.some(v => v.ShortName === selectedVoice.value)) return;
  const xiaoxiao = list.find(v => v.ShortName.includes('XiaoxiaoNeural'));
  selectedVoice.value = xiaoxiao?.ShortName || list[0].ShortName;
};

let objectUrl = '';
let aborting = false;
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let waveRaf = 0;
let freqData: Uint8Array | null = null;

const BAR_COUNT = 48;

const ensureAudioGraph = () => {
  const el = audioEl.value;
  if (!el || typeof window === 'undefined') return;

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (!analyserNode) {
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.72;
    freqData = new Uint8Array(analyserNode.frequencyBinCount);
  }
  if (!gainNode) {
    gainNode = audioCtx.createGain();
    analyserNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  }
  // createMediaElementSource 每个 audio 元素只能调用一次
  if (!mediaSource) {
    mediaSource = audioCtx.createMediaElementSource(el);
    mediaSource.connect(analyserNode);
    // 音量改由 GainNode 控制，元素本身固定满幅
    el.volume = 1;
  }
};

const getWaveColor = () => {
  if (typeof window === 'undefined') return '#3b82f6';
  const styles = getComputedStyle(document.documentElement);
  return (
    styles.getPropertyValue('--color-primary').trim() ||
    styles.getPropertyValue('--p').trim() ||
    '#3b82f6'
  );
};

const resizeWaveCanvas = () => {
  const canvas = waveCanvas.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
};

const drawWaveFrame = (active: boolean) => {
  const canvas = waveCanvas.value;
  if (!canvas) return;
  resizeWaveCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const color = getWaveColor();
  const gap = Math.max(2, width / BAR_COUNT / 4);
  const barWidth = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT;
  const midY = height / 2;

  let values: number[] = [];
  if (active && analyserNode && freqData) {
    analyserNode.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>);
    const usable = Math.floor(freqData.length * 0.7);
    for (let i = 0; i < BAR_COUNT; i++) {
      const idx = Math.floor((i / BAR_COUNT) * usable);
      values.push(freqData[idx] / 255);
    }
  } else {
    // 空闲 / 暂停：低矮静态波形
    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / (BAR_COUNT - 1);
      values.push(0.08 + 0.06 * Math.sin(t * Math.PI * 4));
    }
  }

  for (let i = 0; i < BAR_COUNT; i++) {
    const amp = Math.max(0.04, values[i] || 0);
    const barH = Math.max(2, amp * height * 0.9);
    const x = i * (barWidth + gap);
    const y = midY - barH / 2;
    ctx.globalAlpha = active ? 0.55 + amp * 0.45 : 0.28;
    ctx.fillStyle = color;
    const radius = Math.min(barWidth / 2, 3);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, barWidth, barH, radius);
    } else {
      ctx.rect(x, y, barWidth, barH);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const stopWaveLoop = () => {
  if (waveRaf) {
    cancelAnimationFrame(waveRaf);
    waveRaf = 0;
  }
};

const startWaveLoop = () => {
  stopWaveLoop();
  const tick = () => {
    const active = playing.value && !paused.value;
    drawWaveFrame(active);
    if (active) {
      waveRaf = requestAnimationFrame(tick);
    } else {
      waveRaf = 0;
    }
  };
  waveRaf = requestAnimationFrame(tick);
};

const applyVolume = (pct = volume.value) => {
  const gain = clampVolumePct(pct) / 100;
  ensureAudioGraph();
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
  } else if (audioEl.value) {
    // 无 Web Audio 时退回原生上限 100%
    audioEl.value.volume = Math.min(1, gain);
  }
};

const resumeAudioCtx = async () => {
  ensureAudioGraph();
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
};

const filteredVoices = computed(() => {
  const list = voices.value;
  const filtered =
    localeFilter.value === 'all'
      ? list
      : list.filter(v => v.Locale.toLowerCase().startsWith(localeFilter.value));
  return sortEdgeVoices(filtered);
});

const canSpeak = computed(
  () => !!text.value.trim() && !!selectedVoice.value && !busy.value,
);

const canDownload = computed(
  () => !!text.value.trim() && !!selectedVoice.value && !busy.value,
);

const speakerAriaLabel = computed(() => {
  if (busy.value && busyMode.value === 'speak') return '合成中';
  if (playing.value && !paused.value) return '暂停朗读';
  if (paused.value) return '继续朗读';
  return '开始朗读';
});

const exportFormatLabel = computed(
  () => getEdgeExportFormat(exportFormat.value).label,
);

const selectedMeta = computed(
  () => voices.value.find(v => v.ShortName === selectedVoice.value) || null,
);

const selectedVoiceLabel = computed(() => {
  if (selectedMeta.value) return shortVoiceName(selectedMeta.value);
  return selectedVoice.value.replace(/^.*-/, '') || selectedVoice.value;
});

const selectVoice = (shortName: string) => {
  selectedVoice.value = shortName;
  voicePanelOpen.value = false;
};

watch(filteredVoices, list => {
  if (!list.length) return;
  // 当前筛选下没有已选音色时，才回退；优先保留本地缓存的选择
  if (!list.some(v => v.ShortName === selectedVoice.value)) {
    ensureVoiceSelection(list);
  }
});

watch(volume, val => {
  applyVolume(val);
});

watch([text, rate, volume, selectedVoice, localeFilter, exportFormat], () => {
  persistPrefs();
});

const revokeUrl = () => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = '';
  }
};

/** 仅停止播放，保留已合成音频供下载 */
const stop = () => {
  aborting = true;
  const el = audioEl.value;
  if (el) {
    el.pause();
    el.removeAttribute('src');
    el.load();
  }
  revokeUrl();
  busy.value = false;
  busyMode.value = '';
  playing.value = false;
  paused.value = false;
  drawWaveFrame(false);
};

const buildFileName = () => {
  const voiceKey =
    selectedVoice.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'voice';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const ext = getEdgeExportFormat(exportFormat.value).ext;
  return `tts-${voiceKey}-${rate.value.toFixed(1)}x-${stamp}.${ext}`;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const readFetchErrorMessage = async (e: any, fallback: string) => {
  const fromFields =
    e?.data?.message ||
    e?.data?.statusMessage ||
    e?.statusMessage ||
    e?.message;
  if (typeof fromFields === 'string' && fromFields.trim()) {
    // ofetch 常把 body 摘要拼进 message；优先拆出可读中文
    const m = fromFields.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (m?.[1]) {
      try {
        return JSON.parse(`"${m[1]}"`);
      } catch {
        return m[1];
      }
    }
    if (!/^\[(?:GET|POST|PUT|DELETE|PATCH)\]/i.test(fromFields)) {
      return fromFields;
    }
  }

  const data = e?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      if (json?.message || json?.statusMessage) {
        return String(json.message || json.statusMessage);
      }
    } catch {
      /* ignore */
    }
  }

  return fallback;
};

const synthesize = async (
  content: string,
  format: EdgeExportFormat = 'mp3',
) => {
  const locale = selectedMeta.value?.Locale || 'zh-CN';
  const formatConfig = getEdgeExportFormat(format);
  try {
    const blob = await $fetch<Blob>('/api/edge-tts/speak', {
      method: 'POST',
      body: {
        text: content,
        voice: selectedVoice.value,
        rate: rate.value,
        locale,
        format: formatConfig.value,
      },
      responseType: 'blob',
    });
    lastAudioBlob.value = blob;
    lastAudioMeta.value = {
      text: content,
      voice: selectedVoice.value,
      rate: rate.value,
      format: formatConfig.value,
    };
    return { blob, locale, format: formatConfig };
  } catch (e: any) {
    const msg = await readFetchErrorMessage(e, '合成失败，请检查网络后重试');
    throw new Error(msg);
  }
};

const onAudioPlay = () => {
  playing.value = true;
  paused.value = false;
  startWaveLoop();
};
const onAudioPause = () => {
  if (audioEl.value && !audioEl.value.ended) {
    paused.value = true;
    drawWaveFrame(false);
  }
};
const onAudioEnded = () => {
  playing.value = false;
  paused.value = false;
  drawWaveFrame(false);
};

const pause = () => {
  audioEl.value?.pause();
};
const resume = async () => {
  try {
    await resumeAudioCtx();
    await audioEl.value?.play();
  } catch {
    errorMessage.value = '播放失败，请重试';
  }
};

const toggleSpeak = async () => {
  if (busy.value && busyMode.value === 'speak') return;

  if (playing.value && !paused.value) {
    pause();
    return;
  }
  if (paused.value) {
    await resume();
    return;
  }
  await speakText(text.value);
};

const speakText = async (content: string) => {
  const trimmed = content.trim();
  if (!trimmed || !selectedVoice.value) return;

  stop();
  aborting = false;
  busy.value = true;
  busyMode.value = 'speak';
  errorMessage.value = '';
  statusTip.value = '正在合成语音…';

  try {
    const { blob, locale } = await synthesize(trimmed, 'mp3');
    if (aborting) return;

    revokeUrl();
    objectUrl = URL.createObjectURL(blob);

    const el = audioEl.value;
    if (!el) throw new Error('音频播放器未就绪');

    el.src = objectUrl;
    await resumeAudioCtx();
    applyVolume();
    await el.play();
    statusTip.value = `正在播放 · ${friendlyVoiceLabel(
      selectedMeta.value || {
        ShortName: selectedVoice.value,
        FriendlyName: selectedVoice.value,
        Gender: '',
        Locale: locale,
      },
    )}`;
  } catch (e: any) {
    if (!aborting) {
      errorMessage.value = e?.message || '合成失败，请检查网络后重试';
      statusTip.value = '';
    }
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

const download = async () => {
  const trimmed = text.value.trim();
  if (!trimmed || !selectedVoice.value || busy.value) return;

  errorMessage.value = '';
  const fmt = getEdgeExportFormat(exportFormat.value).value;

  const cached =
    lastAudioBlob.value &&
    lastAudioMeta.value?.text === trimmed &&
    lastAudioMeta.value?.voice === selectedVoice.value &&
    lastAudioMeta.value?.rate === rate.value &&
    lastAudioMeta.value?.format === fmt;

  if (cached && lastAudioBlob.value) {
    triggerDownload(lastAudioBlob.value, buildFileName());
    statusTip.value = `已开始下载 ${fmt.toUpperCase()}`;
    return;
  }

  aborting = false;
  busy.value = true;
  busyMode.value = 'download';
  statusTip.value = `正在合成 ${fmt.toUpperCase()} 并准备下载…`;

  try {
    const { blob } = await synthesize(trimmed, fmt);
    if (aborting) return;
    triggerDownload(blob, buildFileName());
    statusTip.value = `已开始下载 ${fmt.toUpperCase()}`;
  } catch (e: any) {
    if (!aborting) {
      errorMessage.value = e?.message || '下载失败，请重试';
      statusTip.value = '';
    }
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

const loadVoices = async () => {
  statusTip.value = '正在加载 Edge 音色列表…';
  try {
    const data = await $fetch<{ voices: EdgeVoice[] }>('/api/edge-tts/voices');
    if (data?.voices?.length) {
      voices.value = sortEdgeVoices(data.voices);
      ensureVoiceSelection(voices.value);
      // 全库 300+，界面按语言筛选展示；加载完成后不再常驻提示，避免与「14 个」混淆
      statusTip.value = '';
      return;
    }
  } catch (e: any) {
    console.warn('Edge voices API failed, using fallback', e);
  }

  voices.value = getFallbackZhVoices();
  ensureVoiceSelection(voices.value);
  statusTip.value = `音色列表拉取失败，已使用内置中文音色（含晓晓）`;
};

const onWaveResize = () => {
  resizeWaveCanvas();
  drawWaveFrame(playing.value && !paused.value);
};

onMounted(() => {
  loadPrefs();
  prefsReady = true;
  persistPrefs();
  loadVoices();
  requestAnimationFrame(() => drawWaveFrame(false));
  window.addEventListener('resize', onWaveResize);
});

onUnmounted(() => {
  stopWaveLoop();
  window.removeEventListener('resize', onWaveResize);
  stop();
  lastAudioBlob.value = null;
  lastAudioMeta.value = null;
  try {
    mediaSource?.disconnect();
    analyserNode?.disconnect();
    gainNode?.disconnect();
    audioCtx?.close();
  } catch {
    /* ignore */
  }
  mediaSource = null;
  analyserNode = null;
  gainNode = null;
  audioCtx = null;
  freqData = null;
});
</script>

<style scoped>
.wave-panel {
  min-height: 3.25rem;
  cursor: pointer;
}

.wave-panel--busy {
  pointer-events: none;
}

.wave-canvas {
  width: 100%;
  height: 3rem;
}

.tts-textarea {
  border-radius: 0.75rem;
  border: 1px solid var(--app-border-strong);
  background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
  color: var(--color-base-content);
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.tts-textarea:focus {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  box-shadow: 0 0 0 3px
    color-mix(in oklab, var(--color-primary) 22%, transparent);
}

.tts-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tts-badge {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  border-radius: 9999px;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  font-weight: 400;
}

.tts-badge--primary {
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.tts-badge--muted {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.tts-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 400;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.tts-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tts-chip--active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.tts-chip--ghost {
  border-color: var(--app-border-strong);
  background: transparent;
  color: var(--color-base-content);
}

.tts-chip--ghost:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.tts-range {
  -webkit-appearance: none;
  appearance: none;
  width: auto;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-content) 14%, transparent);
  outline: none;
  cursor: pointer;
}

.tts-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tts-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: var(--color-primary);
  border: 2px solid
    color-mix(in oklab, var(--color-primary) 35%, white);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
}

.tts-range::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: var(--color-primary);
  border: 2px solid
    color-mix(in oklab, var(--color-primary) 35%, white);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
}

.tts-range::-moz-range-track {
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-content) 14%, transparent);
}

.tts-btn-success {
  border-radius: 0.75rem;
  border: 0;
  background: var(--color-success);
  color: var(--color-success-content, #fff);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  transition: filter 0.15s ease, opacity 0.15s ease;
}

.tts-btn-success:hover:not(:disabled) {
  filter: brightness(1.06);
}

.tts-btn-success:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tts-spinner {
  display: inline-block;
  border-style: solid;
  border-color: currentColor;
  border-right-color: transparent;
  border-radius: 9999px;
  animation: tts-spin 0.65s linear infinite;
}

.tts-spinner--xs {
  width: 0.75rem;
  height: 0.75rem;
  border-width: 2px;
}

.tts-spinner--sm {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

@keyframes tts-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
