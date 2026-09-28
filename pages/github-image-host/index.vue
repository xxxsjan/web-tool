<template>
  <div class="github-image-host mx-auto w-full max-w-5xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        Git 图床
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        支持 GitHub / Gitee · 粘贴上传 · 压缩 · 外链
      </p>
    </header>

    <section class="overflow-hidden rounded-2xl tool-panel">
      <!-- 仓库摘要 + 压缩设置 -->
      <div class="tool-panel-head space-y-3 px-4 py-3 sm:px-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div class="flex shrink-0 gap-1.5">
              <button
                v-for="opt in providerOptions"
                :key="opt.value"
                type="button"
                class="btn btn-sm"
                :class="
                  activeProvider === opt.value
                    ? 'btn-primary'
                    : 'btn-ghost bg-base-content/5 hover:bg-base-content/10'
                "
                @click="switchProvider(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
            <div class="min-w-0">
              <p class="truncate text-[11px] text-base-content/45">
                <template v-if="configReady">
                  {{ activeProfile.owner }}/{{ activeProfile.repo }} · {{ activeProfile.branch }} ·
                  {{ activeProfile.path || '/' }}
                </template>
                <template v-else>当前平台尚未配置，请先填写 Token 与仓库信息</template>
              </p>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm bg-base-content/5 hover:bg-base-content/10"
              :disabled="!configReady || loadingRemote"
              @click="fetchRemoteImages"
            >
              <span v-if="loadingRemote" class="loading loading-spinner loading-xs"></span>
              {{ loadingRemote ? '同步中' : '同步远端' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm shrink-0 bg-base-content/5 hover:bg-base-content/10"
              @click="openConfigDialog"
            >
              {{ configReady ? '修改配置' : '去配置' }}
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-base-content/8 pt-3">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-base-content">
            <input v-model="compressEnabled" type="checkbox" class="toggle toggle-sm toggle-primary" />
            上传前压缩
          </label>
          <div v-if="compressEnabled" class="flex flex-wrap items-center gap-2 text-xs">
            <label class="flex items-center gap-1.5 text-base-content/60">
              质量
              <input
                v-model.number="compressQuality"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                class="range range-primary range-xs w-24"
              />
              <span class="font-mono w-8">{{ Math.round(compressQuality * 100) }}%</span>
            </label>
            <label class="flex items-center gap-1.5 text-base-content/60">
              最大边
              <input
                v-model.number="maxEdge"
                type="number"
                min="0"
                step="100"
                class="input input-sm w-20 bg-base-200/60"
                title="0 表示不限制"
              />
            </label>
            <select v-model="compressFormat" class="select select-sm bg-base-200/60">
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 上传区 -->
      <div
        class="relative m-4 overflow-hidden rounded-xl transition-colors sm:m-5"
        :class="
          isDragging
            ? 'bg-primary/15 ring-2 ring-primary/50'
            : pendingFile
              ? 'bg-base-200/50'
              : 'bg-base-200/35 hover:bg-base-200/55'
        "
        @click="triggerFileInput"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        />

        <div
          class="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 px-4 py-8 text-center"
        >
          <template v-if="!pendingPreview">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </span>
            <div>
              <p class="text-base font-medium text-base-content">
                {{ isDragging ? '松开即可添加图片' : '点击、拖拽或 Ctrl+V 粘贴图片' }}
              </p>
              <p class="mt-1 text-xs text-base-content/50">
                PNG / JPG / WebP / GIF · 建议单张小于 5MB
              </p>
            </div>
          </template>

          <template v-else>
            <img
              :src="pendingPreview"
              alt="预览"
              class="max-h-48 max-w-full rounded-lg object-contain"
              @click.stop
            />
            <div
              class="inline-flex max-w-full items-center gap-2 rounded-lg bg-base-100/70 px-3 py-2"
              @click.stop
            >
              <div class="min-w-0 text-left">
                <p class="truncate text-sm font-medium text-base-content">
                  {{ pendingFile?.name }}
                </p>
                <p class="text-[11px] text-base-content/50">
                  {{ formatBytes(pendingFile?.size || 0) }}
                  <template v-if="compressedInfo">
                    → {{ formatBytes(compressedInfo.size) }}
                    <span class="text-success">
                      (−{{ compressedInfo.ratio }}%)
                    </span>
                  </template>
                </p>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle shrink-0"
                :disabled="uploading"
                aria-label="移除"
                @click="clearPending"
              >
                ✕
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- 操作 -->
      <div class="tool-panel-foot space-y-3 p-4 sm:p-5">
        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="btn btn-primary flex-1"
            :disabled="!pendingFile || uploading || !configReady"
            @click="uploadImage"
          >
            <span v-if="uploading" class="loading loading-spinner loading-sm"></span>
            {{ uploading ? '上传中…' : `上传到 ${providerLabel}` }}
          </button>
          <button
            type="button"
            class="btn btn-ghost bg-base-content/5 hover:bg-base-content/10 sm:w-28"
            :disabled="!pendingFile || uploading"
            @click="clearPending"
          >
            清空
          </button>
        </div>

        <div
          v-if="errorMessage"
          class="whitespace-pre-line rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error"
        >
          {{ errorMessage }}
        </div>
      </div>
    </section>

    <!-- 远端图库 -->
    <section class="mt-5 overflow-hidden rounded-2xl tool-panel">
      <div class="flex items-center justify-between gap-2 tool-panel-head px-4 py-3 sm:px-5">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-base-content">远端图片</h2>
          <p class="text-[11px] text-base-content/45">
            <template v-if="remoteFetched">共 {{ remoteImages.length }} 张 · {{ activeProfile.path || '仓库根目录' }}</template>
            <template v-else>配置仓库后点击「同步远端」加载</template>
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs shrink-0 bg-base-content/5 hover:bg-base-content/10"
          :disabled="!configReady || loadingRemote"
          @click="fetchRemoteImages"
        >
          <span v-if="loadingRemote" class="loading loading-spinner loading-xs"></span>
          {{ loadingRemote ? '同步中…' : '刷新' }}
        </button>
      </div>

      <div v-if="loadingRemote && !remoteImages.length" class="px-4 py-10 text-center text-sm text-base-content/45">
        正在拉取远端图片…
      </div>
      <div
        v-else-if="remoteFetched && !remoteImages.length"
        class="px-4 py-10 text-center text-sm text-base-content/45"
      >
        当前目录下没有图片
      </div>
      <div
        v-else-if="!remoteFetched"
        class="px-4 py-10 text-center text-sm text-base-content/45"
      >
        点击上方「同步远端」获取仓库中的图片
      </div>
      <div v-else class="remote-table-wrap max-h-[min(70vh,720px)] overflow-auto">
        <table class="table table-sm table-pin-rows remote-table">
          <thead>
            <tr class="text-xs text-base-content/55">
              <th class="w-14">预览</th>
              <th>文件名</th>
              <th class="w-20">大小</th>
              <th
                v-for="opt in linkTypeOptions"
                :key="opt.key"
                class="w-24 text-center"
              >
                {{ opt.label }}
              </th>
              <th class="w-16 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in remoteImages" :key="item.path">
              <td>
                <img
                  :src="previewUrl(item)"
                  :alt="item.name"
                  class="h-10 w-10 rounded-lg object-cover bg-base-200/60"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @error="onPreviewError"
                />
              </td>
              <td class="max-w-[12rem] sm:max-w-xs">
                <p class="truncate text-xs font-medium text-base-content" :title="item.name">
                  {{ item.name }}
                </p>
                <p class="truncate font-mono text-[10px] text-base-content/40" :title="item.path">
                  {{ item.path }}
                </p>
              </td>
              <td class="whitespace-nowrap text-xs text-base-content/55">
                {{ item.size ? formatBytes(item.size) : '—' }}
              </td>
              <td
                v-for="opt in linkTypeOptions"
                :key="opt.key"
                class="text-center"
              >
                <button
                  type="button"
                  class="btn btn-ghost btn-xs bg-base-content/5 hover:bg-primary/20 hover:text-primary"
                  @click="copyItemLink(item, opt.key)"
                >
                  复制
                </button>
              </td>
              <td class="text-center">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error hover:bg-error/15"
                  :disabled="deletingId === item.id || !configReady"
                  @click="deleteImage(item)"
                >
                  <span
                    v-if="deletingId === item.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  {{ deletingId === item.id ? '…' : '删除' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <el-dialog
      v-model="showConfigDialog"
      title="仓库配置"
      width="min(92vw, 520px)"
      align-center
      destroy-on-close
      append-to-body
      class="github-host-config-dialog"
      @closed="onConfigDialogClosed"
    >
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <p class="mb-1.5 text-xs text-base-content/60">配置平台（两套配置互不影响）</p>
          <div class="flex gap-2">
            <button
              v-for="opt in providerOptions"
              :key="opt.value"
              type="button"
              class="btn btn-sm flex-1"
              :class="
                draftProvider === opt.value
                  ? 'btn-primary'
                  : 'btn-ghost bg-base-content/5 hover:bg-base-content/10'
              "
              @click="draftProvider = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <label class="form-control sm:col-span-2">
          <span class="mb-1 text-xs text-base-content/60">{{ tokenFieldLabel }}</span>
          <input
            v-model="drafts[draftProvider].token"
            type="password"
            class="input input-sm w-full bg-base-200/60"
            :placeholder="tokenPlaceholder"
            autocomplete="off"
          />
        </label>
        <label class="form-control">
          <span class="mb-1 text-xs text-base-content/60">Owner</span>
          <input
            v-model="drafts[draftProvider].owner"
            type="text"
            class="input input-sm w-full bg-base-200/60"
            :placeholder="draftProvider === 'gitee' ? '用户名' : 'xxxsjan'"
          />
        </label>
        <label class="form-control">
          <span class="mb-1 text-xs text-base-content/60">Repo</span>
          <input
            v-model="drafts[draftProvider].repo"
            type="text"
            class="input input-sm w-full bg-base-200/60"
            :placeholder="draftProvider === 'gitee' ? '仓库名' : 'pic-bed'"
          />
        </label>
        <label class="form-control">
          <span class="mb-1 text-xs text-base-content/60">Branch</span>
          <input
            v-model="drafts[draftProvider].branch"
            type="text"
            class="input input-sm w-full bg-base-200/60"
            :placeholder="draftProvider === 'gitee' ? 'master' : 'main'"
          />
        </label>
        <label class="form-control">
          <span class="mb-1 text-xs text-base-content/60">目录路径</span>
          <input
            v-model="drafts[draftProvider].path"
            type="text"
            class="input input-sm w-full bg-base-200/60"
            placeholder="fromtool"
          />
        </label>
        <p class="sm:col-span-2 text-[11px] leading-relaxed text-base-content/40">
          {{ tokenHelpText }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm bg-base-content/5 hover:bg-base-content/10"
            @click="showConfigDialog = false"
          >
            取消
          </button>
          <button type="button" class="btn btn-primary btn-sm" @click="saveConfigDialog">
            保存
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '🖼️Git图床',
  group: '媒体类',
});

import { ElMessage, ElMessageBox } from 'element-plus';

const STORAGE_KEY = 'web-tool-github-image-host';

type Provider = 'github' | 'gitee';
type LinkKey = 'cdn' | 'raw' | 'page' | 'markdown';

type RepoProfile = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

type UploadResult = {
  id: string;
  name: string;
  path: string;
  sha: string;
  size?: number;
  cdn: string;
  raw: string;
  page: string;
};

type CompressedInfo = {
  size: number;
  ratio: number;
  blob: Blob;
  ext: string;
};

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg|ico|avif)$/i;

const providerOptions: { value: Provider; label: string }[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'gitee', label: 'Gitee' },
];

function emptyProfile(provider: Provider): RepoProfile {
  return {
    token: '',
    owner: '',
    repo: '',
    branch: provider === 'gitee' ? 'master' : 'main',
    path: 'fromtool',
  };
}

const showConfigDialog = ref(false);
const activeProvider = ref<Provider>('github');
const draftProvider = ref<Provider>('github');
const profiles = reactive<Record<Provider, RepoProfile>>({
  github: emptyProfile('github'),
  gitee: emptyProfile('gitee'),
});
const drafts = reactive<Record<Provider, RepoProfile>>({
  github: emptyProfile('github'),
  gitee: emptyProfile('gitee'),
});

const compressEnabled = ref(true);
const compressQuality = ref(0.8);
const maxEdge = ref(1920);
const compressFormat = ref<'image/webp' | 'image/jpeg' | 'image/png'>('image/jpeg');

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const pendingFile = ref<File | null>(null);
const pendingPreview = ref('');
const compressedInfo = ref<CompressedInfo | null>(null);
const uploading = ref(false);
const loadingRemote = ref(false);
const remoteFetched = ref(false);
const deletingId = ref('');
const errorMessage = ref('');
const remoteImages = ref<UploadResult[]>([]);

const activeProfile = computed(() => profiles[activeProvider.value]);
const isGitee = computed(() => activeProvider.value === 'gitee');
const providerLabel = computed(() => (isGitee.value ? 'Gitee' : 'GitHub'));

const linkTypeOptions = computed(() => {
  if (isGitee.value) {
    return [
      { key: 'raw' as const, label: 'Raw' },
      { key: 'page' as const, label: 'Gitee' },
      { key: 'markdown' as const, label: 'Markdown' },
    ];
  }
  return [
    { key: 'cdn' as const, label: 'jsDelivr' },
    { key: 'raw' as const, label: 'Raw' },
    { key: 'page' as const, label: 'GitHub' },
    { key: 'markdown' as const, label: 'Markdown' },
  ];
});

const tokenFieldLabel = computed(() =>
  draftProvider.value === 'gitee'
    ? 'Gitee 私人令牌（需 projects 权限）'
    : 'GitHub Token（Classic 或 Fine-grained）',
);

const tokenPlaceholder = computed(() =>
  draftProvider.value === 'gitee' ? '私人令牌' : 'ghp_… 或 github_pat_…',
);

const tokenHelpText = computed(() =>
  draftProvider.value === 'gitee'
    ? 'Token 仅保存在本机浏览器。Gitee：设置 → 安全设置 → 私人令牌，勾选 projects 相关权限。上传时在页面顶部切换平台即可。'
    : 'Token 仅保存在本机浏览器。Classic：勾选 repo；Fine-grained：选中目标仓库，Contents 设为 Read and write。上传时在页面顶部切换平台即可。',
);

const configReady = computed(() => {
  const p = activeProfile.value;
  return Boolean(p.token.trim() && p.owner.trim() && p.repo.trim() && p.branch.trim());
});

onMounted(() => {
  loadConfig();
  if (!configReady.value) {
    showConfigDialog.value = true;
    draftProvider.value = activeProvider.value;
    syncDraftsFromProfiles();
  } else {
    fetchRemoteImages({ silent: true });
  }
  window.addEventListener('paste', onPaste);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste);
  revokePreview();
});

watch([compressEnabled, compressQuality, maxEdge, compressFormat], () => {
  if (pendingFile.value) prepareFile(pendingFile.value);
});

function cloneProfile(source: RepoProfile): RepoProfile {
  return {
    token: source.token,
    owner: source.owner,
    repo: source.repo,
    branch: source.branch,
    path: source.path,
  };
}

function syncDraftsFromProfiles() {
  drafts.github = cloneProfile(profiles.github);
  drafts.gitee = cloneProfile(profiles.gitee);
}

function isProfileReady(profile: RepoProfile) {
  return Boolean(profile.token.trim() && profile.owner.trim() && profile.repo.trim() && profile.branch.trim());
}

function switchProvider(provider: Provider) {
  if (activeProvider.value === provider) return;
  activeProvider.value = provider;
  persistConfig();
  remoteImages.value = [];
  remoteFetched.value = false;
  errorMessage.value = '';
  if (configReady.value) {
    fetchRemoteImages({ silent: true });
  }
}

function openConfigDialog() {
  draftProvider.value = activeProvider.value;
  syncDraftsFromProfiles();
  showConfigDialog.value = true;
}

function onConfigDialogClosed() {
  syncDraftsFromProfiles();
}

function saveConfigDialog() {
  const current = drafts[draftProvider.value];
  if (!isProfileReady(current)) {
    ElMessage.warning(`请完整填写 ${draftProvider.value === 'gitee' ? 'Gitee' : 'GitHub'} 的 Token、Owner、Repo 和 Branch`);
    return;
  }

  profiles.github = {
    ...cloneProfile(drafts.github),
    token: sanitizeToken(drafts.github.token),
    owner: drafts.github.owner.trim(),
    repo: drafts.github.repo.trim(),
    branch: drafts.github.branch.trim(),
    path: drafts.github.path.trim(),
  };
  profiles.gitee = {
    ...cloneProfile(drafts.gitee),
    token: sanitizeToken(drafts.gitee.token),
    owner: drafts.gitee.owner.trim(),
    repo: drafts.gitee.repo.trim(),
    branch: drafts.gitee.branch.trim(),
    path: drafts.gitee.path.trim(),
  };

  persistConfig();
  showConfigDialog.value = false;
  remoteImages.value = [];
  remoteFetched.value = false;
  ElMessage.success('配置已保存');
  if (configReady.value) fetchRemoteImages({ silent: true });
}

function loadConfig() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as any;

    if (parsed?.profiles?.github || parsed?.profiles?.gitee) {
      activeProvider.value = parsed.activeProvider === 'gitee' ? 'gitee' : 'github';
      if (parsed.profiles.github) {
        Object.assign(profiles.github, {
          ...emptyProfile('github'),
          ...parsed.profiles.github,
          path: parsed.profiles.github.path ?? 'fromtool',
        });
      }
      if (parsed.profiles.gitee) {
        Object.assign(profiles.gitee, {
          ...emptyProfile('gitee'),
          ...parsed.profiles.gitee,
          path: parsed.profiles.gitee.path ?? 'fromtool',
        });
      }
      return;
    }

    // 兼容旧版单配置
    const provider: Provider = parsed.provider === 'gitee' ? 'gitee' : 'github';
    activeProvider.value = provider;
    Object.assign(profiles[provider], {
      token: parsed.token || '',
      owner: parsed.owner || '',
      repo: parsed.repo || '',
      branch: parsed.branch || (provider === 'gitee' ? 'master' : 'main'),
      path: parsed.path ?? 'fromtool',
    });
  } catch {
    /* ignore */
  }
}

function persistConfig() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeProvider: activeProvider.value,
      profiles: {
        github: cloneProfile(profiles.github),
        gitee: cloneProfile(profiles.gitee),
      },
    }),
  );
}

function previewUrl(item: UploadResult) {
  return item.cdn || item.raw;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function triggerFileInput() {
  if (uploading.value) return;
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) prepareFile(file);
}

function onDragEnter() {
  isDragging.value = true;
}
function onDragOver() {
  isDragging.value = true;
}
function onDragLeave() {
  isDragging.value = false;
}
function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) prepareFile(file);
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const named =
          file.name && file.name !== 'image.png'
            ? file
            : new File([file], `paste-${Date.now()}.${extFromMime(file.type)}`, {
                type: file.type,
              });
        prepareFile(named);
        ElMessage.success('已从剪贴板获取图片');
      }
      return;
    }
  }
}

function extFromMime(mime: string) {
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('png')) return 'png';
  return 'png';
}

function revokePreview() {
  if (pendingPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(pendingPreview.value);
  }
  pendingPreview.value = '';
}

function clearPending() {
  revokePreview();
  pendingFile.value = null;
  compressedInfo.value = null;
  errorMessage.value = '';
}

async function prepareFile(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }
  errorMessage.value = '';
  pendingFile.value = file;
  revokePreview();
  pendingPreview.value = URL.createObjectURL(file);
  compressedInfo.value = null;

  if (!compressEnabled.value || file.type === 'image/gif') {
    if (compressEnabled.value && file.type === 'image/gif') {
      ElMessage.info('GIF 将保留原图上传，避免丢失动画');
    }
    return;
  }

  try {
    compressedInfo.value = await compressImage(file, {
      quality: compressQuality.value,
      maxEdge: maxEdge.value,
      mime: compressFormat.value,
    });
  } catch (err) {
    console.error(err);
    ElMessage.warning('压缩失败，将上传原图');
  }
}

async function compressImage(
  file: File,
  options: { quality: number; maxEdge: number; mime: string },
): Promise<CompressedInfo> {
  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const limit = options.maxEdge > 0 ? options.maxEdge : 0;
    if (limit && Math.max(width, height) > limit) {
      const scale = limit / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 不可用');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('压缩输出失败'))),
        options.mime,
        options.quality,
      );
    });

    // 压缩后更大则保留原图
    if (blob.size >= file.size) {
      return {
        size: file.size,
        ratio: 0,
        blob: file,
        ext: extFromMime(file.type),
      };
    }

    return {
      size: blob.size,
      ratio: Math.round((1 - blob.size / file.size) * 100),
      blob,
      ext: extFromMime(options.mime),
    };
  } finally {
    bitmap.close();
  }
}

function sanitizePath(path: string) {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean)
    .join('/');
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function buildFileName(original: string, ext: string) {
  const base = original.replace(/\.[^.]+$/, '').replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'image';
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `${base}-${stamp}.${ext}`;
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsDataURL(blob);
  });
}

function sanitizeToken(raw: string) {
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/^(Bearer|token)\s+/i, '')
    .trim();
}

function formatApiError(status: number, data: any) {
  const platform = providerLabel.value;
  const rawMsg = data?.message ?? data?.error_description ?? data?.error;
  const apiMsg = Array.isArray(rawMsg)
    ? rawMsg.map(String).join('；')
    : String(rawMsg || '').trim();
  if (status === 400) {
    return [
      `请求无效（400）：${platform} 拒绝了本次请求。`,
      apiMsg ? `${platform}：${apiMsg}` : '请检查分支名、目录路径、Token 权限，或文件是否已存在。',
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (status === 401) {
    return [
      `鉴权失败（401）：${platform} Token 无效或已过期。`,
      isGitee.value
        ? '请检查私人令牌是否完整，并勾选 projects 相关权限。'
        : '请检查：① Token 是否完整；② Classic 是否勾选 repo；③ Fine-grained 是否选中目标仓库且 Contents 为 Read and write。',
      apiMsg ? `${platform}：${apiMsg}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (status === 403) {
    return [
      `无权限（403）：Token 权限不足，或触发了 ${platform} 限流。`,
      apiMsg ? `${platform}：${apiMsg}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (status === 404) {
    return [
      `未找到（404）：仓库不存在，或 Token 无权访问该仓库。`,
      `请确认 Owner / Repo / Branch 填写正确。`,
      apiMsg ? `${platform}：${apiMsg}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return apiMsg || `请求失败 (${status})`;
}

function requestHeaders(token: string): Record<string, string> {
  if (isGitee.value) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function withAccessToken(url: string, token: string) {
  if (!isGitee.value) return url;
  const u = new URL(url);
  u.searchParams.set('access_token', token);
  return u.toString();
}

function contentsApiUrl(filePath: string) {
  const owner = encodeURIComponent(activeProfile.value.owner.trim());
  const repo = encodeURIComponent(activeProfile.value.repo.trim());
  const base = isGitee.value
    ? `https://gitee.com/api/v5/repos/${owner}/${repo}/contents`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;
  const sanitized = sanitizePath(filePath);
  if (!sanitized) return base;
  return `${base}/${sanitized.split('/').map(encodeURIComponent).join('/')}`;
}

function treeApiUrl() {
  const owner = encodeURIComponent(activeProfile.value.owner.trim());
  const repo = encodeURIComponent(activeProfile.value.repo.trim());
  const branch = encodeURIComponent(activeProfile.value.branch.trim());
  return isGitee.value
    ? `https://gitee.com/api/v5/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    : `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
}

function buildPublicUrls(contentPath: string) {
  const owner = activeProfile.value.owner.trim();
  const repo = activeProfile.value.repo.trim();
  const branch = activeProfile.value.branch.trim();
  const encodedPath = sanitizePath(contentPath)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  if (isGitee.value) {
    // Gitee 防盗链较严，预览需配合 img referrerpolicy="no-referrer"
    const raw = `https://gitee.com/${owner}/${repo}/raw/${branch}/${encodedPath}`;
    return {
      cdn: raw,
      raw,
      page: `https://gitee.com/${owner}/${repo}/blob/${branch}/${encodedPath}`,
    };
  }
  return {
    cdn: `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${encodedPath}`,
    raw: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`,
    page: `https://github.com/${owner}/${repo}/blob/${branch}/${encodedPath}`,
  };
}

function onPreviewError(e: Event) {
  const img = e.target as HTMLImageElement | null;
  if (!img || img.dataset.fallbackTried === '1') return;
  const src = img.getAttribute('src') || '';
  // Gitee 偶发 raw 失败时，尝试加时间戳绕过缓存
  if (src.includes('gitee.com') && !src.includes('_t=')) {
    img.dataset.fallbackTried = '1';
    img.src = `${src}${src.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  }
}

function toRemoteItem(entry: { path: string; sha: string; size?: number; html_url?: string }): UploadResult {
  const contentPath = entry.path.replace(/^\/+/, '');
  const name = contentPath.split('/').pop() || contentPath;
  const urls = buildPublicUrls(contentPath);
  return {
    id: entry.sha || contentPath,
    name,
    path: contentPath,
    sha: entry.sha || '',
    size: entry.size,
    cdn: urls.cdn,
    raw: urls.raw,
    page: entry.html_url || urls.page,
  };
}

async function fetchRemoteImages(options: { silent?: boolean } = {}) {
  if (!configReady.value || loadingRemote.value) return;
  loadingRemote.value = true;
  if (!options.silent) errorMessage.value = '';

  try {
    const token = sanitizeToken(activeProfile.value.token);
    if (!token) throw new Error(`请先配置有效的 ${providerLabel.value} Token`);

    const dir = sanitizePath(activeProfile.value.path);
    const res = await fetch(withAccessToken(treeApiUrl(), token), {
      headers: requestHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatApiError(res.status, data));
    }

    const tree = Array.isArray(data?.tree) ? data.tree : [];
    const images = tree
      .filter((node: any) => node?.type === 'blob' && typeof node.path === 'string' && IMAGE_EXT_RE.test(node.path))
      .filter((node: any) => {
        if (!dir) return true;
        return node.path === dir || node.path.startsWith(`${dir}/`);
      })
      .map((node: any) =>
        toRemoteItem({
          path: node.path,
          sha: node.sha,
          size: node.size,
        }),
      )
      .sort((a: UploadResult, b: UploadResult) => b.name.localeCompare(a.name, 'zh'));

    remoteImages.value = images;
    remoteFetched.value = true;

    if (data?.truncated) {
      ElMessage.warning('仓库文件过多，列表可能被截断');
    } else if (!options.silent) {
      ElMessage.success(`已同步 ${images.length} 张图片`);
    }
  } catch (err: any) {
    if (!options.silent) {
      errorMessage.value = err?.message || '同步失败';
      ElMessage.error(errorMessage.value.split('\n')[0] || '同步失败');
    }
  } finally {
    loadingRemote.value = false;
  }
}

async function resolveFileSha(token: string, filePath: string, knownSha?: string) {
  if (knownSha) return knownSha;
  const url = withAccessToken(
    `${contentsApiUrl(filePath)}?ref=${encodeURIComponent(activeProfile.value.branch.trim())}`,
    token,
  );
  const res = await fetch(url, { headers: requestHeaders(token) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiError(res.status, data));
  }
  if (!data?.sha || Array.isArray(data)) {
    throw new Error('无法获取文件 sha，可能路径不正确');
  }
  return String(data.sha);
}

async function uploadImage() {
  if (!pendingFile.value || !configReady.value) return;
  uploading.value = true;
  errorMessage.value = '';

  try {
    const token = sanitizeToken(activeProfile.value.token);
    if (!token) {
      throw new Error(`请先配置有效的 ${providerLabel.value} Token`);
    }

    const sourceBlob = compressedInfo.value?.blob || pendingFile.value;
    const ext = compressedInfo.value?.ext || extFromMime(pendingFile.value.type);
    const fileName = buildFileName(pendingFile.value.name, ext);
    const dir = sanitizePath(activeProfile.value.path);
    const contentPath = dir ? `${dir}/${fileName}` : fileName;
    const contentBase64 = await fileToBase64(sourceBlob);

    const body: Record<string, string> = {
      message: `upload image: ${fileName}`,
      content: contentBase64,
      branch: activeProfile.value.branch.trim(),
    };
    if (isGitee.value) body.access_token = token;

    // Gitee：新建用 POST；GitHub：PUT
    const method = isGitee.value ? 'POST' : 'PUT';
    const res = await fetch(withAccessToken(contentsApiUrl(contentPath), token), {
      method,
      headers: requestHeaders(token),
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatApiError(res.status, data));
    }

    const urls = buildPublicUrls(contentPath);
    const result: UploadResult = {
      id: String(data?.content?.sha || Date.now()),
      name: fileName,
      path: contentPath,
      sha: String(data?.content?.sha || ''),
      size: sourceBlob.size,
      cdn: urls.cdn,
      raw: urls.raw,
      page: data?.content?.html_url || urls.page,
    };
    remoteImages.value = [result, ...remoteImages.value.filter(i => i.path !== result.path)];
    remoteFetched.value = true;
    clearPending();
    ElMessage.success('上传成功');
  } catch (err: any) {
    errorMessage.value = err?.message || '上传失败';
    ElMessage.error(errorMessage.value.split('\n')[0] || '上传失败');
  } finally {
    uploading.value = false;
  }
}

async function deleteImage(item: UploadResult) {
  if (!configReady.value || deletingId.value) return;

  try {
    await ElMessageBox.confirm(
      `确认从仓库删除「${item.name}」？此操作不可撤销。`,
      '删除图片',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    );
  } catch {
    return;
  }

  deletingId.value = item.id;
  errorMessage.value = '';

  try {
    const token = sanitizeToken(activeProfile.value.token);
    if (!token) throw new Error(`请先配置有效的 ${providerLabel.value} Token`);

    const sha = await resolveFileSha(token, item.path, item.sha);
    const body: Record<string, string> = {
      message: `delete image: ${item.name}`,
      sha,
      branch: activeProfile.value.branch.trim(),
    };
    if (isGitee.value) body.access_token = token;

    const res = await fetch(withAccessToken(contentsApiUrl(item.path), token), {
      method: 'DELETE',
      headers: requestHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatApiError(res.status, data));
    }

    remoteImages.value = remoteImages.value.filter(h => h.path !== item.path);
    ElMessage.success('已从仓库删除');
  } catch (err: any) {
    errorMessage.value = err?.message || '删除失败';
    ElMessage.error(errorMessage.value.split('\n')[0] || '删除失败');
  } finally {
    deletingId.value = '';
  }
}

async function copyText(text: string, tip = '已复制') {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage({
      message: tip,
      type: 'success',
      duration: 1200,
      showClose: false,
      grouping: true,
    });
  } catch {
    ElMessage.error('复制失败');
  }
}

function preferredEmbedUrl(item: UploadResult) {
  // GitHub 优先 jsDelivr；Gitee 用 Raw
  return isGitee.value ? item.raw : item.cdn || item.raw;
}

function toMarkdownImage(item: UploadResult) {
  const alt = item.name.replace(/\.[^.]+$/, '') || item.name;
  return `![${alt}](${preferredEmbedUrl(item)})`;
}

function copyItemLink(item: UploadResult, type: LinkKey) {
  const label = linkTypeOptions.value.find(opt => opt.key === type)?.label || type;
  if (type === 'markdown') {
    copyText(toMarkdownImage(item), `已复制 ${label}`);
    return;
  }
  copyText(item[type], `已复制 ${label}`);
}
</script>

<style scoped>
.github-image-host :deep(.input),
.github-image-host :deep(.select) {
  border-width: 0;
  outline: none;
  box-shadow: none;
}

.github-image-host :deep(.input:focus),
.github-image-host :deep(.select:focus) {
  outline: 2px solid color-mix(in oklab, var(--color-primary) 35%, transparent);
  outline-offset: 0;
}

.remote-table :deep(th),
.remote-table :deep(td) {
  border-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  background-color: transparent;
}

.remote-table :deep(thead tr) {
  background: color-mix(in oklab, var(--color-base-content) 4%, transparent);
}

.remote-table :deep(tbody tr:hover) {
  background: color-mix(in oklab, var(--color-base-content) 5%, transparent);
}

.remote-table :deep(.table) {
  --fallback-b2: transparent;
}
</style>

<style>
/* el-dialog 挂到 body，需非 scoped */
.github-host-config-dialog.el-dialog {
  border: none;
  border-radius: 1rem;
  background: color-mix(in oklab, var(--color-base-100) 96%, transparent);
  box-shadow: 0 16px 48px -16px rgb(0 0 0 / 0.55);
}

.github-host-config-dialog .el-dialog__header {
  border-bottom: none;
  margin-right: 0;
  padding-bottom: 0.5rem;
}

.github-host-config-dialog .el-dialog__footer {
  border-top: none;
  padding-top: 0.5rem;
}

.github-host-config-dialog .input,
.github-host-config-dialog .select {
  border-width: 0;
  box-shadow: none;
}

.github-host-config-dialog .input:focus,
.github-host-config-dialog .select:focus {
  outline: 2px solid color-mix(in oklab, var(--color-primary) 35%, transparent);
}
</style>
