type RawImage =
  | ImageBitmapSource
  | string
  | Blob
  | URL
  | ArrayBuffer
  | Uint8Array
  | ImageData;

/**
 * @imgly/background-removal 只接受 Blob / URL / string / ImageData 等，
 * 不接受 HTMLImageElement；传入后者会导致 shape 解构报
 * “undefined is not iterable”。
 */
async function normalizeImageSource(image: RawImage): Promise<Blob | string | URL | ImageData | ArrayBuffer | Uint8Array> {
  if (
    typeof image === 'string' ||
    image instanceof Blob ||
    image instanceof URL ||
    image instanceof ArrayBuffer ||
    ArrayBuffer.isView(image) ||
    (typeof ImageData !== 'undefined' && image instanceof ImageData)
  ) {
    return image as Blob | string | URL | ImageData | ArrayBuffer | Uint8Array;
  }

  if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
    return canvasToPngBlob(image);
  }

  if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
    return image.convertToBlob({ type: 'image/png' });
  }

  if (typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布以转换图片');
    ctx.drawImage(image, 0, 0);
    return canvasToPngBlob(canvas);
  }

  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布以转换图片');
    ctx.drawImage(image, 0, 0);
    return canvasToPngBlob(canvas);
  }

  throw new Error('不支持的图片类型，请使用文件或画布导出后再试');
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('图片转换失败'));
      else resolve(blob);
    }, 'image/png');
  });
}

/**
 * Client-only wrapper — Vite prebundles @imgly/background-removal
 * and resolves its onnxruntime-web peer imports.
 */
export async function removeImageBackground(
  image: RawImage,
  config?: Record<string, unknown>
) {
  const source = await normalizeImageSource(image);
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground(source as any, config as any);
}
