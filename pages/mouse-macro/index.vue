<template>
  <main class="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
    <header class="mb-7">
      <p class="mb-2 text-sm font-medium text-primary">XMBC SCRIPT BUILDER</p>
      <h1 class="text-2xl font-bold text-base-content sm:text-3xl">鼠标宏脚本生成器</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-base-content/55">
        用按钮组合鼠标、键盘和延迟动作，生成可粘贴到 X-Mouse Button Control「模拟按键」的脚本。
      </p>
    </header>

    <section class="mb-5 rounded-2xl border border-app bg-base-100/70 p-4 sm:p-5">
      <div class="mb-3">
        <h2 class="font-semibold text-base-content">识别现有 XMBC 脚本</h2>
        <p class="mt-1 text-xs leading-5 text-base-content/45">
          粘贴脚本后自动拆解为有序步骤，支持鼠标按下/抬起、WAITMS、HOLDMS 和普通输入文字。识别成功会替换当前步骤。
        </p>
      </div>
      <textarea
        v-model="scriptToParse"
        class="textarea textarea-bordered min-h-28 w-full font-mono text-xs leading-5"
        placeholder="{LMB}{WAITMS:40}{LMBD}{WAITMS:180}{RMB}{HOLDMS:750}s..."
        spellcheck="false"
      />
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!scriptToParse"
          @click="parseScript"
        >
          识别并还原步骤
        </button>
        <p v-if="parseError" class="text-xs text-error">{{ parseError }}</p>
        <p v-else-if="parseStatus" class="text-xs text-success">{{ parseStatus }}</p>
      </div>
    </section>

    <section class="mb-5 rounded-2xl border border-app bg-base-100/70 p-4 sm:p-5">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-base-content">添加动作</h2>
          <p class="mt-1 text-xs text-base-content/45">点击按钮即可将动作加入宏步骤</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm border border-app-strong"
          :disabled="!steps.length"
          @click="loadExample"
        >
          加载示例
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-app-muted bg-base-200/30 p-3">
          <p class="mb-2 text-xs font-semibold text-base-content/55">鼠标按键</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="mouse in mouseActions"
              :key="mouse.value"
              type="button"
              class="btn btn-sm btn-ghost border border-app-strong"
              @click="addMouse(mouse.value)"
            >
              {{ mouse.label }}
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-app-muted bg-base-200/30 p-3">
          <p class="mb-2 text-xs font-semibold text-base-content/55">键盘按键</p>
          <div class="flex gap-2">
            <select v-model="selectedKey" class="select select-bordered select-sm min-w-0 flex-1">
              <option v-for="key in keyOptions" :key="key.value" :value="key.value">
                {{ key.label }}
              </option>
            </select>
            <button type="button" class="btn btn-sm btn-primary" @click="addKey">
              添加按键
            </button>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="combo in keyCombos"
              :key="combo.value"
              type="button"
              class="btn btn-xs btn-ghost border border-app-muted"
              @click="addKey(combo.value)"
            >
              {{ combo.label }}
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-app-muted bg-base-200/30 p-3">
          <p class="mb-2 text-xs font-semibold text-base-content/55">输入文字</p>
          <div class="flex gap-2">
            <input
              v-model="textToType"
              type="text"
              class="input input-bordered input-sm min-w-0 flex-1"
              placeholder="输入要自动键入的内容"
              @keydown.enter.prevent="addText"
            />
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :disabled="!textToType"
              @click="addText"
            >
              添加文字
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-app-muted bg-base-200/30 p-3">
          <p class="mb-2 text-xs font-semibold text-base-content/55">延迟</p>
          <div class="flex items-center gap-2">
            <input
              v-model.number="delayToAdd"
              type="number"
              min="1"
              max="60000"
              class="input input-bordered input-sm w-28"
              aria-label="延迟毫秒数"
            />
            <span class="text-xs text-base-content/50">毫秒</span>
            <button type="button" class="btn btn-sm btn-primary sm:ml-auto" @click="addDelay">
              添加延迟
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-5 overflow-hidden rounded-2xl border border-app bg-base-100/70">
      <div class="flex items-center justify-between gap-3 border-b border-app-muted px-4 py-3 sm:px-5">
        <div>
          <h2 class="font-semibold text-base-content">宏步骤</h2>
          <p class="mt-1 text-xs text-base-content/45">{{ steps.length }} 个动作 · 可调整顺序并直接编辑延迟时长</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm text-error"
          :disabled="!steps.length"
          @click="clearSteps"
        >
          清空
        </button>
      </div>

      <ol v-if="steps.length" class="flex flex-wrap items-stretch gap-3 p-3 sm:p-5">
        <li
          v-for="(step, index) in steps"
          :key="step.id"
          class="min-w-[145px] flex-[1_1_185px] rounded-xl border border-app bg-base-200/35 p-3 transition-[border-color,box-shadow,background-color] duration-500 hover:border-app-strong"
          :class="{ 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/35': highlightedStepId === step.id }"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold"
              :class="stepColorClass(step)"
            >
              {{ stepIcon(step) }}
            </span>
            <span class="font-mono text-[10px] text-base-content/35">
              {{ String(index + 1).padStart(2, '0') }} / {{ steps.length }}
            </span>
          </div>

          <div class="min-h-16">
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
              :class="stepColorClass(step)"
            >
              {{ stepCategory(step) }}
            </span>
            <p class="mt-1.5 break-words text-sm font-semibold text-base-content">
              {{ describeStep(step) }}
            </p>
            <code class="mt-1 block break-all font-mono text-xs text-base-content/45">
              {{ stepCommand(step) }}
            </code>
          </div>

          <div class="mt-3 flex items-center justify-between gap-1 border-t border-app-muted pt-2">
            <label
              v-if="step.kind === 'delay' || step.kind === 'hold'"
              class="flex items-center gap-1 text-[10px] text-base-content/45"
            >
              {{ step.kind === 'hold' ? '按住时长' : '延迟时长' }}
              <input
                v-model.number="step.milliseconds"
                type="number"
                min="1"
                max="60000"
                class="input input-bordered input-xs w-16 text-right font-mono"
                :aria-label="`第 ${index + 1} 步的${step.kind === 'hold' ? '按住' : '延迟'}时长（毫秒）`"
              />
              ms
            </label>
            <span v-else class="text-[10px] text-base-content/35">动作顺序</span>
            <div class="flex items-center">
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="index === 0"
                :aria-label="`第 ${index + 1} 步上移`"
                @click="moveStep(index, -1)"
              >
                ←
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="index === steps.length - 1"
                :aria-label="`第 ${index + 1} 步下移`"
                @click="moveStep(index, 1)"
              >
                →
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs text-error"
                :aria-label="`删除第 ${index + 1} 步`"
                @click="removeStep(index)"
              >
                ×
              </button>
            </div>
          </div>
        </li>
      </ol>
      <div v-else class="px-5 py-12 text-center">
        <div class="mb-2 text-3xl">🖱️</div>
        <p class="text-sm font-medium text-base-content/70">还没有宏步骤</p>
        <p class="mt-1 text-xs text-base-content/40">从上方点击动作按钮开始创建脚本</p>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-app bg-base-100/70">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-app-muted px-4 py-3 sm:px-5">
        <div>
          <h2 class="font-semibold text-base-content">XMBC 脚本</h2>
          <p class="mt-1 text-xs text-base-content/45">复制后粘贴到鼠标按键的「模拟按键」动作中</p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-app-strong"
            :disabled="!script"
            @click="copyScript"
          >
            {{ copied ? '已复制' : '复制脚本' }}
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!script"
            @click="downloadScript"
          >
            下载 .txt
          </button>
        </div>
      </div>
      <pre class="min-h-24 overflow-x-auto whitespace-pre-wrap break-all bg-base-200/30 p-4 font-mono text-sm leading-6 text-base-content sm:p-5">{{ script || '添加动作后，脚本会显示在这里…' }}</pre>
      <div class="border-t border-app-muted px-4 py-3 text-xs leading-5 text-base-content/45 sm:px-5">
        鼠标点击会生成为 <code class="font-mono">{LMB}</code> 等 XMBC 指令，延迟会生成为
        <code class="font-mono">{WAITMS:500}</code>。本工具生成的是脚本文本，不会自动写入或操作 XMBC。
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

definePageMeta({
  tool: true,
  title: '🖱️鼠标宏脚本生成器',
  group: '效率工具',
});

type MouseButton = 'LMB' | 'RMB' | 'MMB' | 'X1MB' | 'X2MB';
type MacroStep =
  | { id: number; kind: 'mouse'; button: MouseButton; action: 'click' | 'down' | 'up' }
  | { id: number; kind: 'key'; key: string }
  | { id: number; kind: 'text'; text: string }
  | { id: number; kind: 'delay'; milliseconds: number }
  | { id: number; kind: 'hold'; milliseconds: number };

const mouseActions: { value: MouseButton; label: string }[] = [
  { value: 'LMB', label: '左键' },
  { value: 'RMB', label: '右键' },
  { value: 'MMB', label: '中键' },
  { value: 'X1MB', label: '侧键 1' },
  { value: 'X2MB', label: '侧键 2' },
];

const keyOptions = [
  { value: 'ENTER', label: 'Enter' },
  { value: 'TAB', label: 'Tab' },
  { value: 'SPACE', label: 'Space' },
  { value: 'ESC', label: 'Esc' },
  { value: 'BACKSPACE', label: 'Backspace' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'UP', label: '↑ 上' },
  { value: 'DOWN', label: '↓ 下' },
  { value: 'LEFT', label: '← 左' },
  { value: 'RIGHT', label: '→ 右' },
  ...Array.from({ length: 12 }, (_, index) => ({
    value: `F${index + 1}`,
    label: `F${index + 1}`,
  })),
];

const keyCombos = [
  { value: 'CTRL+C', label: 'Ctrl+C' },
  { value: 'CTRL+V', label: 'Ctrl+V' },
  { value: 'CTRL+Z', label: 'Ctrl+Z' },
  { value: 'ALT+TAB', label: 'Alt+Tab' },
  { value: 'SHIFT+TAB', label: 'Shift+Tab' },
];

const steps = ref<MacroStep[]>([]);
const selectedKey = ref('ENTER');
const textToType = ref('');
const delayToAdd = ref(500);
const copied = ref(false);
const scriptToParse = ref('');
const parseError = ref('');
const parseStatus = ref('');
const highlightedStepId = ref<number | null>(null);
let highlightTimer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;

const script = computed(() =>
  steps.value
    .map(step => {
      if (step.kind === 'mouse') {
        const suffix = step.action === 'down' ? 'D' : step.action === 'up' ? 'U' : '';
        return `{${step.button}${suffix}}`;
      }
      if (step.kind === 'key') return formatKey(step.key);
      if (step.kind === 'text') return step.text;
      if (step.kind === 'hold') return `{HOLDMS:${step.milliseconds}}`;
      return `{WAITMS:${step.milliseconds}}`;
    })
    .join(''),
);

function createStep<T extends Omit<MacroStep, 'id'>>(step: T): T & Pick<MacroStep, 'id'> {
  return { ...step, id: nextId++ };
}

function addMouse(button: MouseButton) {
  steps.value.push(createStep({ kind: 'mouse', button, action: 'click' }));
}

function addKey(key = selectedKey.value) {
  steps.value.push(createStep({ kind: 'key', key }));
}

function addText() {
  const text = textToType.value;
  if (!text) return;
  steps.value.push(createStep({ kind: 'text', text }));
  textToType.value = '';
}

function addDelay() {
  const milliseconds = Math.max(1, Math.min(60000, Math.round(delayToAdd.value || 1)));
  steps.value.push(createStep({ kind: 'delay', milliseconds }));
}

function formatKey(key: string) {
  const combo = key.split('+');
  const baseKey = combo.pop() || key;
  const modifiers: Record<string, string> = { CTRL: '^', SHIFT: '+', ALT: '!' };
  return `${combo.map(modifier => modifiers[modifier] || '').join('')}{${baseKey}}`;
}

function describeStep(step: MacroStep) {
  if (step.kind === 'mouse') {
    const label = mouseActions.find(item => item.value === step.button)?.label || step.button;
    if (step.action === 'down') return `${label}按下`;
    if (step.action === 'up') return `${label}抬起`;
    return `${label}点击`;
  }
  if (step.kind === 'key') return `按下 ${step.key.replace('+', ' + ')}`;
  if (step.kind === 'text') return `输入「${step.text}」`;
  if (step.kind === 'hold') return `保持 ${step.milliseconds} 毫秒`;
  return `等待 ${step.milliseconds} 毫秒`;
}

function stepCategory(step: MacroStep) {
  if (step.kind === 'mouse') return step.action === 'down' ? '鼠标按下' : step.action === 'up' ? '鼠标抬起' : '鼠标点击';
  if (step.kind === 'key') return '键盘按键';
  if (step.kind === 'text') return '输入文字';
  if (step.kind === 'hold') return '按住';
  return '延迟';
}

function stepIcon(step: MacroStep) {
  if (step.kind === 'mouse') return step.action === 'down' ? '↓' : step.action === 'up' ? '↑' : '●';
  if (step.kind === 'key') return '⌨';
  if (step.kind === 'text') return 'T';
  if (step.kind === 'hold') return 'H';
  return '…';
}

function stepColorClass(step: MacroStep) {
  if (step.kind === 'mouse' && step.action === 'down') return 'border-error/25 bg-error/10 text-error';
  if (step.kind === 'mouse' && step.action === 'up') return 'border-success/25 bg-success/10 text-success';
  if (step.kind === 'mouse') return 'border-primary/25 bg-primary/10 text-primary';
  if (step.kind === 'key') return 'border-secondary/25 bg-secondary/10 text-secondary';
  if (step.kind === 'text') return 'border-info/25 bg-info/10 text-info';
  if (step.kind === 'hold') return 'border-warning/25 bg-warning/10 text-warning';
  return 'border-app-strong bg-base-200 text-base-content/65';
}

function stepCommand(step: MacroStep) {
  if (step.kind === 'mouse') {
    const suffix = step.action === 'down' ? 'D' : step.action === 'up' ? 'U' : '';
    return `{${step.button}${suffix}}`;
  }
  if (step.kind === 'key') return formatKey(step.key);
  if (step.kind === 'text') return step.text;
  if (step.kind === 'hold') return `{HOLDMS:${step.milliseconds}}`;
  return `{WAITMS:${step.milliseconds}}`;
}

function moveStep(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= steps.value.length) return;
  const [step] = steps.value.splice(index, 1);
  steps.value.splice(target, 0, step);
  highlightedStepId.value = step.id;
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => {
    highlightedStepId.value = null;
    highlightTimer = undefined;
  }, 650);
}

function removeStep(index: number) {
  const removedStep = steps.value[index];
  steps.value.splice(index, 1);
  if (removedStep?.id !== highlightedStepId.value) return;
  highlightedStepId.value = null;
  if (highlightTimer) clearTimeout(highlightTimer);
  highlightTimer = undefined;
}

function clearSteps() {
  steps.value = [];
}

function loadExample() {
  steps.value = [
    createStep({ kind: 'mouse', button: 'LMB', action: 'click' }),
    createStep({ kind: 'delay', milliseconds: 100 }),
    createStep({ kind: 'key', key: 'CTRL+C' }),
    createStep({ kind: 'delay', milliseconds: 300 }),
    createStep({ kind: 'key', key: 'CTRL+V' }),
  ];
}

function parseScript() {
  parseError.value = '';
  parseStatus.value = '';
  const source = scriptToParse.value;
  if (!source) {
    parseError.value = '请先粘贴 XMBC 脚本。';
    return;
  }

  const parsed: MacroStep[] = [];
  const matcher = /\{([^{}]+)\}|([^{}]+)/g;
  let match: RegExpExecArray | null;
  let cursor = 0;

  while ((match = matcher.exec(source))) {
    if (match.index !== cursor) {
      parseError.value = `第 ${cursor + 1} 个字符附近包含无法识别的括号格式。`;
      return;
    }
    cursor = matcher.lastIndex;

    if (match[2] !== undefined) {
      if (match[2]) parsed.push(createStep({ kind: 'text', text: match[2] }));
      continue;
    }

    const token = match[1].toUpperCase();
    const mouseMatch = token.match(/^(LMB|RMB|MMB|X1MB|X2MB)(D|U)?$/);
    if (mouseMatch) {
      const button = mouseMatch[1] as MouseButton;
      const action = mouseMatch[2] === 'D' ? 'down' : mouseMatch[2] === 'U' ? 'up' : 'click';
      parsed.push(createStep({ kind: 'mouse', button, action }));
      continue;
    }

    const timingMatch = token.match(/^(WAITMS|HOLDMS):(\d+)$/);
    if (timingMatch) {
      const milliseconds = Number(timingMatch[2]);
      if (!Number.isSafeInteger(milliseconds)) {
        parseError.value = `时间值超出可识别范围：{${match[1]}}`;
        return;
      }
      const kind = timingMatch[1] === 'WAITMS' ? 'delay' : 'hold';
      if (kind === 'delay') parsed.push(createStep({ kind, milliseconds }));
      else parsed.push(createStep({ kind, milliseconds }));
      continue;
    }

    parseError.value = `暂不支持指令 {${match[1]}}，脚本未导入。`;
    return;
  }

  if (cursor !== source.length) {
    parseError.value = `第 ${cursor + 1} 个字符附近包含无法识别的括号格式。`;
    return;
  }
  if (!parsed.length) {
    parseError.value = '没有识别到可导入的动作。';
    return;
  }

  steps.value = parsed;
  parseStatus.value = `已还原 ${parsed.length} 个有序步骤，脚本内容保持不变。`;
}

async function copyScript() {
  if (!script.value) return;
  try {
    await navigator.clipboard.writeText(script.value);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch (error) {
    console.error('复制 XMBC 脚本失败:', error);
    window.alert('复制失败，请检查浏览器剪贴板权限。');
  }
}

function downloadScript() {
  if (!script.value) return;
  const blob = new Blob([script.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'x-mouse-macro.txt';
  link.click();
  URL.revokeObjectURL(url);
}

onBeforeUnmount(() => {
  if (highlightTimer) clearTimeout(highlightTimer);
});
</script>
