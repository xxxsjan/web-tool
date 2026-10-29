import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  Excalidraw,
  exportToBlob,
  exportToSvg,
  loadFromBlob,
  serializeAsJSON,
} from '@excalidraw/excalidraw';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'web-tool-whiteboard-excalidraw';
const EMPTY_HINT = '画布上还没有内容';
const INVALID_FILE_HINT = '不是有效的 .excalidraw 草稿文件';
const SAVE_DEBOUNCE_MS = 400;

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

function getExportableElements(api: ExcalidrawImperativeAPI) {
  const elements = api.getSceneElements().filter((el) => !el.isDeleted);
  if (!elements.length) throw new Error(EMPTY_HINT);
  return elements;
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
    createElement(Excalidraw, {
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
        api = instance;
        notifyReady();
      },
      onChange: (elements, appState, files) => {
        scheduleSave(elements, appState, files);
      },
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
