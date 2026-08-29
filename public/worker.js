/**
 * 选区内上下黑边检测
 * 返回 content 区间 [top, bottom)（行索引，左闭右开）
 */
function isNearBlack(r, g, b, a, lumaThreshold) {
  // 透明/半透明当作可裁边（常见于 PNG 留白）
  if (a < 20) return true;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma <= lumaThreshold;
}

function isBlackRow(data, width, y, sampleStep, blackRatio, lumaThreshold) {
  let black = 0;
  let total = 0;
  for (let x = 0; x < width; x += sampleStep) {
    const i = (y * width + x) * 4;
    total += 1;
    if (isNearBlack(data[i], data[i + 1], data[i + 2], data[i + 3], lumaThreshold)) {
      black += 1;
    }
  }
  return total > 0 && black / total >= blackRatio;
}

self.addEventListener('message', function (event) {
  const {
    buffer,
    width,
    height,
    start = 0,
    end = height,
    requestId,
    lumaThreshold = 28,
    blackRatio = 0.82,
  } = event.data;

  const data =
    buffer instanceof ArrayBuffer
      ? new Uint8ClampedArray(buffer)
      : event.data.imageData?.data;

  if (!data || !width || !height) {
    self.postMessage({ top: 0, bottom: height || 0, requestId });
    return;
  }

  const startY = Math.max(0, Math.min(height - 1, Math.floor(start)));
  const endY = Math.max(startY + 1, Math.min(height, Math.ceil(end)));

  // 约 48 个采样点，兼顾速度与窄竖条内容
  const sampleStep = Math.max(1, Math.floor(width / 48));

  // 从上往下：连续黑边行
  let top = startY;
  for (let y = startY; y < endY; y++) {
    if (isBlackRow(data, width, y, sampleStep, blackRatio, lumaThreshold)) {
      top = y + 1;
    } else {
      break;
    }
  }

  // 从下往上：连续黑边行
  let bottom = endY;
  for (let y = endY - 1; y >= top; y--) {
    if (isBlackRow(data, width, y, sampleStep, blackRatio, lumaThreshold)) {
      bottom = y;
    } else {
      break;
    }
  }

  // 兜底：整段都被判黑时至少留 1 行，避免 canvas 高度为 0
  if (bottom <= top) {
    top = startY;
    bottom = Math.min(endY, startY + 1);
  }

  self.postMessage({ top, bottom, requestId });
});
