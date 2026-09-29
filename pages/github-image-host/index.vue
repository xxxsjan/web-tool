<template>
  <div class="github-image-host mx-auto w-full max-w-5xl px-3 pb-12 sm:px-4">
    <header class="mb-4 text-center sm:mb-5">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-2xl">
        Git 图床
      </h1>
      <p class="text-xs text-base-content/50">
        Ctrl+V 粘贴上传 · 右键复制外链
      </p>
    </header>

    <section
      class="fm-panel flex min-h-[min(72vh,720px)] flex-col overflow-hidden rounded-2xl tool-panel"
      :class="isDragging ? 'ring-2 ring-primary/50' : ''"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- 工具栏：平台 + 操作 -->
      <div class="fm-toolbar flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
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
        <div class="flex shrink-0 gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-sm bg-base-content/5 hover:bg-base-content/10"
            :disabled="!configReady || loadingRemote"
            @click="fetchRemoteImages"
          >
            <span v-if="loadingRemote" class="loading loading-spinner loading-xs"></span>
            {{ loadingRemote ? '刷新中' : '刷新' }}
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm bg-base-content/5 hover:bg-base-content/10"
            @click="openConfigDialog"
          >
            {{ configReady ? '配置' : '去配置' }}
          </button>
        </div>
      </div>

      <!-- 地址栏 -->
      <div class="fm-pathbar px-3 py-2 sm:px-4">
        <div
          v-if="!configReady"
          class="fm-path-box rounded-lg px-3 py-2 text-xs text-base-content/50"
        >
          尚未配置仓库，请先点击「去配置」
        </div>
        <div
          v-else
          class="fm-path-box flex items-center gap-2 rounded-lg px-2.5 py-1.5"
        >
          <span class="shrink-0 text-xs text-base-content/50">路径</span>
          <span class="hidden shrink-0 font-mono text-xs text-base-content/60 sm:inline">
            {{ activeProfile.owner }}/{{ activeProfile.repo }}@{{ activeProfile.branch }}/
          </span>
          <input
            v-model="pathDraft"
            type="text"
            class="input input-xs h-7 min-w-0 flex-1 bg-transparent px-1 font-mono text-xs"
            placeholder="目录（空为根目录）"
            title="当前目录，回车或失焦保存"
            @change="commitPathEdit"
            @keydown.enter.prevent="blurPathInput"
          />
          <span class="shrink-0 text-[11px] text-base-content/40">
            {{ remoteFetched ? `${remoteImages.length} 项` : '—' }}
          </span>
        </div>
      </div>

      <!-- 次级工具：压缩 + 粘贴提示 / 待上传 -->
      <div
        class="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto px-3 py-2 sm:px-4"
      >
        <div
          class="flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap text-xs"
        >
          <label
            class="flex shrink-0 cursor-pointer items-center gap-1.5 text-base-content/70"
          >
            <input
              v-model="compressEnabled"
              type="checkbox"
              class="toggle toggle-xs toggle-primary"
            />
            压缩
          </label>
          <template v-if="compressEnabled">
            <label
              class="flex shrink-0 items-center gap-1 text-base-content/50"
            >
              {{ Math.round(compressQuality * 100) }}%
              <input
                v-model.number="compressQuality"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                class="range range-primary range-xs w-16"
              />
            </label>
            <span class="shrink-0 text-base-content/50">最大边</span>
            <input
              v-model.number="maxEdge"
              type="number"
              min="0"
              step="100"
              class="input input-xs h-7 w-16 shrink-0 bg-base-200/60"
              title="最大边，0 不限制"
            />
            <span class="shrink-0 text-base-content/50">格式</span>
            <select
              v-model="compressFormat"
              class="select select-xs h-7 min-h-7 w-auto shrink-0 bg-base-200/60"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
              <option value="image/png">PNG</option>
            </select>
          </template>
        </div>
        <p class="shrink-0 whitespace-nowrap text-[11px] text-base-content/40">
          {{ isDragging ? '松开以上传到当前目录' : 'Ctrl+V 粘贴到当前目录' }}
        </p>
      </div>

      <!-- 待上传条 -->
      <div
        v-if="pendingFile"
        class="mx-3 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 sm:mx-4"
      >
        <div class="relative h-10 w-10 shrink-0">
          <img
            v-if="pendingPreview"
            :src="pendingPreview"
            alt=""
            class="h-10 w-10 rounded object-cover"
            :class="{ 'opacity-50': compressing || uploading }"
          />
          <div
            v-if="compressing || uploading"
            class="absolute inset-0 flex items-center justify-center rounded bg-base-300/50"
          >
            <span class="loading loading-spinner loading-xs text-primary"></span>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-base-content">
            {{ pendingFile.name }}
          </p>
          <p class="text-[11px] text-base-content/50">
            <template v-if="compressing">正在压缩…</template>
            <template v-else-if="uploading">正在上传…</template>
            <template v-else>
              {{ formatBytes(pendingFile.size) }}
              <template v-if="compressedInfo">
                → {{ formatBytes(compressedInfo.size) }}
                <span class="text-success">(−{{ compressedInfo.ratio }}%)</span>
              </template>
            </template>
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-xs"
          :disabled="uploading || compressing || !configReady"
          @click="uploadImage"
        >
          <span
            v-if="uploading"
            class="loading loading-spinner loading-xs"
          ></span>
          {{ uploading ? '上传中' : '上传' }}
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          :disabled="uploading || compressing"
          @click="clearPending"
        >
          取消
        </button>
      </div>

      <div
        v-if="errorMessage"
        class="mx-3 mb-2 whitespace-pre-line rounded-lg bg-error/10 px-3 py-2 text-xs text-error sm:mx-4"
      >
        {{ errorMessage }}
      </div>

      <!-- 内容区 -->
      <div class="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-4">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        />

        <div
          v-if="loadingRemote && !remoteImages.length"
          class="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-base-content/45"
        >
          <span class="loading loading-spinner loading-md text-primary"></span>
          <p>正在加载仓库图片…</p>
        </div>
        <div
          v-else-if="!configReady"
          class="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-base-content/45"
        >
          <p>请先配置仓库</p>
          <button type="button" class="btn btn-primary btn-sm" @click="openConfigDialog">
            去配置
          </button>
        </div>
        <div
          v-else-if="remoteFetched && !remoteImages.length"
          class="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-sm text-base-content/45"
        >
          <p>当前目录为空</p>
          <p class="text-xs text-base-content/35">Ctrl+V 粘贴图片即可上传</p>
          <button
            type="button"
            class="btn btn-ghost btn-xs bg-base-content/5"
            @click="triggerFileInput"
          >
            或选择文件
          </button>
        </div>
        <div
          v-else-if="!remoteFetched"
          class="flex h-full min-h-[240px] items-center justify-center text-sm text-base-content/45"
        >
          点击「刷新」加载当前目录
        </div>
        <ul
          v-else
          class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          :class="{ 'opacity-50 pointer-events-none': loadingRemote }"
        >
          <li
            v-for="item in remoteImages"
            :key="item.path"
            class="fm-card overflow-hidden rounded-xl transition-colors"
          >
            <div
              class="aspect-square cursor-context-menu bg-base-200/40"
              @contextmenu.prevent="openImageMenu($event, item)"
            >
              <img
                :src="previewUrl(item)"
                :alt="item.name"
                class="h-full w-full object-cover"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="onPreviewError"
              />
            </div>
            <div class="space-y-0.5 px-2 py-2">
              <p class="truncate text-xs font-medium text-base-content" :title="item.name">
                {{ item.name }}
              </p>
              <p class="text-[10px] text-base-content/40">
                {{ item.size ? formatBytes(item.size) : '—' }}
              </p>
            </div>
          </li>
        </ul>

        <div
          v-if="loadingRemote && remoteImages.length"
          class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-base-100/55 backdrop-blur-[1px]"
        >
          <div
            class="flex items-center gap-2 rounded-full border border-app bg-base-100/95 px-4 py-2 text-sm text-base-content/70 shadow-md"
          >
            <span class="loading loading-spinner loading-sm text-primary"></span>
            刷新中…
          </div>
        </div>

        <div
          v-if="isDragging"
          class="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-xl bg-primary/15 text-sm font-medium text-primary"
        >
          松开以上传到当前目录
        </div>
      </div>
    </section>

    <!-- 图片右键菜单 -->
    <teleport to="body">
      <div
        v-if="imageMenu.visible"
        class="image-ctx-menu fixed z-[4000] min-w-[11rem] overflow-hidden rounded-xl bg-base-100 py-1 shadow-xl"
        :style="{ left: `${imageMenu.x}px`, top: `${imageMenu.y}px` }"
        @click.stop
      >
        <button
          type="button"
          class="flex w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-content/8"
          @click="onMenuOpenImage"
        >
          打开这个图片
        </button>
        <div class="my-1 h-px bg-base-content/8"></div>
        <button
          v-for="opt in linkTypeOptions"
          :key="opt.key"
          type="button"
          class="flex w-full px-3 py-2 text-left text-sm text-base-content hover:bg-base-content/8"
          @click="onMenuCopyLink(opt.key)"
        >
          复制{{ opt.label }}
        </button>
        <div class="my-1 h-px bg-base-content/8"></div>
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-error/10 disabled:opacity-50"
          :disabled="!imageMenu.item || deletingId === imageMenu.item.id || !configReady"
          @click="onMenuDelete"
        >
          <span
            v-if="imageMenu.item && deletingId === imageMenu.item.id"
            class="loading loading-spinner loading-xs"
          ></span>
          {{
            imageMenu.item && deletingId === imageMenu.item.id
              ? '删除中…'
              : '删除'
          }}
        </button>
      </div>
    </teleport>

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
          <p class="mb-1.5 text-xs text-base-content/60">
            配置平台（两套配置互不影响）
          </p>
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
          <span class="mb-1 text-xs text-base-content/60">{{
            tokenFieldLabel
          }}</span>
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
        <p
          class="sm:col-span-2 text-[11px] leading-relaxed text-base-content/40"
        >
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
          <button
            type="button"
            class="btn btn-primary btn-sm"
            @click="saveConfigDialog"
          >
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
  group: '工具',
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
const compressFormat = ref<'image/webp' | 'image/jpeg' | 'image/png'>(
  'image/jpeg',
);

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const pendingFile = ref<File | null>(null);
const pendingPreview = ref('');
const compressedInfo = ref<CompressedInfo | null>(null);
const uploading = ref(false);
const compressing = ref(false);
const loadingRemote = ref(false);
const remoteFetched = ref(false);
const deletingId = ref('');
const errorMessage = ref('');
const remoteImages = ref<UploadResult[]>([]);
const imageMenu = reactive<{
  visible: boolean;
  x: number;
  y: number;
  item: UploadResult | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  item: null,
});

const activeProfile = computed(() => profiles[activeProvider.value]);
const isGitee = computed(() => activeProvider.value === 'gitee');
const providerLabel = computed(() => (isGitee.value ? 'Gitee' : 'GitHub'));
const pathDraft = ref('fromtool');

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
  return Boolean(
    p.token.trim() && p.owner.trim() && p.repo.trim() && p.branch.trim(),
  );
});

onMounted(() => {
  loadConfig();
  pathDraft.value = profiles[activeProvider.value].path;
  if (!configReady.value) {
    showConfigDialog.value = true;
    draftProvider.value = activeProvider.value;
    syncDraftsFromProfiles();
  } else {
    fetchRemoteImages({ silent: true });
  }
  window.addEventListener('paste', onPaste);
  window.addEventListener('click', closeImageMenu);
  window.addEventListener('scroll', closeImageMenu, true);
  window.addEventListener('keydown', onGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('click', closeImageMenu);
  window.removeEventListener('scroll', closeImageMenu, true);
  window.removeEventListener('keydown', onGlobalKeydown);
  revokePreview();
});

watch(activeProvider, () => {
  pathDraft.value = profiles[activeProvider.value].path;
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
  return Boolean(
    profile.token.trim() &&
    profile.owner.trim() &&
    profile.repo.trim() &&
    profile.branch.trim(),
  );
}

function switchProvider(provider: Provider) {
  if (activeProvider.value === provider) return;
  activeProvider.value = provider;
  pathDraft.value = profiles[provider].path;
  persistConfig();
  remoteImages.value = [];
  remoteFetched.value = false;
  errorMessage.value = '';
  if (configReady.value) {
    fetchRemoteImages({ silent: true });
  }
}

function blurPathInput(e: KeyboardEvent) {
  (e.target as HTMLInputElement | null)?.blur();
}

function commitPathEdit() {
  const next = sanitizePath(pathDraft.value);
  pathDraft.value = next;
  if (profiles[activeProvider.value].path === next) return;
  profiles[activeProvider.value].path = next;
  drafts[activeProvider.value].path = next;
  persistConfig();
  remoteImages.value = [];
  remoteFetched.value = false;
  if (configReady.value) {
    fetchRemoteImages({ silent: true });
  }
  ElMessage({
    message: next ? `目录已切换为 ${next}` : '目录已切换为仓库根目录',
    type: 'success',
    duration: 1200,
    showClose: false,
  });
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
    ElMessage.warning(
      `请完整填写 ${draftProvider.value === 'gitee' ? 'Gitee' : 'GitHub'} 的 Token、Owner、Repo 和 Branch`,
    );
    return;
  }

  profiles.github = {
    ...cloneProfile(drafts.github),
    token: sanitizeToken(drafts.github.token),
    owner: drafts.github.owner.trim(),
    repo: drafts.github.repo.trim(),
    branch: drafts.github.branch.trim(),
    path: sanitizePath(drafts.github.path),
  };
  profiles.gitee = {
    ...cloneProfile(drafts.gitee),
    token: sanitizeToken(drafts.gitee.token),
    owner: drafts.gitee.owner.trim(),
    repo: drafts.gitee.repo.trim(),
    branch: drafts.gitee.branch.trim(),
    path: sanitizePath(drafts.gitee.path),
  };

  pathDraft.value = profiles[activeProvider.value].path;
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
      activeProvider.value =
        parsed.activeProvider === 'gitee' ? 'gitee' : 'github';
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
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
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
const prefix = 'fromtool';
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
            : new File(
                [file],
                `${prefix}-${Date.now()}.${extFromMime(file.type)}`,
                {
                  type: file.type,
                },
              );
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
  compressing.value = false;
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

  compressing.value = true;
  try {
    compressedInfo.value = await compressImage(file, {
      quality: compressQuality.value,
      maxEdge: maxEdge.value,
      mime: compressFormat.value,
    });
  } catch (err) {
    console.error(err);
    ElMessage.warning('压缩失败，将上传原图');
  } finally {
    compressing.value = false;
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
  const base =
    original.replace(/\.[^.]+$/, '').replace(/[^\w\u4e00-\u9fff-]+/g, '_') ||
    'image';
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
      apiMsg
        ? `${platform}：${apiMsg}`
        : '请检查分支名、目录路径、Token 权限，或文件是否已存在。',
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

function toRemoteItem(entry: {
  path: string;
  sha: string;
  size?: number;
  html_url?: string;
}): UploadResult {
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
      .filter(
        (node: any) =>
          node?.type === 'blob' &&
          typeof node.path === 'string' &&
          IMAGE_EXT_RE.test(node.path),
      )
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
      .sort((a: UploadResult, b: UploadResult) =>
        b.name.localeCompare(a.name, 'zh'),
      );

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

async function resolveFileSha(
  token: string,
  filePath: string,
  knownSha?: string,
) {
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
    const ext =
      compressedInfo.value?.ext || extFromMime(pendingFile.value.type);
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
    const res = await fetch(
      withAccessToken(contentsApiUrl(contentPath), token),
      {
        method,
        headers: requestHeaders(token),
        body: JSON.stringify(body),
      },
    );

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
    remoteImages.value = [
      result,
      ...remoteImages.value.filter(i => i.path !== result.path),
    ];
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
  const label =
    linkTypeOptions.value.find(opt => opt.key === type)?.label || type;
  if (type === 'markdown') {
    copyText(toMarkdownImage(item), `已复制 ${label}`);
    return;
  }
  copyText(item[type], `已复制 ${label}`);
}

function closeImageMenu() {
  imageMenu.visible = false;
  imageMenu.item = null;
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeImageMenu();
}

function openImageMenu(e: MouseEvent, item: UploadResult) {
  const menuWidth = 180;
  const menuHeight = 44 + linkTypeOptions.value.length * 36 + 48;
  const maxX = window.innerWidth - menuWidth - 8;
  const maxY = window.innerHeight - menuHeight - 8;
  imageMenu.item = item;
  imageMenu.x = Math.max(8, Math.min(e.clientX, maxX));
  imageMenu.y = Math.max(8, Math.min(e.clientY, maxY));
  imageMenu.visible = true;
}

function onMenuOpenImage() {
  const item = imageMenu.item;
  closeImageMenu();
  if (!item) return;
  window.open(preferredEmbedUrl(item), '_blank', 'noopener,noreferrer');
}

function onMenuCopyLink(type: LinkKey) {
  const item = imageMenu.item;
  closeImageMenu();
  if (!item) return;
  copyItemLink(item, type);
}

function onMenuDelete() {
  const item = imageMenu.item;
  closeImageMenu();
  if (!item) return;
  deleteImage(item);
}
</script>

<style scoped>
.github-image-host {
  --fm-border: color-mix(in oklab, var(--color-base-content) 22%, transparent);
  --fm-border-strong: color-mix(in oklab, var(--color-base-content) 32%, transparent);
}

.github-image-host :deep(.fm-panel.tool-panel) {
  border: 1px solid var(--fm-border-strong);
}

.fm-toolbar {
  border-bottom: 1px solid var(--fm-border);
}

.fm-pathbar {
  border-bottom: 1px solid var(--fm-border);
}

.fm-path-box {
  border: 1px solid var(--fm-border-strong);
  background: color-mix(in oklab, var(--color-base-200) 70%, transparent);
}

.fm-card {
  border: 1px solid var(--fm-border);
  background: color-mix(in oklab, var(--color-base-content) 3%, transparent);
}

.fm-card:hover {
  border-color: var(--fm-border-strong);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.github-image-host :deep(.input),
.github-image-host :deep(.select) {
  border-width: 0;
  outline: none;
  box-shadow: none;
}

.github-image-host :deep(.input:focus),
.github-image-host :deep(.select:focus) {
  outline: 2px solid color-mix(in oklab, var(--color-primary) 40%, transparent);
  outline-offset: 0;
}
</style>

<style>
.image-ctx-menu {
  border: 1px solid color-mix(in oklab, var(--color-base-content) 22%, transparent);
  backdrop-filter: blur(10px);
  background: color-mix(in oklab, var(--color-base-100) 96%, transparent);
  box-shadow: 0 12px 36px -12px rgb(0 0 0 / 0.55);
}

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
