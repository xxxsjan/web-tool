/**
 * 修补 tldraw 5.x 的裁剪框在拖动时消失的 bug。
 * 根因：SelectionForegroundOverlayUtil 在 isActive / showCropHandles / shouldDisplayBox
 *       三处 isInAny 判定中都漏掉了 'select.crop.cropping' 状态，
 *       导致进入 cropping（拖动裁剪柄）后 overlay 完全不绘制。
 *       蓝色的 selectionStroke 在白色画布上是够醒目的，只是整个 overlay 消失了。
 * 运行时机：每次 npm/yarn install 后通过 postinstall 自动执行。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ESM = resolve(
  ROOT,
  'node_modules/tldraw/dist-esm/lib/overlays/SelectionForegroundOverlayUtil.mjs',
);
const CJS = resolve(
  ROOT,
  'node_modules/tldraw/dist-cjs/lib/overlays/SelectionForegroundOverlayUtil.js',
);
const TS = resolve(
  ROOT,
  'node_modules/tldraw/src/lib/overlays/SelectionForegroundOverlayUtil.ts',
);

const PATCH_LINES = "'select.crop.cropping'";
const PATCH_LINES_JS = '"select.crop.cropping"';

/** 给 isInAny 调用追加 cropping 状态（只追加一次） */
function patch(content, quote) {
  const extra = quote + "select.crop.cropping" + quote;
  // 如果已经包含了就跳过
  if (content.includes(extra)) return content;

  // 三个要插入的位置 —— 每个都是在 pointing_crop_handle 那一行后面加一行
  const patterns = [
    // isActive
    [
      quote + 'select.crop.pointing_crop_handle' + quote + '\n    );',
      quote + 'select.crop.pointing_crop_handle' + quote + ',\n      ' + extra + '\n    );',
    ],
    // showCropHandles
    [
      quote + 'select.crop.pointing_crop_handle' + quote + '\n    ) &&',
      quote + 'select.crop.pointing_crop_handle' + quote + ',\n      ' + extra + '\n    ) &&',
    ],
    // shouldDisplayBox
    [
      quote + 'select.crop.pointing_crop_handle' + quote + ',\n      ' + quote + 'select.pointing_resize_handle' + quote,
      quote + 'select.crop.pointing_crop_handle' + quote + ',\n      ' + extra + ',\n      ' + quote + 'select.pointing_resize_handle' + quote,
    ],
  ];

  let result = content;
  for (const [from, to] of patterns) {
    if (result.includes(from)) {
      result = result.replace(from, to);
    }
  }
  return result;
}

let patchedAny = false;

function process(file, quote) {
  if (!existsSync(file)) {
    console.warn('[patch-tldraw] 跳过（文件不存在）:', file);
    return;
  }
  const original = readFileSync(file, 'utf-8');
  const patched = patch(original, quote);
  if (patched !== original) {
    writeFileSync(file, patched, 'utf-8');
    console.log('[patch-tldraw] 已修补:', file);
    patchedAny = true;
  } else {
    console.log('[patch-tldraw] 已应用，跳过:', file);
  }
}

process(ESM, '"');
process(CJS, '"');
process(TS, "'");

if (!patchedAny) {
  console.log('[patch-tldraw] 没有文件被实际修改（可能已修补过或版本不匹配）');
}
