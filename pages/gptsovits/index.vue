<template>
  <div class="mx-auto w-full max-w-6xl px-3 pb-44 sm:px-4 sm:pb-48">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        GPT-SoVITS 调试
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        对接本机 api_v2（默认 9880）· 经服务端代理避免 CORS
      </p>
    </header>

    <section class="overflow-hidden rounded-2xl tool-panel">
      <div class="space-y-5 p-4 sm:p-5">
        <!-- 连接 -->
        <div class="rounded-xl border border-app bg-base-200/30 p-3.5">
          <div class="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-medium text-base-content/70">服务地址</p>
            <span
              class="text-[11px]"
              :class="
                pingOk === true
                  ? 'text-success'
                  : pingOk === false
                    ? 'text-error'
                    : 'text-base-content/40'
              "
            >
              {{ pingLabel }}
            </span>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              v-model="baseUrl"
              type="url"
              class="gsv-input min-w-0 flex-1 text-sm"
              placeholder="http://127.0.0.1:9880"
              spellcheck="false"
              :disabled="busy"
            />
            <button
              type="button"
              class="gsv-btn-ghost shrink-0"
              :disabled="busy"
              @click="ping"
            >
              {{ busyMode === 'ping' ? '检测中…' : '检测连通' }}
            </button>
          </div>
        </div>

        <div
          class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6"
        >
          <div class="space-y-4">
            <!-- 文本 -->
            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <label for="gsv-text" class="text-sm font-medium text-base-content/70">
                  合成文本
                </label>
                <span class="font-mono text-[11px] text-base-content/40">
                  {{ text.length }} 字
                </span>
              </div>
              <textarea
                id="gsv-text"
                v-model="text"
                rows="6"
                class="gsv-textarea w-full resize-y text-sm leading-relaxed"
                placeholder="输入要合成的文本…"
                :disabled="busy"
              ></textarea>
            </div>

            <!-- 参考音频 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5 space-y-3">
              <p class="text-sm font-medium text-base-content/70">参考音频（服务端路径）</p>
              <div>
                <label for="gsv-ref" class="mb-1.5 block text-xs text-base-content/60">
                  ref_audio_path
                </label>
                <input
                  id="gsv-ref"
                  v-model="refAudioPath"
                  type="text"
                  class="gsv-input w-full text-sm"
                  placeholder="如 archive_jingyuan_1.wav 或绝对路径"
                  spellcheck="false"
                  :disabled="busy"
                />
              </div>
              <div>
                <label for="gsv-prompt" class="mb-1.5 block text-xs text-base-content/60">
                  prompt_text（参考音频文案，可空）
                </label>
                <textarea
                  id="gsv-prompt"
                  v-model="promptText"
                  rows="2"
                  class="gsv-textarea w-full resize-y text-sm"
                  placeholder="与参考音频内容一致的文本"
                  :disabled="busy"
                ></textarea>
              </div>
              <div>
                <label for="gsv-aux" class="mb-1.5 block text-xs text-base-content/60">
                  aux_ref_audio_paths（辅助参考，每行一个，可空）
                </label>
                <textarea
                  id="gsv-aux"
                  v-model="auxRefAudioPathsText"
                  rows="2"
                  class="gsv-textarea w-full resize-y text-sm"
                  placeholder="多说话人融合时填写服务端路径"
                  spellcheck="false"
                  :disabled="busy"
                ></textarea>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label for="gsv-text-lang" class="mb-1.5 block text-xs text-base-content/60">
                    text_lang
                  </label>
                  <select
                    id="gsv-text-lang"
                    v-model="textLang"
                    class="gsv-select w-full text-sm"
                    :disabled="busy"
                  >
                    <option
                      v-for="item in langOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }} ({{ item.value }})
                    </option>
                  </select>
                </div>
                <div>
                  <label for="gsv-prompt-lang" class="mb-1.5 block text-xs text-base-content/60">
                    prompt_lang
                  </label>
                  <select
                    id="gsv-prompt-lang"
                    v-model="promptLang"
                    class="gsv-select w-full text-sm"
                    :disabled="busy"
                  >
                    <option
                      v-for="item in langOptions"
                      :key="'p-' + item.value"
                      :value="item.value"
                    >
                      {{ item.label }} ({{ item.value }})
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 高级参数 -->
            <details class="rounded-xl border border-app bg-base-200/30 p-3.5" open>
              <summary class="cursor-pointer text-sm font-medium text-base-content/70">
                推理参数
              </summary>
              <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">切分方式</label>
                  <select v-model="textSplitMethod" class="gsv-select w-full text-sm" :disabled="busy">
                    <option
                      v-for="item in splitMethods"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">输出格式</label>
                  <select v-model="mediaType" class="gsv-select w-full text-sm" :disabled="busy">
                    <option
                      v-for="item in mediaTypes"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <div class="mb-1.5 flex justify-between text-xs text-base-content/60">
                    <span>语速 speed_factor</span>
                    <span class="font-mono">{{ speedFactor.toFixed(2) }}</span>
                  </div>
                  <input
                    v-model.number="speedFactor"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    class="gsv-range w-full"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">seed（-1 随机）</label>
                  <input
                    v-model.number="seed"
                    type="number"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">top_k</label>
                  <input
                    v-model.number="topK"
                    type="number"
                    min="1"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">top_p</label>
                  <input
                    v-model.number="topP"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">temperature</label>
                  <input
                    v-model.number="temperature"
                    type="number"
                    min="0"
                    step="0.05"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">repetition_penalty</label>
                  <input
                    v-model.number="repetitionPenalty"
                    type="number"
                    min="0"
                    step="0.05"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">batch_size</label>
                  <input
                    v-model.number="batchSize"
                    type="number"
                    min="1"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">batch_threshold</label>
                  <input
                    v-model.number="batchThreshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">fragment_interval</label>
                  <input
                    v-model.number="fragmentInterval"
                    type="number"
                    min="0"
                    step="0.05"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">
                    sample_steps（V3，默认 32）
                  </label>
                  <input
                    v-model.number="sampleSteps"
                    type="number"
                    min="1"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">
                    streaming_mode（本页合成强制 0）
                  </label>
                  <select
                    v-model.number="streamingMode"
                    class="gsv-select w-full text-sm"
                    :disabled="busy"
                  >
                    <option
                      v-for="item in streamingModes"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                    </option>
                  </select>
                  <p class="mt-1 text-[11px] text-base-content/40">
                    流式 WAV 头 data 长度为 0，浏览器播放会无声；合成请求已固定非流式
                  </p>
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">
                    overlap_length（流式）
                  </label>
                  <input
                    v-model.number="overlapLength"
                    type="number"
                    min="0"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs text-base-content/60">
                    min_chunk_length（流式）
                  </label>
                  <input
                    v-model.number="minChunkLength"
                    type="number"
                    min="1"
                    class="gsv-input w-full text-sm"
                    :disabled="busy"
                  />
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-4 text-xs text-base-content/70">
                <label class="inline-flex items-center gap-1.5">
                  <input v-model="splitBucket" type="checkbox" class="checkbox checkbox-xs" :disabled="busy" />
                  split_bucket
                </label>
                <label class="inline-flex items-center gap-1.5">
                  <input v-model="parallelInfer" type="checkbox" class="checkbox checkbox-xs" :disabled="busy" />
                  parallel_infer
                </label>
                <label class="inline-flex items-center gap-1.5">
                  <input v-model="superSampling" type="checkbox" class="checkbox checkbox-xs" :disabled="busy" />
                  super_sampling
                </label>
              </div>
            </details>
          </div>

          <div class="space-y-4">
            <!-- 操作 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5 space-y-3">
              <p class="text-sm font-medium text-base-content/70">合成</p>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="gsv-btn-primary"
                  :disabled="!canSpeak"
                  @click="synthesize"
                >
                  <span
                    v-if="busyMode === 'tts'"
                    class="gsv-spinner"
                    aria-hidden="true"
                  ></span>
                  {{ busyMode === 'tts' ? '合成中…' : '开始合成' }}
                </button>
                <button
                  type="button"
                  class="gsv-btn-ghost"
                  :disabled="!audioBlob || busy"
                  @click="download"
                >
                  下载音频
                </button>
              </div>
              <audio
                v-show="audioUrl"
                ref="audioEl"
                class="mt-1 w-full"
                controls
                preload="auto"
              ></audio>
              <p v-if="statusTip" class="text-[11px] text-base-content/50">
                {{ statusTip }}
              </p>
              <p v-if="errorMessage" class="text-sm text-error">
                {{ errorMessage }}
              </p>
            </div>

            <!-- 模型 / 控制 -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5 space-y-3">
              <p class="text-sm font-medium text-base-content/70">模型与控制</p>
              <div>
                <label class="mb-1.5 block text-xs text-base-content/60">GPT 权重路径</label>
                <div class="flex gap-2">
                  <input
                    v-model="gptWeightsPath"
                    type="text"
                    class="gsv-input min-w-0 flex-1 text-sm"
                    spellcheck="false"
                    :disabled="busy"
                  />
                  <button
                    type="button"
                    class="gsv-btn-ghost shrink-0"
                    :disabled="busy || !gptWeightsPath.trim()"
                    @click="runAction('set_gpt_weights', gptWeightsPath)"
                  >
                    切换
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-xs text-base-content/60">SoVITS 权重路径</label>
                <div class="flex gap-2">
                  <input
                    v-model="sovitsWeightsPath"
                    type="text"
                    class="gsv-input min-w-0 flex-1 text-sm"
                    spellcheck="false"
                    :disabled="busy"
                  />
                  <button
                    type="button"
                    class="gsv-btn-ghost shrink-0"
                    :disabled="busy || !sovitsWeightsPath.trim()"
                    @click="runAction('set_sovits_weights', sovitsWeightsPath)"
                  >
                    切换
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-xs text-base-content/60">预载参考音频</label>
                <div class="flex gap-2">
                  <input
                    v-model="preloadReferPath"
                    type="text"
                    class="gsv-input min-w-0 flex-1 text-sm"
                    placeholder="默认同上方 ref 路径"
                    spellcheck="false"
                    :disabled="busy"
                  />
                  <button
                    type="button"
                    class="gsv-btn-ghost shrink-0"
                    :disabled="busy || !(preloadReferPath.trim() || refAudioPath.trim())"
                    @click="
                      runAction(
                        'set_refer_audio',
                        preloadReferPath.trim() || refAudioPath.trim(),
                      )
                    "
                  >
                    设置
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-xs text-base-content/60">
                  control 命令（restart / exit）
                </label>
                <div class="flex gap-2">
                  <select
                    v-model="controlCommand"
                    class="gsv-select min-w-0 flex-1 text-sm"
                    :disabled="busy"
                  >
                    <option value="restart">restart 重新运行</option>
                    <option value="exit">exit 结束运行</option>
                  </select>
                  <button
                    type="button"
                    class="gsv-btn-ghost shrink-0"
                    :disabled="busy || !controlCommand.trim()"
                    @click="runControl"
                  >
                    执行
                  </button>
                </div>
              </div>
            </div>

            <!-- 请求 JSON -->
            <div class="rounded-xl border border-app bg-base-200/30 p-3.5">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-base-content/70">
                    请求参数 JSON
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-base-content/40">
                    POST {{ normalizeGptSovitsBaseUrl(baseUrl) }}/tts
                  </p>
                </div>
                <button
                  type="button"
                  class="text-[11px] text-base-content/45 hover:text-base-content"
                  @click="copyRequestJson"
                >
                  {{ copiedJson ? '已复制' : '复制' }}
                </button>
              </div>
              <pre
                class="gsv-log max-h-72 overflow-auto whitespace-pre font-mono text-[11px] leading-relaxed"
              >{{ requestJsonText }}</pre>
            </div>

          </div>
        </div>
      </div>
    </section>

    <p class="mt-5 text-center text-[11px] text-base-content/40 sm:text-xs">
      需先在本机启动 GPT-SoVITS api_v2（python api_v2.py），参考音频路径为服务端本地路径
    </p>

    <!-- 调试日志：底部悬浮 -->
    <div class="gsv-log-dock">
      <div class="gsv-log-dock-inner">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-sm font-medium text-base-content/70">调试日志</p>
          <button
            type="button"
            class="text-[11px] text-base-content/45 hover:text-base-content"
            @click="logs = []"
          >
            清空
          </button>
        </div>
        <pre
          class="gsv-log max-h-36 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed sm:max-h-40"
        >{{ logText }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: 'GPT-SoVITS 调试',
  icon: 'MagicStick',
  group: '媒体类',
  ssr: false,
});

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  GPTSOVITS_DEFAULT_BASE,
  GPTSOVITS_LANGS,
  GPTSOVITS_MEDIA_TYPES,
  GPTSOVITS_SPLIT_METHODS,
  GPTSOVITS_STREAMING_MODES,
  buildGptSovitsUpstreamBody,
  getGptSovitsMediaType,
  normalizeGptSovitsBaseUrl,
  type GptSovitsMediaType,
  type GptSovitsTtsPayload,
} from '~/utils/gptsovits';

const STORAGE_KEY = 'web-tool-gptsovits-debug';

const langOptions = GPTSOVITS_LANGS;
const splitMethods = GPTSOVITS_SPLIT_METHODS;
const mediaTypes = GPTSOVITS_MEDIA_TYPES;
const streamingModes = GPTSOVITS_STREAMING_MODES;

const baseUrl = ref(GPTSOVITS_DEFAULT_BASE);
const text = ref(
  '先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。',
);
const refAudioPath = ref('');
const auxRefAudioPathsText = ref('');
const promptText = ref('');
const textLang = ref('zh');
const promptLang = ref('zh');
const textSplitMethod = ref('cut5');
const mediaType = ref<GptSovitsMediaType>('wav');
const speedFactor = ref(1);
const seed = ref(-1);
const topK = ref(15);
const topP = ref(1);
const temperature = ref(1);
const repetitionPenalty = ref(1.35);
const batchSize = ref(1);
const batchThreshold = ref(0.75);
const fragmentInterval = ref(0.3);
const sampleSteps = ref(32);
const streamingMode = ref(0);
const overlapLength = ref(2);
const minChunkLength = ref(16);
const splitBucket = ref(true);
const parallelInfer = ref(true);
const superSampling = ref(false);

const gptWeightsPath = ref('');
const sovitsWeightsPath = ref('');
const preloadReferPath = ref('');
const controlCommand = ref('restart');

const busy = ref(false);
const busyMode = ref<'tts' | 'ping' | 'action' | ''>('');
const pingOk = ref<boolean | null>(null);
const pingDetail = ref('');
const statusTip = ref('');
const errorMessage = ref('');
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref('');
const audioEl = ref<HTMLAudioElement | null>(null);
const logs = ref<string[]>([]);
const copiedJson = ref(false);
let copiedJsonTimer = 0;

let prefsReady = false;

const pingLabel = computed(() => {
  if (pingOk.value === true) return pingDetail.value || '已连通';
  if (pingOk.value === false) return pingDetail.value || '不可达';
  return '未检测';
});

const canSpeak = computed(
  () =>
    !!text.value.trim() &&
    !!refAudioPath.value.trim() &&
    !!textLang.value &&
    !!promptLang.value &&
    !busy.value,
);

const logText = computed(() =>
  logs.value.length ? logs.value.join('\n') : '暂无日志',
);

const pushLog = (line: string) => {
  const stamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  logs.value = [`[${stamp}] ${line}`, ...logs.value].slice(0, 80);
};

const revokeAudio = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = '';
  }
};

const loadPrefs = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.baseUrl === 'string') {
      baseUrl.value = normalizeGptSovitsBaseUrl(parsed.baseUrl);
    }
    if (typeof parsed.text === 'string') text.value = parsed.text;
    if (typeof parsed.refAudioPath === 'string') refAudioPath.value = parsed.refAudioPath;
    if (typeof parsed.auxRefAudioPathsText === 'string') {
      auxRefAudioPathsText.value = parsed.auxRefAudioPathsText;
    }
    if (typeof parsed.promptText === 'string') promptText.value = parsed.promptText;
    if (typeof parsed.textLang === 'string') textLang.value = parsed.textLang;
    if (typeof parsed.promptLang === 'string') promptLang.value = parsed.promptLang;
    if (typeof parsed.textSplitMethod === 'string') {
      textSplitMethod.value = parsed.textSplitMethod;
    }
    if (typeof parsed.mediaType === 'string') {
      mediaType.value = getGptSovitsMediaType(parsed.mediaType).value;
    }
    if (parsed.speedFactor != null) speedFactor.value = Number(parsed.speedFactor) || 1;
    if (parsed.seed != null) seed.value = Number(parsed.seed);
    if (parsed.topK != null) topK.value = Number(parsed.topK) || 15;
    if (parsed.topP != null) topP.value = Number(parsed.topP) || 1;
    if (parsed.temperature != null) temperature.value = Number(parsed.temperature) || 1;
    if (parsed.repetitionPenalty != null) {
      repetitionPenalty.value = Number(parsed.repetitionPenalty) || 1.35;
    }
    if (parsed.batchSize != null) batchSize.value = Number(parsed.batchSize) || 1;
    if (parsed.batchThreshold != null) {
      batchThreshold.value = Number(parsed.batchThreshold) || 0.75;
    }
    if (parsed.fragmentInterval != null) {
      fragmentInterval.value = Number(parsed.fragmentInterval) || 0.3;
    }
    if (parsed.sampleSteps != null) sampleSteps.value = Number(parsed.sampleSteps) || 32;
    // 兼容旧缓存 sampleStepsInput
    if (
      parsed.sampleSteps == null &&
      typeof parsed.sampleStepsInput === 'string' &&
      parsed.sampleStepsInput.trim()
    ) {
      const n = Number(parsed.sampleStepsInput);
      if (Number.isFinite(n)) sampleSteps.value = n;
    }
    if (parsed.streamingMode != null) {
      const mode = Number(parsed.streamingMode);
      streamingMode.value = [0, 1, 2, 3].includes(mode) ? mode : 0;
    }
    if (parsed.overlapLength != null) {
      overlapLength.value = Number(parsed.overlapLength) || 2;
    }
    if (parsed.minChunkLength != null) {
      minChunkLength.value = Number(parsed.minChunkLength) || 16;
    }
    if (typeof parsed.splitBucket === 'boolean') splitBucket.value = parsed.splitBucket;
    if (typeof parsed.parallelInfer === 'boolean') {
      parallelInfer.value = parsed.parallelInfer;
    }
    if (typeof parsed.superSampling === 'boolean') {
      superSampling.value = parsed.superSampling;
    }
    if (typeof parsed.gptWeightsPath === 'string') {
      gptWeightsPath.value = parsed.gptWeightsPath;
    }
    if (typeof parsed.sovitsWeightsPath === 'string') {
      sovitsWeightsPath.value = parsed.sovitsWeightsPath;
    }
    if (typeof parsed.preloadReferPath === 'string') {
      preloadReferPath.value = parsed.preloadReferPath;
    }
    if (typeof parsed.controlCommand === 'string') {
      controlCommand.value = parsed.controlCommand;
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
        baseUrl: baseUrl.value,
        text: text.value,
        refAudioPath: refAudioPath.value,
        auxRefAudioPathsText: auxRefAudioPathsText.value,
        promptText: promptText.value,
        textLang: textLang.value,
        promptLang: promptLang.value,
        textSplitMethod: textSplitMethod.value,
        mediaType: mediaType.value,
        speedFactor: speedFactor.value,
        seed: seed.value,
        topK: topK.value,
        topP: topP.value,
        temperature: temperature.value,
        repetitionPenalty: repetitionPenalty.value,
        batchSize: batchSize.value,
        batchThreshold: batchThreshold.value,
        fragmentInterval: fragmentInterval.value,
        sampleSteps: sampleSteps.value,
        streamingMode: streamingMode.value,
        overlapLength: overlapLength.value,
        minChunkLength: minChunkLength.value,
        splitBucket: splitBucket.value,
        parallelInfer: parallelInfer.value,
        superSampling: superSampling.value,
        gptWeightsPath: gptWeightsPath.value,
        sovitsWeightsPath: sovitsWeightsPath.value,
        preloadReferPath: preloadReferPath.value,
        controlCommand: controlCommand.value,
      }),
    );
  } catch {
    /* ignore */
  }
};

watch(
  [
    baseUrl,
    text,
    refAudioPath,
    auxRefAudioPathsText,
    promptText,
    textLang,
    promptLang,
    textSplitMethod,
    mediaType,
    speedFactor,
    seed,
    topK,
    topP,
    temperature,
    repetitionPenalty,
    batchSize,
    batchThreshold,
    fragmentInterval,
    sampleSteps,
    streamingMode,
    overlapLength,
    minChunkLength,
    splitBucket,
    parallelInfer,
    superSampling,
    gptWeightsPath,
    sovitsWeightsPath,
    preloadReferPath,
    controlCommand,
  ],
  () => persistPrefs(),
);

const readFetchErrorMessage = async (e: any, fallback: string) => {
  const fromFields =
    e?.data?.message ||
    e?.data?.statusMessage ||
    e?.statusMessage ||
    e?.message;
  if (typeof fromFields === 'string' && fromFields.trim()) {
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
  return fallback;
};

/** 页面表单 → 官方 TTS_Request 字段；再经 buildGptSovitsUpstreamBody 规范化 */
const buildPayload = (): GptSovitsTtsPayload => {
  const aux = auxRefAudioPathsText.value
    .split(/\r?\n|,/)
    .map(s => s.trim())
    .filter(Boolean);
  return {
    text: text.value.trim(),
    text_lang: textLang.value,
    ref_audio_path: refAudioPath.value.trim(),
    aux_ref_audio_paths: aux,
    prompt_lang: promptLang.value,
    prompt_text: promptText.value,
    top_k: topK.value,
    top_p: topP.value,
    temperature: temperature.value,
    text_split_method: textSplitMethod.value,
    batch_size: batchSize.value,
    batch_threshold: batchThreshold.value,
    split_bucket: splitBucket.value,
    speed_factor: speedFactor.value,
    fragment_interval: fragmentInterval.value,
    seed: seed.value,
    media_type: mediaType.value,
    streaming_mode: streamingMode.value,
    parallel_infer: parallelInfer.value,
    repetition_penalty: repetitionPenalty.value,
    sample_steps: sampleSteps.value,
    super_sampling: superSampling.value,
    overlap_length: overlapLength.value,
    min_chunk_length: minChunkLength.value,
  };
};

/** 与代理实际转发的 JSON 完全一致 */
const requestJsonText = computed(() =>
  JSON.stringify(buildGptSovitsUpstreamBody(buildPayload()), null, 2),
);

const copyRequestJson = async () => {
  try {
    await navigator.clipboard.writeText(requestJsonText.value);
    copiedJson.value = true;
    if (copiedJsonTimer) window.clearTimeout(copiedJsonTimer);
    copiedJsonTimer = window.setTimeout(() => {
      copiedJson.value = false;
      copiedJsonTimer = 0;
    }, 1500);
  } catch {
    errorMessage.value = '复制失败，请手动选择文本';
  }
};

const ping = async () => {
  busy.value = true;
  busyMode.value = 'ping';
  errorMessage.value = '';
  try {
    const data = await $fetch<{
      ok: boolean;
      latencyMs: number;
      message: string;
      probed: string;
    }>('/api/gptsovits/action', {
      method: 'POST',
      body: {
        baseUrl: normalizeGptSovitsBaseUrl(baseUrl.value),
        action: 'ping',
      },
    });
    pingOk.value = true;
    pingDetail.value = `${data.message} · ${data.latencyMs}ms`;
    pushLog(`连通检测 OK · ${data.probed} · ${data.latencyMs}ms`);
    statusTip.value = pingDetail.value;
  } catch (e: any) {
    pingOk.value = false;
    const msg = await readFetchErrorMessage(e, '连通检测失败');
    pingDetail.value = msg;
    errorMessage.value = msg;
    pushLog(`连通检测失败：${msg}`);
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

const synthesize = async () => {
  if (!canSpeak.value) return;
  if (mediaType.value === 'raw') {
    errorMessage.value = 'raw 无法在浏览器直接播放，请改用 wav / ogg / aac';
    return;
  }
  busy.value = true;
  busyMode.value = 'tts';
  errorMessage.value = '';
  statusTip.value = '正在请求 /tts …';
  // 播放链路必须非流式，避免 WAV data size=0 导致无声
  const payload = { ...buildPayload(), streaming_mode: 0 as const };
  pushLog(`POST /tts · ${payload.text.slice(0, 40)}${payload.text.length > 40 ? '…' : ''}`);

  try {
    const rawBlob = await $fetch<Blob>('/api/gptsovits/tts', {
      method: 'POST',
      body: {
        baseUrl: normalizeGptSovitsBaseUrl(baseUrl.value),
        payload,
      },
      responseType: 'blob',
    });
    const media = getGptSovitsMediaType(mediaType.value);
    // 显式 MIME，避免 blob.type 为空时部分浏览器解码失败
    const blob =
      rawBlob.type && rawBlob.type !== 'application/octet-stream'
        ? rawBlob
        : new Blob([rawBlob], { type: media.mime });

    if (blob.size < 100) {
      throw new Error(`音频过小（${blob.size} bytes），可能是空结果`);
    }

    revokeAudio();
    audioBlob.value = blob;
    audioUrl.value = URL.createObjectURL(blob);
    statusTip.value = `合成成功 · ${(blob.size / 1024).toFixed(1)} KB · ${media.value}`;
    pushLog(`合成成功 · ${blob.size} bytes · type=${blob.type || media.mime}`);

    await nextTick();
    const el = audioEl.value;
    if (el) {
      el.src = audioUrl.value;
      el.load();
      try {
        await el.play();
      } catch {
        statusTip.value += ' · 已就绪，请点播放';
      }
    }
  } catch (e: any) {
    const msg = await readFetchErrorMessage(e, '合成失败');
    errorMessage.value = msg;
    statusTip.value = '';
    pushLog(`合成失败：${msg}`);
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

const download = () => {
  if (!audioBlob.value) return;
  const media = getGptSovitsMediaType(mediaType.value);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const blob =
    audioBlob.value.type
      ? audioBlob.value
      : new Blob([audioBlob.value], { type: media.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gptsovits-${stamp}.${media.ext}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pushLog(`已下载 ${a.download}`);
};

const runAction = async (
  action: 'set_gpt_weights' | 'set_sovits_weights' | 'set_refer_audio',
  path: string,
) => {
  const trimmed = path.trim();
  if (!trimmed || busy.value) return;
  busy.value = true;
  busyMode.value = 'action';
  errorMessage.value = '';
  pushLog(`${action} · ${trimmed}`);
  try {
    const data = await $fetch<{ ok: boolean; data: unknown }>(
      '/api/gptsovits/action',
      {
        method: 'POST',
        body: {
          baseUrl: normalizeGptSovitsBaseUrl(baseUrl.value),
          action,
          path: trimmed,
        },
      },
    );
    statusTip.value = `${action} 成功`;
    pushLog(`${action} 成功 · ${JSON.stringify(data.data)}`);
  } catch (e: any) {
    const msg = await readFetchErrorMessage(e, `${action} 失败`);
    errorMessage.value = msg;
    pushLog(`${action} 失败：${msg}`);
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

const runControl = async () => {
  const command = controlCommand.value.trim();
  if (!command || busy.value) return;
  busy.value = true;
  busyMode.value = 'action';
  errorMessage.value = '';
  pushLog(`control · ${command}`);
  try {
    const data = await $fetch<{ ok: boolean; data: unknown }>(
      '/api/gptsovits/action',
      {
        method: 'POST',
        body: {
          baseUrl: normalizeGptSovitsBaseUrl(baseUrl.value),
          action: 'control',
          command,
        },
      },
    );
    statusTip.value = `control ${command} 已发送`;
    pushLog(`control 成功 · ${JSON.stringify(data.data)}`);
  } catch (e: any) {
    const msg = await readFetchErrorMessage(e, 'control 失败');
    errorMessage.value = msg;
    pushLog(`control 失败：${msg}`);
  } finally {
    busy.value = false;
    busyMode.value = '';
  }
};

onMounted(() => {
  loadPrefs();
  prefsReady = true;
  persistPrefs();
});

onUnmounted(() => {
  revokeAudio();
  if (copiedJsonTimer) window.clearTimeout(copiedJsonTimer);
});
</script>

<style scoped>
.gsv-textarea,
.gsv-input,
.gsv-select {
  border-radius: 0.75rem;
  border: 1px solid var(--app-border-strong);
  background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
  color: var(--color-base-content);
  padding: 0.55rem 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.gsv-textarea {
  padding: 0.75rem 1rem;
}

.gsv-textarea:focus,
.gsv-input:focus,
.gsv-select:focus {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  box-shadow: 0 0 0 3px
    color-mix(in oklab, var(--color-primary) 22%, transparent);
}

.gsv-textarea:disabled,
.gsv-input:disabled,
.gsv-select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.gsv-range {
  -webkit-appearance: none;
  appearance: none;
  height: 0.375rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-content) 14%, transparent);
  accent-color: var(--color-primary);
  cursor: pointer;
}

.gsv-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: var(--color-primary);
  border: 2px solid color-mix(in oklab, var(--color-primary) 35%, white);
}

.gsv-btn-primary,
.gsv-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    filter 0.15s ease,
    opacity 0.15s ease,
    background-color 0.15s ease;
}

.gsv-btn-primary {
  border: 0;
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.gsv-btn-primary:hover:not(:disabled) {
  filter: brightness(1.06);
}

.gsv-btn-ghost {
  border: 1px solid var(--app-border-strong);
  background: transparent;
  color: var(--color-base-content);
  font-weight: 500;
}

.gsv-btn-ghost:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.gsv-btn-primary:disabled,
.gsv-btn-ghost:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.gsv-spinner {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 9999px;
  animation: gsv-spin 0.65s linear infinite;
}

.gsv-log {
  border-radius: 0.65rem;
  border: 1px solid var(--app-border);
  background: color-mix(in oklab, var(--color-base-100) 70%, transparent);
  padding: 0.65rem 0.75rem;
  min-height: 4.5rem;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
}

.gsv-log-dock {
  position: fixed;
  z-index: 40;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 0 0.75rem 0.75rem;
}

.gsv-log-dock-inner {
  pointer-events: auto;
  margin: 0 auto;
  max-width: 72rem;
  border-radius: 1rem 1rem 0.75rem 0.75rem;
  border: 1px solid var(--app-border-strong);
  background: color-mix(in oklab, var(--color-base-100) 92%, transparent);
  box-shadow:
    0 -8px 28px color-mix(in oklab, var(--color-base-content) 10%, transparent);
  backdrop-filter: blur(10px);
  padding: 0.75rem 0.9rem 0.85rem;
}

@media (min-width: 640px) {
  .gsv-log-dock {
    padding: 0 1rem 1rem;
  }

  .gsv-log-dock-inner {
    padding: 0.85rem 1rem 0.95rem;
  }
}

@keyframes gsv-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
