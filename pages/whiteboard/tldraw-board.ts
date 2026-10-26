import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  buildFromV1Document,
  Editor,
  parseTldrawJsonFile,
  serializeTldrawJsonBlob,
  transact,
  Tldraw,
} from 'tldraw';
import 'tldraw/tldraw.css';

export type BoardApi = {
  getSvg: () => Promise<string | undefined>;
  getPng: () => Promise<Blob | undefined>;
  /** 导出 .tldr 草稿文件（含图片等资源） */
  getDraftFile: () => Promise<Blob | undefined>;
  /** 导入 .tldr 草稿文件，成功返回 true */
  loadDraftFile: (file: File) => Promise<boolean>;
  resetZoom: () => void;
};

export type BoardHandle = {
  api: BoardApi;
  destroy: () => void;
};

const EMPTY_HINT = '画布上还没有内容';
const INVALID_FILE_HINT = '不是有效的 .tldr 草稿文件';

/**
 * 遍历 store snapshot，把所有 image/video asset record 的 props.src
 * 修正为合法值。
 *
 * tldraw 的 image asset schema 要求 `props.src: T.srcUrl.nullable()`，
 * 也就是必须是 string（含空串）或 null，不能是 undefined。
 * 但某些旧文件 / 跨工具导出的文件里，asset 的 src 可能就是 undefined，
 * 导致 `loadSnapshot` 内部 Store.put 直接 ValidationError 崩掉整个 transact。
 * 这里在落库前做一次兜底清洗。
 */
function sanitizeSnapshotAssets(
  snapshot: { store: Record<string, Record<string, unknown>> },
): void {
  for (const record of Object.values(snapshot.store)) {
    if (record.typeName !== 'asset') continue;
    const props = (record as { props?: Record<string, unknown> }).props;
    if (!props || typeof props !== 'object') continue;

    const src = props.src;
    if (src === undefined || (src !== null && typeof src !== 'string')) {
      props.src = null;
    }

    // image asset 额外必填 mimeType: T.string.nullable()，undefined 也会崩
    if (record.type === 'image' && !('mimeType' in props)) {
      props.mimeType = null;
    }
  }
}

/** 把文件里的 dataURL 图片重新转成资源，避免后续渲染与导出失败 */
async function restoreAssets(editor: Editor) {
  const assets = editor.store
    .allRecords()
    .filter(
      (record) =>
        record.typeName === 'asset' &&
        record.type === 'image' &&
        typeof record.props.src === 'string' &&
        record.props.src.startsWith('data:'),
    );

  await Promise.allSettled(
    assets.map(async (asset) => {
      try {
        const blob = await (await fetch(asset.props.src)).blob();
        const file = new File([blob], asset.props.name, { type: asset.props.mimeType });
        const { src } = await editor.getAssetForExternalContent({ type: 'file', file });
        editor.updateAssets([{ ...asset, props: { ...asset.props, src } }]);
      } catch (error) {
        console.error('恢复图片资源失败', error);
      }
    }),
  );
}

/**
 * 在指定 DOM 容器中挂载 tldraw（React 组件）。
 * 用 createElement 代替 JSX，避免污染 Nuxt 的 Vue tsconfig。
 */
export function mountBoard(container: HTMLElement): BoardHandle {
  let editor: Editor | null = null;
  const root: Root = createRoot(container);

  root.render(
    createElement(Tldraw, {
      persistenceKey: 'web-tool-whiteboard',
      colorScheme: 'light',
      locale: 'zh-cn',
      // 键盘快捷键（含 Delete / Backspace 删除）依赖容器自动获得焦点
      autoFocus: true,
      onMount: (instance: Editor) => {
        editor = instance;
      },
    }),
  );

  function getShapeIds() {
    const ids = editor ? [...editor.getCurrentPageShapeIds()] : [];
    if (!ids.length) throw new Error(EMPTY_HINT);
    return ids;
  }

  const api: BoardApi = {
    async getSvg() {
      if (!editor) return undefined;
      const result = await editor.getSvgString(getShapeIds(), {
        background: false,
      });
      return result?.svg;
    },
    async getPng() {
      if (!editor) return undefined;
      const { blob } = await editor.toImage(getShapeIds(), {
        format: 'png',
        background: false,
        scale: 2,
      });
      return blob;
    },
    resetZoom() {
      editor?.zoomToFit({ animation: { duration: 220 } });
    },
    async getDraftFile() {
      if (!editor) return undefined;
      return serializeTldrawJsonBlob(editor);
    },
    async loadDraftFile(file: File) {
      if (!editor) return false;

      const raw = await file.text();
      const parsed = parseTldrawJsonFile({
        json: raw,
        schema: editor.store.schema,
      });

      // v1 旧格式：直接委托给 tldraw 官方的迁移函数
      if (!parsed.ok && parsed.error.type === 'v1File') {
        transact(() => {
          editor!.store.clear();
          buildFromV1Document(editor!, parsed.error.data.document);
          editor!.clearHistory();
        });
        await restoreAssets(editor);
        const bounds = editor.getCurrentPageBounds();
        if (bounds) editor.zoomToBounds(bounds, { targetZoom: 1, immediate: true });
        return true;
      }

      if (!parsed.ok) {
        // 暴露具体错误类型，方便排查
        const detail =
          parsed.error.type === 'migrationFailed'
            ? `（${parsed.error.reason}）`
            : parsed.error.type === 'invalidRecords'
              ? `（${parsed.error.cause?.message ?? '记录校验失败'}）`
              : `（${parsed.error.type}）`;
        throw new Error(`${INVALID_FILE_HINT}${detail}`);
      }

      const snapshot = parsed.value.getStoreSnapshot();
      // 兜底：某些跨版本 / 跨工具文件里 asset.props.src 会是 undefined，
      // 在 transact 里 Store.put 直接 ValidationError 崩掉，这里提前修正
      sanitizeSnapshotAssets(snapshot);

      transact(() => {
        editor!.store.clear();
        editor!.loadSnapshot(snapshot);
        editor!.clearHistory();
      });
      await restoreAssets(editor);

      const bounds = editor.getCurrentPageBounds();
      if (bounds) editor.zoomToBounds(bounds, { targetZoom: 1, immediate: true });
      return true;
    },
  };

  return {
    api,
    destroy: () => root.unmount(),
  };
}
