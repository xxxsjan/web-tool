import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';

/**
 * @excalidraw/excalidraw 运行时内部有 Fonts，但未列入公开 export。
 * 此插件把它补进入口导出，便于注册系统字体（如微软雅黑）。
 */
function patchExcalidrawIndex(code: string): string | null {
  if (
    /export\s*\{[^}]*\bFonts\b/.test(code) ||
    /export\{[^}]*\bFonts\b/.test(code) ||
    /export\{[^}]*\bas Fonts\b/.test(code)
  ) {
    return null;
  }

  // dist/dev：Fonts 已 import，补进 export 列表
  if (/\n {2}Fonts,\n/.test(code) || /\n {2}Fonts,/.test(code)) {
    const next = code.replace(/export \{\r?\n {2}Button,/, 'export {\n  Fonts,\n  Button,');
    if (next !== code) return next;
  }

  // dist/prod：Fonts 被压缩，用字体列表处的 `.registered.entries()` 定位绑定名
  const m = code.match(/Array\.from\((\w+)\.registered\.entries\(\)\)/);
  if (m) {
    const binding = m[1];
    const next = code.replace(/export\{/, `export{${binding} as Fonts,`);
    if (next !== code) return next;
  }

  return null;
}

function isExcalidrawIndex(id: string): boolean {
  const norm = id.replace(/\\/g, '/');
  return (
    norm.includes('@excalidraw/excalidraw') &&
    norm.includes('/dist/') &&
    /\/index\.js(?:\?|$)/.test(norm)
  );
}

export function excalidrawExportFonts(): Plugin {
  return {
    name: 'excalidraw-export-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (!isExcalidrawIndex(id)) return null;
      const next = patchExcalidrawIndex(code);
      return next ? { code: next, map: null } : null;
    },
  };
}

/** 供 optimizeDeps.esbuildOptions.plugins 使用，预构建时同样打补丁 */
export function excalidrawExportFontsEsbuild() {
  return {
    name: 'excalidraw-export-fonts',
    setup(build: {
      onLoad: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => Promise<{ contents: string; loader: 'js' } | undefined>,
      ) => void;
    }) {
      build.onLoad(
        { filter: /@excalidraw[\\/]excalidraw[\\/]dist[\\/][^\\/]+[\\/]index\.js$/ },
        async (args) => {
          const code = readFileSync(args.path, 'utf8');
          const next = patchExcalidrawIndex(code);
          return { contents: next ?? code, loader: 'js' };
        },
      );
    },
  };
}
