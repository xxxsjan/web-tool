/** 站点自绘彩色工具图标（24×24），键名对应 definePageMeta.icon */

const svgs: Record<string, string> = {
  /* 在线抠图 */
  'design-ideas': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="4.5" width="11" height="14" rx="2" fill="#38BDF8" fill-opacity=".25" stroke="#0EA5E9" stroke-width="1.6"/>
  <path d="M9 9.5h4M9 12.5h3" stroke="#0284C7" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M14.2 15.2l5.3-5.3a1.6 1.6 0 0 1 2.3 2.3l-5.3 5.3-2.6.4.3-2.7z" fill="#F472B6" stroke="#DB2777" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`,

  /* 视频转音频 */
  headphones: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="12" height="9" rx="2" fill="#A78BFA" fill-opacity=".3" stroke="#8B5CF6" stroke-width="1.5"/>
  <path d="M6 8.2h6M6 10.5h4" stroke="#7C3AED" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M15.5 12.5c0-1.5.9-2.8 2.2-3.3v8.1a2.6 2.6 0 0 1-2.2-3.3z" fill="#34D399" stroke="#059669" stroke-width="1.3"/>
  <path d="M20.5 12.5c0 1.5-.9 2.8-2.2 3.3V7.7a2.6 2.6 0 0 1 2.2 3.3z" fill="#34D399" stroke="#059669" stroke-width="1.3"/>
  <path d="M15.5 9.2a4.8 4.8 0 0 1 5 0" stroke="#059669" stroke-width="1.4" stroke-linecap="round"/>
</svg>`,

  /* 图片去黑边 */
  'content-view': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="5" width="16" height="14" rx="2" fill="#94A3B8" fill-opacity=".25"/>
  <rect x="6.5" y="7.5" width="11" height="9" rx="1.2" fill="#FBBF24" fill-opacity=".35" stroke="#D97706" stroke-width="1.5"/>
  <path d="M4 8.5H2.5M4 15.5H2.5M21.5 8.5H20M21.5 15.5H20M8.5 5V3.5M15.5 5V3.5M8.5 20.5V19M15.5 20.5V19" stroke="#F59E0B" stroke-width="1.6" stroke-linecap="round"/>
</svg>`,

  /* 图片转换 */
  'arrow-sync': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="4" width="8.5" height="8.5" rx="1.8" fill="#38BDF8" fill-opacity=".35" stroke="#0284C7" stroke-width="1.4"/>
  <path d="M5.2 7.2l2.2 2.2 3-3.3" stroke="#0369A1" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="12.5" y="11.5" width="8.5" height="8.5" rx="1.8" fill="#FB7185" fill-opacity=".35" stroke="#E11D48" stroke-width="1.4"/>
  <circle cx="16.7" cy="15.2" r="1.3" fill="#BE123C"/>
  <path d="M13.5 8.2h4.2a3 3 0 0 1 3 3" stroke="#64748B" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M19.2 6.8l1.5 1.4-1.5 1.4" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.5 15.8H6.3a3 3 0 0 1-3-3" stroke="#64748B" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M4.8 17.2L3.3 15.8l1.5-1.4" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

  /* 文本转语音 */
  'megaphone-loud': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.5 9.2h3.2l5.3-3.4v12.4l-5.3-3.4H4.5a1.5 1.5 0 0 1-1.5-1.5v-2.6a1.5 1.5 0 0 1 1.5-1.5z" fill="#F472B6" fill-opacity=".4" stroke="#DB2777" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M7.8 14.8v2.1a1.6 1.6 0 0 0 1.6 1.6h.4" stroke="#DB2777" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M15.8 9.2c1.1.7 1.8 1.9 1.8 3.2s-.7 2.5-1.8 3.2" stroke="#0EA5E9" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18.2 7.2c1.8 1.2 2.9 3.1 2.9 5.2s-1.1 4-2.9 5.2" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,

  /* GPT-SoVITS */
  'bot-sparkle': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="7" width="14" height="11" rx="3" fill="#34D399" fill-opacity=".28" stroke="#059669" stroke-width="1.5"/>
  <circle cx="9.2" cy="12" r="1.35" fill="#059669"/>
  <circle cx="14.8" cy="12" r="1.35" fill="#059669"/>
  <path d="M12 4.2v2.8" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="3.6" r="1.1" fill="#FBBF24" stroke="#D97706" stroke-width="1"/>
  <path d="M9 16.2c.8.7 1.8 1 3 1s2.2-.3 3-1" stroke="#047857" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M18.8 5.2l.7 1.5 1.6.2-1.2 1.1.4 1.5-1.5-.7-1.5.7.4-1.5-1.2-1.1 1.6-.2.7-1.5z" fill="#FBBF24"/>
</svg>`,

  /* excalidraw */
  'paint-brush': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.5 18.5c2.2-.2 3.8-1 4.8-2.4" stroke="#F97316" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M8.2 15.2c-1.8 1.9-3.9 2.8-5.5 3-.4-1.5.3-3.7 2.1-5.5l7.6-7.6 3.4 3.4-7.6 7.7z" fill="#FB923C" fill-opacity=".45" stroke="#EA580C" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M12.8 5.2l3.3 3.3 1.7-1.7a2.1 2.1 0 0 0-3-3l-2 1.4z" fill="#38BDF8" stroke="#0284C7" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M15.5 4.2c1.2-1.4 3.3-1.5 4.5-.3" stroke="#0EA5E9" stroke-width="1.3" stroke-linecap="round"/>
</svg>`,

  /* svg 预览 */
  image: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" fill="#818CF8" fill-opacity=".22" stroke="#6366F1" stroke-width="1.5"/>
  <path d="M7 14.5l3.2-3.4 2.3 2.3 3-3.9L17.5 14.5" stroke="#4F46E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9" cy="9" r="1.4" fill="#F59E0B"/>
  <path d="M15.2 7.2h3.2v3.2" stroke="#EC4899" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

  /* 文本编辑 */
  notebook: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 3.5h10.5A2.5 2.5 0 0 1 20 6v12.5a2.5 2.5 0 0 1-2.5 2.5H7" fill="#FDE68A" fill-opacity=".55" stroke="#D97706" stroke-width="1.5"/>
  <path d="M7 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2" stroke="#D97706" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M10 8.5h6.5M10 12h6.5M10 15.5h4.5" stroke="#B45309" stroke-width="1.4" stroke-linecap="round"/>
</svg>`,

  /* HTML 预览 */
  'code-block': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="4" width="18" height="16" rx="2.2" fill="#22D3EE" fill-opacity=".18" stroke="#0891B2" stroke-width="1.5"/>
  <path d="M8.2 9.2L5.8 12l2.4 2.8" stroke="#0E7490" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.8 9.2l2.4 2.8-2.4 2.8" stroke="#0E7490" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.1 8.5l-2.2 7" stroke="#F472B6" stroke-width="1.6" stroke-linecap="round"/>
</svg>`,

  /* Git 图床 */
  cloud: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.2 17.5h9.2a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.5-1.3A3.4 3.4 0 0 0 8.2 17.5z" fill="#38BDF8" fill-opacity=".35" stroke="#0284C7" stroke-width="1.5"/>
  <rect x="9.2" y="11.2" width="6.2" height="4.6" rx="1" fill="#F9A8D4" fill-opacity=".7" stroke="#DB2777" stroke-width="1.1"/>
  <circle cx="11" cy="12.8" r=".7" fill="#BE185D"/>
  <path d="M10 14.8l1.3-1.2 1 .9 1.5-1.5.8 1.8H10z" fill="#DB2777"/>
</svg>`,

  /* 抖音类：黑底 + 青/品红错位 + 白音符 */
  tiktok: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#111827"/>
  <g transform="translate(12 12) scale(.92) translate(-12 -12)">
    <path transform="translate(-0.55 -0.35)" fill="#25F4EE" d="M14.1 6c.55 1.85 1.85 3.2 3.65 3.55V12.1c-1.35-.15-2.55-.65-3.5-1.4v5.35A4.05 4.05 0 1 1 9.2 12c.3 0 .6.03.9.1v2.2a1.9 1.9 0 1 0 1.35 1.8V6h2.65z"/>
    <path transform="translate(0.55 0.35)" fill="#FE2C55" d="M14.1 6c.55 1.85 1.85 3.2 3.65 3.55V12.1c-1.35-.15-2.55-.65-3.5-1.4v5.35A4.05 4.05 0 1 1 9.2 12c.3 0 .6.03.9.1v2.2a1.9 1.9 0 1 0 1.35 1.8V6h2.65z"/>
    <path fill="#fff" d="M14.1 6c.55 1.85 1.85 3.2 3.65 3.55V12.1c-1.35-.15-2.55-.65-3.5-1.4v5.35A4.05 4.05 0 1 1 9.2 12c.3 0 .6.03.9.1v2.2a1.9 1.9 0 1 0 1.35 1.8V6h2.65z"/>
  </g>
</svg>`,

  /* IKUN 键盘 */
  'animal-paw-print': `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="8" width="18" height="11" rx="2.2" fill="#FCD34D" fill-opacity=".35" stroke="#D97706" stroke-width="1.5"/>
  <path d="M6.2 12h1.8M10.1 12h1.8M14.1 12h1.8M18 12h.8M6.2 15.2h1.8M10.1 15.2h3.8M15.5 15.2h2.3" stroke="#B45309" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="5.2" r="2.2" fill="#FDE68A" stroke="#D97706" stroke-width="1.2"/>
  <circle cx="11.3" cy="4.9" r=".35" fill="#78350F"/>
  <circle cx="12.7" cy="4.9" r=".35" fill="#78350F"/>
  <path d="M11.3 5.8c.4.4 1 .4 1.4 0" stroke="#78350F" stroke-width="1" stroke-linecap="round"/>
</svg>`,

  /* 录音 / 片段 / 默认 */
  mic: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="3.5" width="6" height="10" rx="3" fill="#FB7185" fill-opacity=".45" stroke="#E11D48" stroke-width="1.5"/>
  <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" stroke="#BE123C" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M12 17v3.5M9 20.5h6" stroke="#BE123C" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,

  code: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.5 7.5L4.5 12l4 4.5" stroke="#8B5CF6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.5 7.5l4 4.5-4 4.5" stroke="#06B6D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.2 6.5l-2.4 11" stroke="#F59E0B" stroke-width="1.7" stroke-linecap="round"/>
</svg>`,

  toolbox: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="8" width="17" height="11.5" rx="2" fill="#94A3B8" fill-opacity=".35" stroke="#475569" stroke-width="1.5"/>
  <path d="M8 8V6.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V8" stroke="#475569" stroke-width="1.5"/>
  <path d="M3.5 12.5h17" stroke="#64748B" stroke-width="1.4"/>
  <rect x="10" y="11.2" width="4" height="2.4" rx=".6" fill="#F59E0B"/>
</svg>`,

  /* 备用 */
  video: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="6" width="13" height="12" rx="2" fill="#C4B5FD" fill-opacity=".4" stroke="#7C3AED" stroke-width="1.5"/>
  <path d="M16 10.2l5-2.7v9l-5-2.7" fill="#F9A8D4" stroke="#DB2777" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`,

  gift: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="10" width="16" height="10" rx="1.8" fill="#FB7185" fill-opacity=".4" stroke="#E11D48" stroke-width="1.5"/>
  <path d="M4 13.5h16" stroke="#E11D48" stroke-width="1.4"/>
  <path d="M12 10v10" stroke="#E11D48" stroke-width="1.4"/>
  <path d="M12 10c-2.2-3.5-5.5-3.2-5.5-1.2S9.2 11 12 10zM12 10c2.2-3.5 5.5-3.2 5.5-1.2S14.8 11 12 10z" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"/>
</svg>`,

  download: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4v10.5" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8.2 11.2L12 15l3.8-3.8" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 18.5h14" stroke="#F472B6" stroke-width="1.8" stroke-linecap="round"/>
</svg>`,

  board: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="4" width="17" height="13" rx="2" fill="#E2E8F0" fill-opacity=".5" stroke="#64748B" stroke-width="1.5"/>
  <path d="M8 20l4-3 4 3" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 9.5c2 1 3.5-.5 5 .5s3 1.5 5 0" stroke="#F97316" stroke-width="1.6" stroke-linecap="round"/>
</svg>`,

  star: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3.5l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 16.2 6.9 18.6l1.2-5.5L4 9.3l5.6-.6L12 3.5z" fill="#FBBF24" stroke="#D97706" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`,

  link: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 13.5a4 4 0 0 0 6 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 6" stroke="#06B6D4" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M14 10.5a4 4 0 0 0-6 0L5.5 13a4 4 0 1 0 5.7 5.7l1.3-.7" stroke="#F472B6" stroke-width="1.7" stroke-linecap="round"/>
</svg>`,

  audio: `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 16V8l11-2.5V14" stroke="#8B5CF6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="5.8" cy="16.2" r="2.2" fill="#C4B5FD" stroke="#7C3AED" stroke-width="1.3"/>
  <circle cx="15.8" cy="14.2" r="2.2" fill="#F9A8D4" stroke="#DB2777" stroke-width="1.3"/>
</svg>`,
};

export function getToolIconSvg(name?: string) {
  const key = (name || 'toolbox').trim();
  return svgs[key] || svgs.toolbox;
}

export const toolIconNames = Object.keys(svgs);
