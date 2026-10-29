import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  buildFromV1Document,
  DefaultActionsMenu,
  DefaultQuickActions,
  Editor,
  parseTldrawJsonFile,
  serializeTldrawJsonBlob,
  Tldraw,
  TldrawUiButtonIcon,
  TldrawUiToolbarButton,
  TldrawUiTooltip,
  transact,
  unwrapLabel,
  useActions,
  useCanRedo,
  useCanUndo,
  useEditor,
  useTranslation,
  useUnlockedSelectedShapesCount,
  useValue,
} from 'tldraw';
import 'tldraw/tldraw.css';

const ALIGN_ACTION_IDS = [
  'align-left',
  'align-center-horizontal',
  'align-right',
  'stretch-horizontal',
  'align-top',
  'align-center-vertical',
  'align-bottom',
  'stretch-vertical',
] as const;

const DISTRIBUTE_ACTION_IDS = ['distribute-horizontal', 'distribute-vertical'] as const;
const STACK_ACTION_IDS = ['stack-horizontal', 'stack-vertical'] as const;
const REORDER_ACTION_IDS = [
  'send-to-back',
  'send-backward',
  'bring-forward',
  'bring-to-front',
] as const;

type TipSource = 'quick-actions' | 'actions-menu';

/**
 * 禁用的原生 button 不会触发 mouseenter，tldraw 内置 tooltip 因而失效。
 * 外包一层 span 承接悬停，保证未选中图形时也能看到「这是干什么的」。
 */
function TipActionButton({
  actionId,
  disabled,
  source = 'quick-actions',
}: {
  actionId: string;
  disabled: boolean;
  source?: TipSource;
}) {
  const actions = useActions();
  const msg = useTranslation();
  const action = actions[actionId];
  if (!action) return null;

  const labelKey = unwrapLabel(action.label, 'small-icons');
  const labelStr = labelKey ? msg(labelKey as never) : actionId;

  const button = createElement(
    TldrawUiToolbarButton,
    {
      type: 'icon',
      disabled,
      // 空 tooltip 跳过组件内部再包一层，避免双重提示
      tooltip: '',
      'aria-label': labelStr,
      onClick: () => {
        void action.onSelect(source);
      },
    } as never,
    createElement(TldrawUiButtonIcon, { icon: action.icon as never, small: true }),
  );

  return createElement(TldrawUiTooltip, {
    content: labelStr,
    sideOffset: 8,
    delayDuration: 200,
    showOnMobile: true,
    children: createElement(
      'span',
      { style: { display: 'inline-flex' }, 'aria-label': labelStr },
      button,
    ),
  } as never);
}

function useIsInSelectState() {
  const editor = useEditor();
  return useValue('isInSelectState', () => editor.isIn('select'), [editor]);
}

function UndoRedoGroup() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  return createElement(
    'span',
    { style: { display: 'contents' } },
    createElement(TipActionButton, { actionId: 'undo', disabled: !canUndo }),
    createElement(TipActionButton, { actionId: 'redo', disabled: !canRedo }),
  );
}

function DeleteDuplicateGroup() {
  const oneSelected = useUnlockedSelectedShapesCount(1);
  const isInSelectState = useIsInSelectState();
  const enabled = Boolean(oneSelected) && isInSelectState;
  return createElement(
    'span',
    { style: { display: 'contents' } },
    createElement(TipActionButton, { actionId: 'delete', disabled: !enabled }),
    createElement(TipActionButton, { actionId: 'duplicate', disabled: !enabled }),
  );
}

function AlignGroup() {
  const twoSelected = useUnlockedSelectedShapesCount(2);
  const isInSelectState = useIsInSelectState();
  const enabled = Boolean(twoSelected) && isInSelectState;
  return createElement(
    'span',
    { style: { display: 'contents' } },
    ...ALIGN_ACTION_IDS.map((actionId) =>
      createElement(TipActionButton, { key: actionId, actionId, disabled: !enabled }),
    ),
  );
}

/** 对齐常驻快捷栏；禁用态也可悬停出中文说明 */
function CustomQuickActions() {
  return createElement(
    DefaultQuickActions,
    null,
    createElement(UndoRedoGroup),
    createElement(DeleteDuplicateGroup),
    createElement(AlignGroup),
  );
}

/** 「操作」下拉里的图标：同样用 TipActionButton，未选中时也能看到用途 */
function ActionsMenuItems() {
  const editor = useEditor();
  const isInSelectState = useIsInSelectState();
  const oneSelected = Boolean(useUnlockedSelectedShapesCount(1)) && isInSelectState;
  const twoSelected = Boolean(useUnlockedSelectedShapesCount(2)) && isInSelectState;
  const threeSelected = Boolean(useUnlockedSelectedShapesCount(3)) && isInSelectState;

  const hasGroup = useValue(
    'has-group-selected',
    () => editor.getSelectedShapes().some((s) => s.type === 'group'),
    [editor],
  );
  const hasLink = useValue(
    'has-link-selected',
    () =>
      editor.getSelectedShapes().some((s) => {
        const props = s.props as { url?: string | null };
        return typeof props?.url === 'string' && props.url.length > 0;
      }),
    [editor],
  );

  const tip = { source: 'actions-menu' as const };

  return createElement(
    'span',
    { style: { display: 'contents' } },
    ...DISTRIBUTE_ACTION_IDS.map((actionId) =>
      createElement(TipActionButton, {
        key: actionId,
        actionId,
        disabled: !threeSelected,
        ...tip,
      }),
    ),
    ...STACK_ACTION_IDS.map((actionId) =>
      createElement(TipActionButton, {
        key: actionId,
        actionId,
        disabled: !threeSelected,
        ...tip,
      }),
    ),
    ...REORDER_ACTION_IDS.map((actionId) =>
      createElement(TipActionButton, {
        key: actionId,
        actionId,
        disabled: !oneSelected,
        ...tip,
      }),
    ),
    createElement(TipActionButton, {
      actionId: 'rotate-ccw',
      disabled: !oneSelected,
      ...tip,
    }),
    createElement(TipActionButton, {
      actionId: 'rotate-cw',
      disabled: !oneSelected,
      ...tip,
    }),
    createElement(TipActionButton, {
      actionId: 'edit-link',
      disabled: !hasLink || !isInSelectState,
      ...tip,
    }),
    createElement(TipActionButton, {
      actionId: hasGroup ? 'ungroup' : 'group',
      disabled: hasGroup ? !isInSelectState : !twoSelected,
      ...tip,
    }),
  );
}

/** 「操作」下拉：沿用官方外壳，「操作」触发钮自带 title；内层图标走 TipActionButton */
function CustomActionsMenu() {
  return createElement(DefaultActionsMenu, null, createElement(ActionsMenuItems));
}

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

export type MountBoardOptions = {
  /** IndexedDB 持久化加载完成、编辑器可用时回调 */
  onReady?: () => void;
  /**
   * tldraw 商业许可证。生产域名（非 localhost）缺少有效 key 时，
   * 编辑器会先正常显示约 5 秒，随后被官方 LicenseProvider 卸成白屏。
   * @see https://tldraw.dev
   */
  licenseKey?: string;
  /** 生产环境因无许可证被卸掉编辑器时回调 */
  onLicenseBlocked?: () => void;
};

/**
 * 在指定 DOM 容器中挂载 tldraw（React 组件）。
 * 用 createElement 代替 JSX，避免污染 Nuxt 的 Vue tsconfig。
 *
 * 注意：不要把 React root 直接建在会被 Vue patch 的空节点上。
 * 这里再插一层纯 DOM 子节点，配合页面上 host 的 v-once，避免 Vue 重渲染清掉画布。
 */
export function mountBoard(container: HTMLElement, options: MountBoardOptions = {}): BoardHandle {
  let editor: Editor | null = null;

  const mountEl = document.createElement('div');
  mountEl.style.width = '100%';
  mountEl.style.height = '100%';
  mountEl.style.position = 'relative';
  container.replaceChildren(mountEl);

  const root: Root = createRoot(mountEl);

  // 提高 portaled tooltip 层级，避免被本页顶栏盖住
  const tipStyle = document.createElement('style');
  tipStyle.setAttribute('data-whiteboard-tooltip', '');
  tipStyle.textContent = `
    [data-radix-popper-content-wrapper]:has(.tlui-tooltip) {
      z-index: 10000 !important;
    }
  `;
  document.head.appendChild(tipStyle);

  // 生产环境无许可证时，tldraw 约 5s 后会只剩 data-testid="tl-license-expired"
  let licenseObserver: MutationObserver | null = null;
  let licenseBlocked = false;
  const watchLicenseGate = () => {
    if (!options.onLicenseBlocked) return;
    licenseObserver = new MutationObserver(() => {
      if (licenseBlocked) return;
      if (mountEl.querySelector('[data-testid="tl-license-expired"]')) {
        licenseBlocked = true;
        licenseObserver?.disconnect();
        options.onLicenseBlocked?.();
      }
    });
    licenseObserver.observe(mountEl, { childList: true, subtree: true });
  };
  watchLicenseGate();

  root.render(
    createElement(Tldraw, {
      persistenceKey: 'web-tool-whiteboard',
      colorScheme: 'light',
      locale: 'zh-cn',
      ...(options.licenseKey ? { licenseKey: options.licenseKey } : {}),
      // 键盘快捷键（含 Delete / Backspace 删除）依赖容器自动获得焦点
      autoFocus: true,
      // 默认 700ms 偏慢，快捷栏悬停说明更快出现
      options: { tooltipDelayMs: 200 },
      components: {
        QuickActions: CustomQuickActions,
        ActionsMenu: CustomActionsMenu,
      },
      onMount: (instance: Editor) => {
        editor = instance;
        options.onReady?.();
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
    destroy: () => {
      licenseObserver?.disconnect();
      root.unmount();
      mountEl.remove();
      tipStyle.remove();
    },
  };
}
