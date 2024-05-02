// -转驼峰
function transf(str = 'z-index') {
  console.log(
    str.replace(/-([a-z]?)/g, (...args) => {
      return args[1].toLocaleUpperCase();
    }),
  );
}
// 测试
// transf('content-type');

// 生成浏览器指纹
export function getFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillText('hello', 22, 33);

  return hashCode(canvas.toDataURL());
}

// 一个简单的字符串哈希函数
export function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return hash;
}
