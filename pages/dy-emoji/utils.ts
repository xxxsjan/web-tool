// 将WebP转换为JPG并下载
export const convertWebpToJpgAndDownload = (
  webpUrl,
  fileName = 'image.jpg',
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';

    img.onload = function () {
      // 创建 canvas 元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 设置 canvas 尺寸与图片一致
      canvas.width = img.width;
      canvas.height = img.height;

      // 将图片绘制到 canvas
      ctx.drawImage(img, 0, 0);

      // 将 canvas 内容导出为 JPG
      const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // 创建下载链接
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
