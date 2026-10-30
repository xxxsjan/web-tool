import { createElement, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  Excalidraw,
  exportToBlob,
  exportToSvg,
  FONT_FAMILY,
  loadFromBlob,
  serializeAsJSON,
  useHandleLibrary,
} from '@excalidraw/excalidraw';
// Fonts 由 vite-plugins/excalidraw-export-fonts 补进公开导出；官方 .d.ts 仍未声明
// @ts-expect-error TS2305 — Fonts is not in public typings
import { Fonts as ExcalidrawFonts } from '@excalidraw/excalidraw';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'web-tool-whiteboard-excalidraw';
/** 个人素材库 IndexedDB */
const LIBRARY_DB = 'web-tool-excalidraw-library';
const LIBRARY_STORE = 'library';
const LIBRARY_KEY = 'libraryItems';
const EMPTY_HINT = '画布上还没有内容';
const INVALID_FILE_HINT = '不是有效的 .excalidraw 草稿文件';
const SAVE_DEBOUNCE_MS = 400;

/** Excalidraw 预留槽 4；10 起为自增自定义字体 */
const YAHEI_FONT_ID = 4;
const YAHEI_BOLD_FONT_ID = 10;
const YAHEI_FONT_NAME = '微软雅黑';
const YAHEI_BOLD_FONT_NAME = '微软雅黑 粗体';

const YAHEI_METRICS = {
  unitsPerEm: 2048,
  ascender: 1854,
  descender: -434,
  lineHeight: 1.25,
} as const;

type FontsRegisterAPI = {
  register: (
    family: string,
    metadata: {
      metrics: {
        unitsPerEm: number;
        ascender: number;
        descender: number;
        lineHeight: number;
      };
      local?: boolean;
    },
    ...fontFaces: Array<{ uri: string; descriptors?: FontFaceDescriptors }>
  ) => unknown;
};

let yaHeiFontReady = false;

/**
 * Excalidraw 画布字体串不含 font-weight，粗体需独立 family。
 * 用 @font-face + local() 把「微软雅黑 粗体」映射到系统 Bold 字面。
 */
function ensureYaHeiFontFaceCss() {
  const STYLE_ID = 'web-tool-excalidraw-yahei-faces';
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face {
      font-family: '${YAHEI_BOLD_FONT_NAME}';
      src: local('Microsoft YaHei Bold'), local('微软雅黑');
      font-weight: 700;
      font-style: normal;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 注册系统字体「微软雅黑」与「微软雅黑 粗体」进 Excalidraw 字体列表。
 */
function ensureMicrosoftYaHeiFont() {
  if (yaHeiFontReady) return;

  const Fonts = ExcalidrawFonts as FontsRegisterAPI | undefined;
  if (typeof Fonts?.register !== 'function') {
    console.warn('Excalidraw Fonts API 不可用，跳过微软雅黑注册（可尝试清缓存后重启 dev）');
    return;
  }

  yaHeiFontReady = true;
  ensureYaHeiFontFaceCss();

  const families = FONT_FAMILY as Record<string, number>;
  if (families[YAHEI_FONT_NAME] == null) {
    families[YAHEI_FONT_NAME] = YAHEI_FONT_ID;
  }
  if (families[YAHEI_BOLD_FONT_NAME] == null) {
    families[YAHEI_BOLD_FONT_NAME] = YAHEI_BOLD_FONT_ID;
  }

  const localMeta = { metrics: { ...YAHEI_METRICS }, local: true };

  try {
    Fonts.register(YAHEI_FONT_NAME, localMeta, { uri: 'local:' });
    Fonts.register(YAHEI_BOLD_FONT_NAME, localMeta, {
      uri: 'local:',
      descriptors: { weight: '700' },
    });
  } catch (error) {
    yaHeiFontReady = false;
    console.warn('注册微软雅黑失败', error);
  }
}

export type BoardApi = {
  getSvg: () => Promise<string | undefined>;
  getPng: () => Promise<Blob | undefined>;
  /** 导出 .excalidraw 草稿文件（含图片等资源） */
  getDraftFile: () => Promise<Blob | undefined>;
  /** 导入 .excalidraw 草稿文件，成功返回 true */
  loadDraftFile: (file: File) => Promise<boolean>;
  resetZoom: () => void;
};

export type BoardHandle = {
  api: BoardApi;
  destroy: () => void;
};

export type MountBoardOptions = {
  onReady?: () => void;
};

type PersistedScene = {
  elements: ExcalidrawInitialDataState['elements'];
  appState?: Partial<AppState>;
  files?: BinaryFiles;
};

function readPersistedScene(): ExcalidrawInitialDataState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedScene;
    if (!data || !Array.isArray(data.elements)) return null;
    // collaborators 是 Map，JSON 回来会变成普通对象，必须重置
    const appState = {
      ...(data.appState || {}),
      collaborators: new Map(),
    } as Partial<AppState>;
    return {
      elements: data.elements,
      appState,
      files: data.files || {},
    };
  } catch (error) {
    console.warn('读取本地画板草稿失败', error);
    return null;
  }
}

function persistScene(
  elements: readonly unknown[],
  appState: AppState,
  files: BinaryFiles,
) {
  try {
    const { collaborators: _collaborators, ...safeAppState } = appState;
    const payload: PersistedScene = {
      elements: elements as ExcalidrawInitialDataState['elements'],
      appState: safeAppState as Partial<AppState>,
      files,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('保存本地画板草稿失败', error);
  }
}

function openLibraryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LIBRARY_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
        db.createObjectStore(LIBRARY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('打开素材库失败'));
  });
}

/** Excalidraw 个人素材库持久化（本机 IndexedDB） */
const libraryAdapter = {
  async load(_metadata: { source: 'load' | 'save' }) {
    try {
      const db = await openLibraryDb();
      return await new Promise<{ libraryItems: unknown } | null>((resolve, reject) => {
        const tx = db.transaction(LIBRARY_STORE, 'readonly');
        const req = tx.objectStore(LIBRARY_STORE).get(LIBRARY_KEY);
        req.onsuccess = () => {
          const value = req.result;
          if (value?.libraryItems) {
            resolve({ libraryItems: value.libraryItems });
          } else if (Array.isArray(value)) {
            resolve({ libraryItems: value });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      console.warn('读取本地素材库失败', error);
      return null;
    }
  },
  async save(libraryData: { libraryItems: unknown }) {
    try {
      const db = await openLibraryDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(LIBRARY_STORE, 'readwrite');
        tx.objectStore(LIBRARY_STORE).put(libraryData, LIBRARY_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('素材库保存中断'));
      });
    } catch (error) {
      console.warn('保存本地素材库失败', error);
    }
  },
};

function getExportableElements(api: ExcalidrawImperativeAPI) {
  const elements = api.getSceneElements().filter((el) => !el.isDeleted);
  if (!elements.length) throw new Error(EMPTY_HINT);
  return elements;
}

type BoardRootProps = {
  initialData: ExcalidrawInitialDataState | null;
  onApi: (api: ExcalidrawImperativeAPI) => void;
  onChange: (
    elements: readonly unknown[],
    appState: AppState,
    files: BinaryFiles,
  ) => void;
};

/** 包一层 React 组件，以便使用 useHandleLibrary 持久化素材库 */
function BoardRoot({ initialData, onApi, onChange }: BoardRootProps): ReactElement {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  useHandleLibrary({
    excalidrawAPI,
    adapter: libraryAdapter as never,
  });

  return createElement(Excalidraw, {
    langCode: 'zh-CN',
    theme: 'light',
    autoFocus: true,
    initialData: initialData || undefined,
    UIOptions: {
      canvasActions: {
        // 顶栏已有导出/导入，隐藏内置「另存为」以免重复
        export: false,
        loadScene: false,
        saveToActiveFile: false,
      },
    },
    excalidrawAPI: (instance: ExcalidrawImperativeAPI) => {
      setExcalidrawAPI(instance);
      onApi(instance);
    },
    onChange: (elements, appState, files) => {
      onChange(elements, appState, files);
    },
  });
}

/** 精简素材库侧栏：去掉官方外链与空的 Excalidraw 分区 */
function ensureLibraryUiTweaks(scope: HTMLElement) {
  const STYLE_ID = 'web-tool-excalidraw-library-tweaks';
  const css = `
    .library-menu-browse-button {
      display: none !important;
    }
    .library-menu-items-container__header--excal,
    .library-menu-items-container__header--excal + * {
      display: none !important;
    }
  `;
  let style = scope.ownerDocument.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = scope.ownerDocument.createElement('style');
    style.id = STYLE_ID;
    scope.ownerDocument.head.appendChild(style);
  }
  style.textContent = css;
}

/**
 * 在指定 DOM 容器中挂载 Excalidraw（React 组件）。
 * 用 createElement 代替 JSX，避免污染 Nuxt 的 Vue tsconfig。
 *
 * 注意：不要把 React root 直接建在会被 Vue patch 的空节点上。
 * 这里再插一层纯 DOM 子节点，配合页面上 host 的 v-once，避免 Vue 重渲染清掉画布。
 */
export function mountBoard(container: HTMLElement, options: MountBoardOptions = {}): BoardHandle {
  let api: ExcalidrawImperativeAPI | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let readyNotified = false;

  ensureMicrosoftYaHeiFont();
  ensureLibraryUiTweaks(container);

  const mountEl = document.createElement('div');
  mountEl.style.width = '100%';
  mountEl.style.height = '100%';
  mountEl.style.position = 'relative';
  container.replaceChildren(mountEl);

  const root: Root = createRoot(mountEl);
  const initialData = readPersistedScene();

  const notifyReady = () => {
    if (readyNotified) return;
    readyNotified = true;
    options.onReady?.();
  };

  const scheduleSave = (
    elements: readonly unknown[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persistScene(elements, appState, files);
    }, SAVE_DEBOUNCE_MS);
  };

  root.render(
    createElement(BoardRoot, {
      initialData,
      onApi: (instance) => {
        api = instance;
        notifyReady();
      },
      onChange: scheduleSave,
    }),
  );

  // initialData 为空时也尽快去掉「加载中」
  queueMicrotask(notifyReady);

  const boardApi: BoardApi = {
    async getSvg() {
      if (!api) return undefined;
      const elements = getExportableElements(api);
      const svg = await exportToSvg({
        elements,
        appState: {
          ...api.getAppState(),
          exportBackground: true,
          exportWithDarkMode: false,
        },
        files: api.getFiles(),
        exportPadding: 16,
      });
      return new XMLSerializer().serializeToString(svg);
    },
    async getPng() {
      if (!api) return undefined;
      const elements = getExportableElements(api);
      return exportToBlob({
        elements,
        appState: {
          ...api.getAppState(),
          exportBackground: true,
          exportWithDarkMode: false,
        },
        files: api.getFiles(),
        mimeType: 'image/png',
        exportPadding: 16,
      });
    },
    async getDraftFile() {
      if (!api) return undefined;
      const elements = api.getSceneElementsIncludingDeleted();
      if (!api.getSceneElements().some((el) => !el.isDeleted)) {
        throw new Error(EMPTY_HINT);
      }
      const json = serializeAsJSON(elements, api.getAppState(), api.getFiles(), 'local');
      return new Blob([json], { type: 'application/vnd.excalidraw+json' });
    },
    async loadDraftFile(file: File) {
      if (!api) return false;
      try {
        const scene = await loadFromBlob(file, null, null);
        api.updateScene({
          elements: scene.elements,
          appState: {
            ...(scene.appState || {}),
            collaborators: new Map(),
          },
        });
        const files = scene.files || {};
        const fileList = Object.values(files);
        if (fileList.length) api.addFiles(fileList);
        api.history.clear();
        api.scrollToContent(api.getSceneElements(), {
          fitToContent: true,
          animate: true,
        });
        persistScene(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
        return true;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`${INVALID_FILE_HINT}（${detail}）`);
      }
    },
    resetZoom() {
      if (!api) return;
      const elements = api.getSceneElements();
      if (!elements.length) {
        api.resetScene();
        return;
      }
      api.scrollToContent(elements, {
        fitToContent: true,
        animate: true,
      });
    },
  };

  return {
    api: boardApi,
    destroy: () => {
      if (saveTimer) clearTimeout(saveTimer);
      // 卸载前再落盘一次，避免短时编辑丢失
      if (api) {
        try {
          persistScene(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles());
        } catch {
          // ignore
        }
      }
      root.unmount();
      mountEl.remove();
      api = null;
    },
  };
}
