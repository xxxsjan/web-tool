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
 * 在原始 JSON 层面清洗 asset 记录，必须在 parseTldrawJsonFile 之前做：
 *
 * 1. 刚 JSON.parse 出来的对象可自由修改；而 parse 之后 getStoreSnapshot()
 *    返回的记录在开发模式下会被 devFreeze 深冻结，根本写不进去；
 * 2. image asset 的 schema 要求 `props.src: T.srcUrl.nullable()`（string 或
 *    null），某些旧文件 / 跨工具导出的文件里 src 干脆缺失（JSON 序列化会
 *    丢掉 undefined），缺省会在 parse 内部建临时 store 校验时直接抛
 *    ValidationError: Expected string, got undefined。
 */
function sanitizeRawAssets(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) {
    for (const item of data) sanitizeRawAssets(item);
    return;
  }
  const record = data as Record<string, unknown>;
  if (record.typeName === 'asset') {
    const props = record.props;
    if (props && typeof props === 'object') {
      const p = props as Record<string, unknown>;
      // srcUrl.nullable()：string 或 null 才合法，其余一律归一为 null
      if (p.src !== null && typeof p.src !== 'string') p.src = null;
      // mimeType: T.string.nullable()，同样不能是 undefined
      if (p.mimeType !== null && typeof p.mimeType !== 'string') p.mimeType = null;
    }
    return;
  }
  for (const value of Object.values(record)) sanitizeRawAssets(value);
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
        const blob = await (await fetch(asset.props.src as string)).blob();
        const file = new File([blob], asset.props.name, { type: asset.props.mimeType });
        // 注意：返回的是完整 asset record，src 在 props 里而不是顶层。
        // 之前直接 const { src } = ... 解构拿到 undefined，
        // updateAssets 时 Store.put 校验直接炸了整个画板
        const newAsset = await editor.getAssetForExternalContent({ type: 'file', file });
        const src = newAsset?.props?.src;
        // 拿不到合法 src 就保留 data: 源，图片依然能渲染和导出
        if (typeof src !== 'string' || !src) return;
        editor.updateAssets([{ ...asset, props: { ...asset.props, src } }]);
      } catch (error) {
        // 转存依赖本地 IndexedDB 资源库；个别环境（如跨标签页重置、连接被回收）会报
        // "db is closed"。此时保留 data: 源即可，图片渲染与导出不受影响，故只警告不报错。
        console.warn('图片资源转存失败，已保留内嵌数据源', error);
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
      // 先在原始 JSON 层面兜底清洗 asset 记录（此刻对象还没被冻结），
      // 否则缺 src 的图片资源在 parse / loadSnapshot 校验时会直接崩
      let json = raw;
      try {
        const data: unknown = JSON.parse(raw);
        sanitizeRawAssets(data);
        json = JSON.stringify(data);
      } catch {
        // 不是合法 JSON，交给 parseTldrawJsonFile 统一报“不是有效草稿”
      }

      const parsed = parseTldrawJsonFile({
        json,
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
