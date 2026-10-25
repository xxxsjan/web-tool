<template>
  <div class="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        文本转语音
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        Edge 神经音色 · 阿里云百炼 Sambert
      </p>
    </header>

    <section class="overflow-hidden rounded-2xl tool-panel">
      <div class="space-y-4 p-4 sm:p-5">
        <!-- 全局提示 -->
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

        <!-- 左：合成内容 / 右：参数与导出 -->
        <div
          class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-6"
        >
          <div class="space-y-5">
            <!-- 引擎 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5">
              <div class="mb-2.5 flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-base-content/70">合成引擎</p>
                <span class="text-[11px] text-base-content/40">
                  {{ provider === 'sambert' ? '需 API Key' : '在线合成' }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in providerOptions"
                  :key="item.value"
                  type="button"
                  class="tts-chip h-8 px-4"
                  :class="
                    provider === item.value
                      ? 'tts-chip--active'
                      : 'tts-chip--ghost'
                  "
                  :disabled="busy"
                  @click="switchProvider(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
              <div v-if="provider === 'sambert'" class="mt-3 space-y-1.5">
                <label
                  for="tts-dashscope-key"
                  class="text-xs font-medium text-base-content/60"
                >
                  百炼 API Key
                </label>
                <input
                  id="tts-dashscope-key"
                  v-model="dashscopeApiKey"
                  type="password"
                  class="tts-input w-full text-sm"
                  placeholder="sk-…"
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="busy"
                />
                <p class="text-[11px] text-base-content/40">
                  仅保存在本机浏览器，合成时经服务端转发
                </p>
              </div>
            </div>

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
                rows="9"
                class="tts-textarea w-full resize-y text-sm leading-relaxed"
                placeholder="在此输入要朗读的文本…"
                :disabled="busy"
              ></textarea>
            </div>

            <!-- 音色入口 -->
            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="text-sm font-medium text-base-content/70">音色</span>
                <span class="text-[11px] text-base-content/40">
                  共 {{ voices.length }} 个
                </span>
              </div>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl border border-app-strong bg-base-200/30 px-3.5 py-3 text-left transition hover:border-primary/45 hover:bg-base-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="busy"
                @click="openVoiceDialog"
              >
                <span class="tts-voice-avatar">
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 9a3 3 0 116 0 3 3 0 01-6 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 20a7 7 0 0114 0"
                    />
                  </svg>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-base-content">
                    {{ selectedVoiceLabel }}
                  </span>
                  <span class="block text-[11px] text-base-content/45">
                    {{
                      provider === 'sambert'
                        ? '阿里云百炼 Sambert'
                        : 'Microsoft Edge 神经音色'
                    }}
                  </span>
                </span>
                <span class="shrink-0 text-xs font-medium text-primary">更换</span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <!-- 播放参数 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5">
              <p class="mb-3 text-sm font-medium text-base-content/70">播放参数</p>
              <div class="space-y-4">
                <div class="min-w-0">
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <label for="tts-rate" class="text-xs text-base-content/60">
                      语速
                    </label>
                    <span class="font-mono text-xs text-base-content">
                      {{ rate.toFixed(1) }}x
                    </span>
                  </div>
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="w-8 shrink-0 text-right font-mono text-[11px] text-base-content/45">
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
                      :style="{
                        background: `linear-gradient(to right, var(--color-primary) ${((rate - 0.5) / 1.5) * 100}%, color-mix(in oklab, var(--color-base-content) 14%, transparent) ${((rate - 0.5) / 1.5) * 100}%)`,
                      }"
                    />
                    <span class="w-8 shrink-0 font-mono text-[11px] text-base-content/45">
                      2.0x
                    </span>
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <label for="tts-volume" class="text-xs text-base-content/60">
                      音量
                    </label>
                    <span class="font-mono text-xs text-base-content">
                      {{ volume }}%
                      <span v-if="volume > 100" class="ml-1 text-[11px] text-warning">
                        增强
                      </span>
                    </span>
                  </div>
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="w-8 shrink-0 text-right font-mono text-[11px] text-base-content/45">
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
                      :style="{
                        background: `linear-gradient(to right, var(--color-primary) ${(volume / 200) * 100}%, color-mix(in oklab, var(--color-base-content) 14%, transparent) ${(volume / 200) * 100}%)`,
                      }"
                    />
                    <span class="w-9 shrink-0 font-mono text-[11px] text-base-content/45">
                      200%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 朗读按钮 + 波形 -->
            <button
              type="button"
              class="wave-panel relative w-full overflow-hidden rounded-xl border border-app bg-base-200/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-base-200/70 disabled:cursor-not-allowed disabled:opacity-60"
              :class="{
                'wave-panel--active': playing && !paused,
                'wave-panel--paused': paused,
                'wave-panel--busy': busy && busyMode === 'speak',
              }"
              :disabled="
                (!canSpeak && !playing && !paused) ||
                (busy && busyMode !== 'speak')
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

            <button
              v-if="paused"
              type="button"
              class="w-full rounded-lg border border-app-strong px-3 py-2 text-sm text-base-content/70 transition hover:bg-base-200/60 disabled:cursor-not-allowed disabled:opacity-55"
              :disabled="!canSpeak"
              @click="speakText(text)"
            >
              用当前文本重新合成
            </button>

            <audio
              ref="audioEl"
              class="hidden"
              @play="onAudioPlay"
              @pause="onAudioPause"
              @ended="onAudioEnded"
            ></audio>

            <!-- 导出 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5">
              <div class="mb-2 flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-base-content/70">导出</p>
                <span class="text-[11px] text-base-content/40">
                  {{ exportFormatLabel }}
                </span>
              </div>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div
                  class="inline-flex min-w-0 rounded-full border border-app-strong bg-base-100 p-1"
                  role="group"
                  aria-label="导出格式"
                >
                  <button
                    v-for="item in exportFormatOptions"
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

                <button
                  type="button"
                  class="tts-btn-success inline-flex items-center justify-center gap-2 sm:ml-auto sm:min-w-[8.5rem]"
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
        </div>
      </div>
    </section>

    <p class="mt-5 text-center text-[11px] text-base-content/40 sm:text-xs">
      {{ footerTip }}
    </p>

    <!-- 音色选择弹窗 -->
    <dialog
      ref="voiceDialogRef"
      class="modal"
      aria-labelledby="tts-voice-dialog-title"
      @click.self="closeVoiceDialog"
    >
      <div class="modal-box tts-voice-modal">
        <div class="tts-dialog-head">
          <div class="min-w-0">
            <h3 id="tts-voice-dialog-title" class="text-lg font-bold text-base-content">
              选择音色
            </h3>
            <p class="mt-0.5 text-xs text-base-content/50">
              {{ filteredVoices.length }} / {{ voices.length }} 个音色 · 点击卡片选中，点 ▶ 试听
            </p>
          </div>
          <button
            type="button"
            class="tts-icon-btn"
            aria-label="关闭音色选择"
            @click="closeVoiceDialog"
          >
            ✕
          </button>
        </div>

        <div class="tts-dialog-filters">
          <div class="tts-dialog-search">
            <svg
              class="tts-dialog-search__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <input
              v-model.trim="voiceQuery"
              type="search"
              class="tts-input tts-dialog-search__input"
              placeholder="搜索音色…"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="tts-dialog-langs">
            <button
              v-for="opt in localeOptions"
              :key="opt.value"
              type="button"
              class="tts-lang-tab"
              :class="{ 'tts-lang-tab--on': localeFilter === opt.value }"
              @click="localeFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="tts-dialog-body">
          <template v-if="filteredVoices.length">
            <section
              v-for="group in voiceGroups"
              :key="group.locale"
              class="tts-voice-group"
            >
              <h4 class="tts-voice-group__title">
                <span class="tts-voice-group__name">{{ group.label }}</span>
                <span class="tts-voice-group__count">{{ group.total }}</span>
              </h4>

              <ul class="tts-voice-list">
                <li
                  v-for="genderGroup in group.genders"
                  :key="genderGroup.gender"
                  class="tts-voice-row"
                  :class="{
                    'tts-voice-row--on': selectedVoice === genderGroup.voices[0]?.ShortName,
                  }"
                >
                  <span class="tts-voice-row__gender">{{ genderGroup.label }}</span>

                  <div class="tts-voice-row__items">
                    <div
                      v-for="v in genderGroup.voices"
                      :key="v.ShortName"
                      class="tts-voice-item"
                      :class="{
                        'tts-voice-item--on': selectedVoice === v.ShortName,
                      }"
                    >
                      <button
                        type="button"
                        class="tts-voice-item__name"
                        :title="voiceTitle(v)"
                        :disabled="busy"
                        @click="pickVoice(v)"
                      >
                        {{ voiceShortName(v) }}
                      </button>
                      <span class="tts-voice-item__meta">{{ voiceMeta(v) }}</span>
                      <button
                        type="button"
                        class="tts-voice-item__play"
                        :class="{
                          'tts-voice-item__play--on': previewingVoice === v.ShortName,
                        }"
                        :disabled="busy || previewBusy"
                        :title="
                          previewingVoice === v.ShortName
                            ? '停止试听'
                            : '试听 ' + voiceTitle(v)
                        "
                        :aria-label="
                          previewingVoice === v.ShortName
                            ? '停止试听'
                            : '试听 ' + voiceTitle(v)
                        "
                        @click.stop="previewVoice(v)"
                      >
                        <svg
                          v-if="previewingVoice !== v.ShortName"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M8 5.14v13.72a1 1 0 001.54.84l10.1-6.86a1 1 0 000-1.68L9.54 4.3A1 1 0 008 5.14z" />
                        </svg>
                        <span
                          v-else
                          class="tts-spinner tts-spinner--xs"
                          aria-hidden="true"
                        ></span>
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </section>
          </template>
          <p
            v-else
            class="py-12 text-center text-sm text-base-content/50"
          >
            没有匹配的音色，试试更换筛选条件
          </p>
        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="submit">关闭</button>
      </form>
    </dialog>
    <!-- 错误气泡提示 -->
    <transition name="tts-toast">
      <div
        v-if="errorMessage"
        class="tts-toast"
        role="alert"
        aria-live="assertive"
      >
        <svg
          class="tts-toast__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span class="tts-toast__text">{{ errorMessage }}</span>
        <button
          type="button"
          class="tts-toast__close"
          aria-label="关闭提示"
          @click="errorMessage = ''"
        >
          ✕
        </button>
      </div>
    </transition>
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
import {
  SAMBERT_DEFAULT_VOICE,
  SAMBERT_EXPORT_FORMATS,
  SAMBERT_VOICES,
  friendlySambertVoiceLabel,
  getSambertExportFormat,
  shortSambertVoiceName,
  sortSambertVoices,
  type SambertExportFormat,
  type SambertVoice,
} from '~/utils/sambert-tts';

type TtsProvider = 'edge' | 'sambert';
type TtsVoice = EdgeVoice | SambertVoice;
type TtsExportFormat = EdgeExportFormat | SambertExportFormat;

const STORAGE_KEY = 'web-tool-text-to-speech';
const PROVIDER_VALUES = ['edge', 'sambert'] as const;
const LOCALE_VALUES = ['zh', 'en', 'ja', 'ko', 'all'] as const;

const providerOptions: { value: TtsProvider; label: string }[] = [
  { value: 'edge', label: 'Edge' },
  { value: 'sambert', label: '百炼 Sambert' },
];

const localeOptions: { value: (typeof LOCALE_VALUES)[number]; label: string }[] =
  [
    { value: 'zh', label: '中文' },
    { value: 'en', label: '英语' },
    { value: 'ja', label: '日语' },
    { value: 'ko', label: '韩语' },
    { value: 'all', label: '全部' },
  ];

const EDGE_DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';
const EDGE_DEFAULT_TEXT =
  '本网页直接调用 Microsoft Edge 在线神经语音合成，默认音色为晓晓，支持调节语速并下载音频。';
const SAMBERT_DEFAULT_TEXT =
  '本网页调用阿里云百炼 Sambert 语音合成，默认音色为知佳，支持调节语速并下载音频。';

const provider = ref<TtsProvider>('edge');
const text = ref(EDGE_DEFAULT_TEXT);
const rate = ref(1.5);
const volume = ref(100);
const exportFormat = ref<TtsExportFormat>('wav');
const voices = ref<TtsVoice[]>(getFallbackZhVoices());
const selectedVoice = ref(EDGE_DEFAULT_VOICE);
const voiceDialogRef = ref<HTMLDialogElement | null>(null);
const busy = ref(false);
const previewingVoice = ref<string | null>(null);
const previewBusy = ref(false);
/** 当前试听播放的 Audio 元素，用于切换时打断上一段 */
const previewAudioEl = ref<HTMLAudioElement | null>(null);
/** 弹窗内的语言筛选与关键词搜索 */
const localeFilter = ref<(typeof LOCALE_VALUES)[number]>('all');
const voiceQuery = ref('');

const PREVIEW_TEXT =
  '你好，这是音色试听。听听这个声音是否清晰自然，是否符合你的预期。';
const busyMode = ref<'speak' | 'download' | ''>('');
const playing = ref(false);
const paused = ref(false);
const statusTip = ref('');
const errorMessage = ref('');
const dashscopeApiKey = ref('');
const audioEl = ref<HTMLAudioElement | null>(null);
const waveCanvas = ref<HTMLCanvasElement | null>(null);
const lastAudioBlob = ref<Blob | null>(null);
const lastAudioMeta = ref<{
  provider: TtsProvider;
  text: string;
  voice: string;
  rate: number;
  format: TtsExportFormat;
} | null>(null);

let prefsReady = false;

const clampRate = (val: number) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return 1.5;
  return Math.min(2, Math.max(0.5, Math.round(n * 10) / 10));
};

const clampVolumePct = (val: number) =>
  Math.min(200, Math.max(0, Number(val) || 0));

const resolveExportFormat = (value?: string | null): TtsExportFormat => {
  if (provider.value === 'sambert') {
    return getSambertExportFormat(value).value;
  }
  return getEdgeExportFormat(value).value;
};

const loadPrefs = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      provider?: string;
      text?: string;
      rate?: number;
      volume?: number;
      selectedVoice?: string;
      exportFormat?: string;
      dashscopeApiKey?: string;
    };

    if (
      typeof parsed.provider === 'string' &&
      (PROVIDER_VALUES as readonly string[]).includes(parsed.provider)
    ) {
      provider.value = parsed.provider as TtsProvider;
    }
    if (typeof parsed.text === 'string') text.value = parsed.text;
    if (parsed.rate != null) rate.value = clampRate(parsed.rate);
    if (parsed.volume != null) volume.value = clampVolumePct(parsed.volume);
    if (
      typeof parsed.selectedVoice === 'string' &&
      parsed.selectedVoice.trim()
    ) {
      selectedVoice.value = parsed.selectedVoice.trim();
    }
    if (typeof parsed.exportFormat === 'string') {
      exportFormat.value = resolveExportFormat(parsed.exportFormat);
    }
    if (typeof parsed.dashscopeApiKey === 'string') {
      dashscopeApiKey.value = parsed.dashscopeApiKey.trim();
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
        provider: provider.value,
        text: text.value,
        rate: rate.value,
        volume: volume.value,
        selectedVoice: selectedVoice.value,
        exportFormat: exportFormat.value,
        dashscopeApiKey: dashscopeApiKey.value.trim(),
      }),
    );
  } catch {
    /* ignore */
  }
};

const ensureVoiceSelection = (list: TtsVoice[]) => {
  const valid = list.filter((v): v is TtsVoice => !!v && !!v.ShortName);
  if (!valid.length) return;
  if (valid.some(v => v.ShortName === selectedVoice.value)) return;
  if (provider.value === 'sambert') {
    const preferred =
      valid.find(v => v.ShortName === SAMBERT_DEFAULT_VOICE) || valid[0];
    selectedVoice.value = preferred.ShortName;
    return;
  }
  const xiaoxiao = valid.find(v => v.ShortName.includes('XiaoxiaoNeural'));
  selectedVoice.value = xiaoxiao?.ShortName || valid[0].ShortName;
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

const exportFormatOptions = computed(() =>
  provider.value === 'sambert' ? SAMBERT_EXPORT_FORMATS : EDGE_EXPORT_FORMATS,
);

const footerTip = computed(() =>
  provider.value === 'sambert'
    ? '使用阿里云百炼 Sambert，请填写 API Key · 导出支持 MP3 / WAV / OGG'
    : '使用 Edge 在线 TTS，需联网 · 导出支持 MP3 / WAV / OGG',
);

const hasSambertKey = computed(() => !!dashscopeApiKey.value.trim());

const filteredVoices = computed(() => {
  const list = voices.value.filter(
    (v): v is TtsVoice => !!v && !!v.ShortName && !!v.Locale,
  );

  const lang = localeFilter.value;
  const keyword = voiceQuery.value.trim().toLowerCase();

  const matched = list.filter(v => {
    if (lang !== 'all' && !v.Locale.toLowerCase().startsWith(lang)) return false;
    if (!keyword) return true;

    const haystack = [
      v.ShortName,
      v.FriendlyName,
      v.Locale,
      'Style' in v ? (v as SambertVoice).Style : '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });

  if (provider.value === 'sambert') {
    return sortSambertVoices(matched as SambertVoice[]);
  }
  return sortEdgeVoices(matched as EdgeVoice[]);
});

type VoiceGenderGroup = {
  gender: string;
  label: string;
  voices: TtsVoice[];
};

type VoiceLangGroup = {
  locale: string;
  label: string;
  total: number;
  genders: VoiceGenderGroup[];
};

const GENDER_ORDER: string[] = ['Male', 'Female'];

const LANG_ORDER: string[] = [
  'zh-CN',
  'zh',
  'en-US',
  'en',
  'ja',
  'ko',
  'es-ES',
  'es',
  'it-IT',
  'it',
  'id-ID',
  'id',
  'fr-FR',
  'fr',
  'de-DE',
  'de',
  'th-TH',
  'th',
];

const genderLabel = (gender: string) => {
  if (gender === 'Male') return '男声';
  if (gender === 'Female') return '女声';
  return gender;
};

const localeLabel = (locale: string) => {
  if (locale.startsWith('zh')) return '中文';
  if (locale.startsWith('en')) return '英语';
  if (locale.startsWith('ja')) return '日语';
  if (locale.startsWith('ko')) return '韩语';
  if (locale.startsWith('es')) return '西班牙语';
  if (locale.startsWith('it')) return '意大利语';
  if (locale.startsWith('id')) return '印尼语';
  if (locale.startsWith('fr')) return '法语';
  if (locale.startsWith('de')) return '德语';
  if (locale.startsWith('th')) return '泰语';
  return locale;
};

const sortVoiceList = (list: TtsVoice[]) =>
  [...list]
    .filter((v): v is TtsVoice => !!v && !!v.ShortName && !!v.FriendlyName)
    .sort((a, b) =>
      a.FriendlyName.localeCompare(b.FriendlyName, 'zh'),
    );

/** 按“语言 → 性别”分组，方便在弹窗中快速定位百炼等大量音色 */
const voiceGroups = computed<VoiceLangGroup[]>(() => {
  const map = new Map<string, Map<string, TtsVoice[]>>();
  for (const v of filteredVoices.value) {
    if (!v || !v.ShortName || !v.Locale) continue;
    const langMap = map.get(v.Locale);
    const gender = v.Gender;
    if (langMap) {
      const bucket = langMap.get(gender) || [];
      bucket.push(v);
      langMap.set(gender, bucket);
    } else {
      map.set(v.Locale, new Map([[gender, [v]]]));
    }
  }

  const orderedLangs = [...map.keys()].sort((a, b) => {
    const ia = LANG_ORDER.indexOf(a);
    const ib = LANG_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const result: VoiceLangGroup[] = [];
  for (const lang of orderedLangs) {
    const genderMap = map.get(lang);
    if (!genderMap) continue;
    const genders: VoiceGenderGroup[] = [];
    for (const gender of GENDER_ORDER) {
      const voices = genderMap.get(gender);
      if (voices?.length) {
        genders.push({
          gender,
          label: genderLabel(gender),
          voices: sortVoiceList(voices),
        });
      }
    }
    for (const [gender, voices] of genderMap) {
      if (!GENDER_ORDER.includes(gender)) {
        genders.push({
          gender,
          label: genderLabel(gender),
          voices: sortVoiceList(voices),
        });
      }
    }
    result.push({
      locale: lang,
      label: localeLabel(lang),
      total: [...genderMap.values()].reduce((n, v) => n + v.length, 0),
      genders,
    });
  }
  return result;
});

const canSpeak = computed(() => {
  if (!text.value.trim() || !selectedVoice.value || busy.value) return false;
  if (provider.value === 'sambert' && !hasSambertKey.value) return false;
  return true;
});

const canDownload = computed(() => {
  if (!text.value.trim() || !selectedVoice.value || busy.value) return false;
  if (provider.value === 'sambert' && !hasSambertKey.value) return false;
  return true;
});

const speakerAriaLabel = computed(() => {
  if (busy.value && busyMode.value === 'speak') return '合成中';
  if (playing.value && !paused.value) return '暂停朗读';
  if (paused.value) return '继续朗读';
  return '开始朗读';
});

const exportFormatLabel = computed(() => {
  if (provider.value === 'sambert') {
    return getSambertExportFormat(exportFormat.value).label;
  }
  return getEdgeExportFormat(exportFormat.value).label;
});

const selectedMeta = computed(
  () =>
    voices.value.find((v): v is TtsVoice => !!v && v.ShortName === selectedVoice.value) ||
    null,
);

const isSambertVoice = (v: TtsVoice): v is SambertVoice =>
  'Style' in v && typeof (v as SambertVoice).Style === 'string';

const voiceChipLabel = (v: TtsVoice) =>
  isSambertVoice(v) ? shortSambertVoiceName(v) : shortVoiceName(v);

const voiceTitle = (v: TtsVoice) =>
  isSambertVoice(v) ? friendlySambertVoiceLabel(v) : friendlyVoiceLabel(v);

/**
 * 列表主名：只取人名/别名部分，去掉「· 女声 · 标准女声」这类冗余后缀。
 * Edge 别名形如「晓晓（女声，普通话）」→ 提取「晓晓」。
 */
const voiceShortName = (v: TtsVoice) => {
  const raw = isSambertVoice(v)
    ? v.FriendlyName
    : shortVoiceName(v as EdgeVoice);

  const head = raw.split(/[·（(]/)[0]?.trim() ?? raw;
  return head || raw;
};

/** 副信息：风格 / 方言，作为小字标签（性别已单独成列，不重复） */
const voiceMeta = (v: TtsVoice) => {
  if (isSambertVoice(v)) return v.Style;

  const raw = shortVoiceName(v as EdgeVoice);
  const inner = /[（(]([^）)]+)[）)]/.exec(raw)?.[1];
  if (inner) {
    // 别名内形如「女声，普通话」→ 只保留方言 / 特征部分
    const rest = inner
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(s => s && !/^[男女]声$/.test(s));
    if (rest.length) return rest.join(' · ');
  }

  return v.Locale.split('-')[0]?.toUpperCase() ?? '';
};

const selectedVoiceLabel = computed(() => {
  if (selectedMeta.value) {
    // 折叠态也展示完整描述（含男女），避免只剩名字
    return voiceTitle(selectedMeta.value);
  }
  return selectedVoice.value.replace(/^.*-/, '') || selectedVoice.value;
});

const openVoiceDialog = () => {
  voiceDialogRef.value?.showModal();
};

const closeVoiceDialog = () => {
  stopPreview();
  voiceDialogRef.value?.close();
};

const pickVoice = (v: TtsVoice) => {
  selectedVoice.value = v.ShortName;
  closeVoiceDialog();
};

/** 试听指定音色：合成一段固定文本并用独立 Audio 播放，不干扰主界面 */
const previewVoice = async (v: TtsVoice) => {
  if (!v || !v.ShortName) return;
  // 点击新音色：打断上一段试听
  if (previewAudioEl.value) {
    previewAudioEl.value.pause();
    previewAudioEl.value = null;
  }
  if (previewingVoice.value && previewingVoice.value !== v.ShortName) {
    previewingVoice.value = null;
  }
  if (previewingVoice.value === v.ShortName) {
    stopPreview();
    return;
  }

  // 先停止主界面播放，避免两段音频混叠
  stop();

  previewBusy.value = true;
  previewingVoice.value = v.ShortName;

  const originalVoice = selectedVoice.value;
  selectedVoice.value = v.ShortName;

  try {
    const { blob } = await synthesize(PREVIEW_TEXT, 'mp3', false);
    if (previewingVoice.value !== v.ShortName) {
      // 用户已经切换到了另一个音色，丢弃本次结果
      return;
    }

    const audio = new Audio(URL.createObjectURL(blob));
    previewAudioEl.value = audio;
    audio.play().catch(() => {
      /* 用户可能已关闭弹窗或浏览器阻止自动播放 */
    });
    const onEnded = () => {
      if (previewingVoice.value === v.ShortName) {
        previewingVoice.value = null;
        previewAudioEl.value = null;
      }
      URL.revokeObjectURL(audio.src);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
    const onError = () => {
      if (previewingVoice.value === v.ShortName) {
        previewingVoice.value = null;
        previewAudioEl.value = null;
      }
      URL.revokeObjectURL(audio.src);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
  } catch (e: any) {
    if (previewingVoice.value === v.ShortName) {
      previewingVoice.value = null;
      previewAudioEl.value = null;
    }
    errorMessage.value = '试听失败：' + (e?.message || '未知错误');
  } finally {
    previewBusy.value = false;
    selectedVoice.value = originalVoice;
  }
};

const stopPreview = () => {
  previewingVoice.value = null;
  previewBusy.value = false;
};

const clearCachedAudio = () => {
  lastAudioBlob.value = null;
  lastAudioMeta.value = null;
};

const switchProvider = async (next: TtsProvider) => {
  if (provider.value === next || busy.value) return;
  stop();
  stopPreview();
  clearCachedAudio();
  provider.value = next;
  exportFormat.value = resolveExportFormat(exportFormat.value);
  errorMessage.value = '';
  closeVoiceDialog();

  const isDefaultEdgeText = text.value.trim() === EDGE_DEFAULT_TEXT;
  const isDefaultSambertText = text.value.trim() === SAMBERT_DEFAULT_TEXT;
  if (next === 'sambert' && (isDefaultEdgeText || !text.value.trim())) {
    text.value = SAMBERT_DEFAULT_TEXT;
  } else if (next === 'edge' && (isDefaultSambertText || !text.value.trim())) {
    text.value = EDGE_DEFAULT_TEXT;
  }

  await loadVoices();
};

watch(filteredVoices, list => {
  const valid = list.filter((v): v is TtsVoice => !!v && !!v.ShortName);
  if (!valid.length) return;
  // 当前筛选下没有已选音色时，才回退；优先保留本地缓存的选择
  if (!valid.some(v => v.ShortName === selectedVoice.value)) {
    ensureVoiceSelection(valid);
  }
});

watch(volume, val => {
  applyVolume(val);
});

watch(
  [
    provider,
    text,
    rate,
    volume,
    selectedVoice,
    exportFormat,
    dashscopeApiKey,
  ],
  () => {
    persistPrefs();
  },
);

watch(hasSambertKey, hasKey => {
  if (
    provider.value === 'sambert' &&
    hasKey &&
    /请填写百炼 API Key/.test(statusTip.value)
  ) {
    statusTip.value = '';
  }
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
  const ext =
    provider.value === 'sambert'
      ? getSambertExportFormat(exportFormat.value).ext
      : getEdgeExportFormat(exportFormat.value).ext;
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
  format: TtsExportFormat = 'mp3',
  saveCache = true,
) => {
  const locale = selectedMeta.value?.Locale || 'zh-CN';
  try {
    let blob: Blob;
    let resolvedFormat: TtsExportFormat;

    if (provider.value === 'sambert') {
      const apiKey = dashscopeApiKey.value.trim();
      if (!apiKey) {
        throw new Error('请填写阿里云百炼 API Key');
      }
      const formatConfig = getSambertExportFormat(format);
      resolvedFormat = formatConfig.value;
      // 音量与 Edge 一致，由页面 GainNode 控制；接口固定默认音量
      blob = await $fetch<Blob>('/api/sambert-tts/speak', {
        method: 'POST',
        body: {
          text: content,
          voice: selectedVoice.value,
          rate: rate.value,
          volume: 50,
          format: formatConfig.value,
          apiKey,
        },
        responseType: 'blob',
      });
    } else {
      const formatConfig = getEdgeExportFormat(format);
      resolvedFormat = formatConfig.value;
      blob = await $fetch<Blob>('/api/edge-tts/speak', {
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
    }

    if (saveCache) {
      lastAudioBlob.value = blob;
      lastAudioMeta.value = {
        provider: provider.value,
        text: content,
        voice: selectedVoice.value,
        rate: rate.value,
        format: resolvedFormat,
      };
    }
    return { blob, locale, format: resolvedFormat };
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
    const { blob } = await synthesize(trimmed, 'mp3');
    if (aborting) return;

    revokeUrl();
    objectUrl = URL.createObjectURL(blob);

    const el = audioEl.value;
    if (!el) throw new Error('音频播放器未就绪');

    el.src = objectUrl;
    await resumeAudioCtx();
    applyVolume();
    await el.play();
    const meta = selectedMeta.value;
    statusTip.value = `正在播放 · ${meta ? voiceTitle(meta) : selectedVoice.value}`;
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
  const fmt = resolveExportFormat(exportFormat.value);

  const cached =
    lastAudioBlob.value &&
    lastAudioMeta.value?.provider === provider.value &&
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

const loadSambertVoices = async () => {
  statusTip.value = '正在加载 Sambert 音色…';
  try {
    const data = await $fetch<{ voices: SambertVoice[] }>(
      '/api/sambert-tts/voices',
    );
    if (data?.voices?.length) {
      voices.value = sortSambertVoices(data.voices);
      ensureVoiceSelection(voices.value);
      statusTip.value = hasSambertKey.value ? '' : '请填写百炼 API Key 后开始合成';
      return;
    }
  } catch (e: any) {
    console.warn('Sambert voices API failed, using fallback', e);
  }

  voices.value = sortSambertVoices(SAMBERT_VOICES);
  ensureVoiceSelection(voices.value);
  statusTip.value = hasSambertKey.value
    ? '已使用内置 Sambert 音色列表'
    : '已加载音色；请填写百炼 API Key 后开始合成';
};

const loadEdgeVoices = async () => {
  statusTip.value = '正在加载 Edge 音色列表…';
  try {
    const data = await $fetch<{ voices: EdgeVoice[] }>('/api/edge-tts/voices');
    if (data?.voices?.length) {
      voices.value = sortEdgeVoices(data.voices);
      ensureVoiceSelection(voices.value);
      statusTip.value = '';
      return;
    }
  } catch (e: any) {
    console.warn('Edge voices API failed, using fallback', e);
  }

  voices.value = getFallbackZhVoices();
  ensureVoiceSelection(voices.value);
  statusTip.value = '音色列表拉取失败，已使用内置中文音色（含晓晓）';
};

const loadVoices = async () => {
  if (provider.value === 'sambert') {
    await loadSambertVoices();
    return;
  }
  await loadEdgeVoices();
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
/* ---------- 音色选择弹窗 ---------- */

.tts-voice-modal {
  display: flex;
  max-width: 46rem;
  max-height: 84vh;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--app-border-strong);
  border-radius: 1rem;
}

.tts-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  padding: 1rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--app-border);
}

.tts-dialog-filters {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.8rem 1.15rem;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in oklab, var(--color-base-200) 45%, transparent);
}

.tts-dialog-search {
  position: relative;
  display: flex;
  align-items: center;
}

.tts-dialog-search__icon {
  position: absolute;
  left: 0.75rem;
  width: 0.9rem;
  height: 0.9rem;
  pointer-events: none;
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.tts-dialog-search__input {
  width: 100%;
  padding-left: 2.1rem;
  font-size: 0.85rem;
}

.tts-dialog-langs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tts-lang-tab {
  border-radius: 0.5rem;
  border: 1px solid transparent;
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
  color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.tts-lang-tab:hover {
  background: color-mix(in oklab, var(--color-base-content) 7%, transparent);
  color: var(--color-base-content);
}

.tts-lang-tab--on {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  background: color-mix(in oklab, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
  font-weight: 500;
}

.tts-dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.9rem 1.15rem 1.25rem;
}

.tts-voice-group + .tts-voice-group {
  margin-top: 1.15rem;
}

.tts-voice-group__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  padding: 0 0.15rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
}

.tts-voice-group__name {
  letter-spacing: 0.02em;
}

.tts-voice-group__count {
  display: inline-flex;
  min-width: 1.2rem;
  justify-content: center;
  border-radius: 9999px;
  padding: 0 0.35rem;
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  font-size: 0.66rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
}

.tts-voice-list {
  border-radius: 0.7rem;
  border: 1px solid var(--app-border);
  overflow: hidden;
}

.tts-voice-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem;
  background: color-mix(in oklab, var(--color-base-100) 55%, transparent);
}

.tts-voice-row + .tts-voice-row {
  border-top: 1px solid var(--app-border-muted);
}

.tts-voice-row__gender {
  flex-shrink: 0;
  width: 2.4rem;
  padding-top: 0.3rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 42%, transparent);
}

.tts-voice-row__items {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tts-voice-item {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 0.4rem;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border-strong);
  background: color-mix(in oklab, var(--color-base-100) 85%, transparent);
  padding-right: 0.15rem;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.tts-voice-item:hover {
  border-color: color-mix(in oklab, var(--color-primary) 45%, transparent);
}

.tts-voice-item--on {
  border-color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 15%, transparent);
}

.tts-voice-item__name {
  min-width: 0;
  padding: 0.3rem 0.15rem 0.3rem 0.55rem;
  font-size: 0.8rem;
  color: var(--color-base-content);
  white-space: nowrap;
}

.tts-voice-item--on .tts-voice-item__name {
  font-weight: 600;
  color: var(--color-primary);
}

.tts-voice-item__name:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.tts-voice-item__meta {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.68rem;
  color: color-mix(in oklab, var(--color-base-content) 42%, transparent);
}

.tts-voice-item__play {
  display: inline-flex;
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tts-voice-item__play svg {
  width: 0.7rem;
  height: 0.7rem;
}

.tts-voice-item__play:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}

.tts-voice-item__play--on {
  background: color-mix(in oklab, var(--color-primary) 20%, transparent);
  color: var(--color-primary);
}

.tts-voice-item__play:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tts-icon-btn {
  display: inline-flex;
  width: 1.85rem;
  height: 1.85rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.85rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tts-icon-btn:hover {
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  color: var(--color-base-content);
}

.tts-voice-avatar {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
}

/* ---------- 播放控件 ---------- */

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

.tts-textarea,
.tts-input {
  border-radius: 0.75rem;
  border: 1px solid var(--app-border-strong);
  background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
  color: var(--color-base-content);
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.tts-input {
  padding: 0.55rem 0.85rem;
}

.tts-textarea:focus,
.tts-input:focus {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  box-shadow: 0 0 0 3px
    color-mix(in oklab, var(--color-primary) 22%, transparent);
}

.tts-textarea:disabled,
.tts-input:disabled {
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
  accent-color: var(--color-primary);
  outline: none;
  cursor: pointer;
}

.tts-range::-webkit-slider-runnable-track {
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-content) 14%, transparent);
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
  margin-top: -0.3125rem;
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
  margin-top: 0;
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
