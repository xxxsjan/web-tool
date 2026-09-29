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
            class="textarea textarea-bordered w-full resize-y text-sm leading-relaxed"
            placeholder="在此输入要朗读的文本…"
            :disabled="busy"
          ></textarea>
        </div>

        <!-- 语言筛选 -->
        <div>
          <p class="mb-2 text-sm font-medium text-base-content/70">语言</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in localeOptions"
              :key="item.value"
              type="button"
              class="btn btn-sm rounded-full border"
              :class="
                localeFilter === item.value
                  ? 'btn-primary border-primary'
                  : 'btn-ghost border-app-strong'
              "
              @click="localeFilter = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 音色 tag 平铺 -->
        <div>
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-base-content/70">音色</p>
            <span class="badge badge-primary badge-outline badge-sm">
              {{ filteredVoices.length }} 个
            </span>
          </div>
          <div
            class="voice-tags flex max-h-52 flex-wrap content-start gap-2 overflow-y-auto pr-1 sm:max-h-64"
          >
            <button
              v-for="v in filteredVoices"
              :key="v.ShortName"
              type="button"
              class="btn btn-sm h-auto min-h-0 rounded-full border px-3 py-1.5 font-normal"
              :class="
                selectedVoice === v.ShortName
                  ? 'btn-primary border-primary'
                  : 'btn-ghost border-app-strong'
              "
              :title="friendlyVoiceLabel(v)"
              :disabled="busy"
              @click="selectedVoice = v.ShortName"
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

        <!-- 语速 / 音量 -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
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
            <input
              id="tts-rate"
              v-model.number="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              class="range range-primary range-sm w-full"
              :disabled="busy"
            />
            <div
              class="mt-1 flex justify-between px-0.5 text-[11px] text-base-content/40"
            >
              <span>慢</span>
              <span>快</span>
            </div>
          </div>
          <div>
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
            <input
              id="tts-volume"
              v-model.number="volume"
              type="range"
              min="0"
              max="200"
              step="1"
              class="range range-primary range-sm w-full"
            />
            <div
              class="mt-1 flex justify-between px-0.5 text-[11px] text-base-content/40"
            >
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>
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
                class="export-formats inline-flex rounded-full border border-app-strong bg-base-100 p-1"
                role="group"
                aria-label="导出格式"
              >
                <button
                  v-for="item in EDGE_EXPORT_FORMATS"
                  :key="item.value"
                  type="button"
                  class="export-format-btn btn btn-sm h-8 min-h-8 rounded-full border-0 px-4 font-medium"
                  :class="
                    exportFormat === item.value
                      ? 'btn-primary'
                      : 'btn-ghost text-base-content/70 hover:bg-base-200'
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
              class="btn btn-success gap-2 border-0 shadow-sm sm:min-w-[8.5rem]"
              :disabled="!canDownload"
              @click="download"
            >
              <span
                v-if="busy && busyMode === 'download'"
                class="loading loading-spinner loading-sm"
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

        <!-- 操作 -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="speaker-btn btn btn-primary btn-circle h-14 w-14 min-h-14 shrink-0 border-0 sm:h-16 sm:w-16 sm:min-h-16"
            :class="{
              'speaker-btn--playing': playing && !paused,
              'speaker-btn--paused': paused,
              'speaker-btn--busy': busy && busyMode === 'speak',
            }"
            :disabled="
              (!canSpeak && !playing && !paused) ||
              (busy && busyMode !== 'speak')
            "
            :aria-label="speakerAriaLabel"
            :title="speakerAriaLabel"
            @click="toggleSpeak"
          >
            <span
              v-if="busy && busyMode === 'speak'"
              class="loading loading-spinner loading-md"
            ></span>
            <span v-else class="speaker-icon" aria-hidden="true">
              <svg class="speaker-body" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
              </svg>
              <span class="speaker-waves">
                <span class="wave wave-1"></span>
                <span class="wave wave-2"></span>
              </span>
            </span>
          </button>

          <div class="flex min-w-0 flex-1 flex-wrap gap-2">
            <button
              v-if="playing || paused || (busy && busyMode === 'speak')"
              type="button"
              class="btn btn-ghost border border-app-strong sm:w-28"
              @click="stop"
            >
              停止
            </button>
          </div>
        </div>

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
const busy = ref(false);
const busyMode = ref<'speak' | 'download' | ''>('');
const playing = ref(false);
const paused = ref(false);
const statusTip = ref('');
const errorMessage = ref('');
const audioEl = ref<HTMLAudioElement | null>(null);
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
let mediaSource: MediaElementAudioSourceNode | null = null;

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
  if (!gainNode) {
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
  // createMediaElementSource 每个 audio 元素只能调用一次
  if (!mediaSource) {
    mediaSource = audioCtx.createMediaElementSource(el);
    mediaSource.connect(gainNode);
    // 音量改由 GainNode 控制，元素本身固定满幅
    el.volume = 1;
  }
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
      : list.filter(v =>
          v.Locale.toLowerCase().startsWith(localeFilter.value),
        );
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

const synthesize = async (
  content: string,
  format: EdgeExportFormat = 'mp3',
) => {
  const locale = selectedMeta.value?.Locale || 'zh-CN';
  const formatConfig = getEdgeExportFormat(format);
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
};

const onAudioPlay = () => {
  playing.value = true;
  paused.value = false;
};
const onAudioPause = () => {
  if (audioEl.value && !audioEl.value.ended) {
    paused.value = true;
  }
};
const onAudioEnded = () => {
  playing.value = false;
  paused.value = false;
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
      const msg =
        e?.data?.statusMessage ||
        e?.statusMessage ||
        e?.message ||
        '合成失败，请检查网络后重试';
      errorMessage.value = msg;
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
      errorMessage.value =
        e?.data?.statusMessage ||
        e?.statusMessage ||
        e?.message ||
        '下载失败，请重试';
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
      statusTip.value = `已加载 ${data.voices.length} 个 Edge 在线音色`;
      return;
    }
  } catch (e: any) {
    console.warn('Edge voices API failed, using fallback', e);
  }

  voices.value = getFallbackZhVoices();
  ensureVoiceSelection(voices.value);
  statusTip.value = `音色列表拉取失败，已使用内置中文音色（含晓晓）`;
};

onMounted(() => {
  loadPrefs();
  prefsReady = true;
  persistPrefs();
  loadVoices();
});

onUnmounted(() => {
  stop();
  lastAudioBlob.value = null;
  lastAudioMeta.value = null;
  try {
    mediaSource?.disconnect();
    gainNode?.disconnect();
    audioCtx?.close();
  } catch {
    /* ignore */
  }
  mediaSource = null;
  gainNode = null;
  audioCtx = null;
});
</script>

<style scoped>
.speaker-btn {
  position: relative;
  box-shadow: 0 8px 24px
    color-mix(in oklab, var(--color-primary) 35%, transparent);
}

.speaker-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
}

.speaker-body {
  width: 1.5rem;
  height: 1.5rem;
  display: block;
}

.speaker-waves {
  position: absolute;
  left: 58%;
  top: 50%;
  width: 0.7rem;
  height: 1rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.wave {
  position: absolute;
  left: 0;
  top: 50%;
  width: 0.45rem;
  height: 0.45rem;
  border: 2px solid currentColor;
  border-left: none;
  border-radius: 0 100% 100% 0 / 0 50% 50% 0;
  opacity: 0.35;
  transform: translateY(-50%) scale(0.85);
  transform-origin: left center;
}

.wave-2 {
  width: 0.7rem;
  height: 0.7rem;
  left: 0.1rem;
  opacity: 0.25;
}

.speaker-btn--playing .wave {
  opacity: 1;
  animation: speaker-wave 1s ease-in-out infinite;
}

.speaker-btn--playing .wave-2 {
  animation-delay: 0.2s;
}

.speaker-btn--playing .speaker-body {
  animation: speaker-bob 1s ease-in-out infinite;
}

.speaker-btn--paused .wave {
  opacity: 0.45;
}

.speaker-btn--busy {
  pointer-events: none;
}

@keyframes speaker-wave {
  0%,
  100% {
    transform: translateY(-50%) scale(0.75);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-50%) scale(1.15);
    opacity: 1;
  }
}

@keyframes speaker-bob {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}
</style>
