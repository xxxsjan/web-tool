export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // 避免刷新时主题闪烁：在 hydrate 前应用本地主题（默认暗色）
    html.head.push(`<script>(function(){try{var k='web-tool-theme';var raw=localStorage.getItem(k);var theme='dark';if(raw){var p=JSON.parse(raw);if(p&&(p.theme==='light'||p.theme==='dark'))theme=p.theme;else if(raw==='light'||raw==='dark')theme=raw;}var r=document.documentElement;r.setAttribute('data-theme',theme);r.classList.toggle('dark',theme==='dark');r.style.colorScheme=theme;}catch(e){var r=document.documentElement;r.setAttribute('data-theme','dark');r.classList.add('dark');r.style.colorScheme='dark';}})();</script>`);
  });
});
