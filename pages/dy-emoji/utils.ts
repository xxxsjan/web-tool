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
