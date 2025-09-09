// 将WebP转换为JPG并下载
export const convertWebpToJpgAndDownload = (
  webpUrl,
  fileName: string = 'image.jpg',
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const typeMap: any = {
        jpg: 'image/jpeg',
        png: 'image/png',
        jpeg: 'image/png',
      };
      const fileType = fileName.split('.')[1] || 'png';
      console.log('fileType: ', fileType);

      const jpgDataUrl = canvas.toDataURL(typeMap[fileType], 0.95);

      const link = document.createElement('a');
      link.href = jpgDataUrl;
      link.download = fileName;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      resolve(jpgDataUrl);
      document.body.removeChild(link);
    };

    img.onerror = function () {
      console.error('WebP 图片加载失败');
      reject('WebP图片加载失败，请检查图片地址');
      alert('WebP图片加载失败，请检查图片地址');
    };

    // 开始加载 WebP 图片
    img.src = webpUrl;
  });
};


// 兼容很好的复制方法
export const copyToClipboard = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 优先使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(text))
        .catch(err => {
          console.warn('Clipboard API 失败，尝试备选方案', err);
          fallbackCopyToClipboard(text, resolve, reject);
        });
    } else {
      // 回退到传统方法
      fallbackCopyToClipboard(text, resolve, reject);
    }
  });
};

/**
 * 传统的复制到剪贴板方法，作为备选方案
 */
function fallbackCopyToClipboard(
  text: string,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
): void {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 防止滚动条出现
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      resolve(text);
    } else {
      reject(new Error('复制失败'));
    }
  } catch (err) {
    reject(err);
  }
}
