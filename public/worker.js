/**
 * 选区内上下黑边检测
 * 返回 content 区间 [top, bottom)（行索引，左闭右开）
 *
 * 设计要点：
 * 1. 亮度 + 近黑像素占比双条件（兼容压缩后的深灰边）
 * 2. 需连续多行「非黑边」才确认内容开始，避免黑边内 1～2 行噪点提前打断
 * 3. 二次软裁：按内容区亮度自适应再收一截残留暗边
 */

function lumaOf(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rowStats(data, width, y, sampleStep, hardLuma) {
  let sum = 0;
  let nearBlack = 0;
  let total = 0;

  for (let x = 0; x < width; x += sampleStep) {
    const i = (y * width + x) * 4;
    const a = data[i + 3];
    total += 1;

    // 透明/半透明当黑边（PNG 留白）
    if (a < 24) {
      nearBlack += 1;
      continue;
    }

    const luma = lumaOf(data[i], data[i + 1], data[i + 2]);
    sum += luma;
    if (luma <= hardLuma) nearBlack += 1;
  }

  if (!total) {
    return { avg: 0, blackRatio: 1 };
  }

  return {
    avg: sum / total,
    blackRatio: nearBlack / total,
  };
}

function isLetterboxRow(stats, hardLuma, softLuma, blackRatio) {
  if (stats.blackRatio >= blackRatio) return true;
  if (stats.avg <= hardLuma) return true;
  // 深灰边：整体偏暗，且多数像素仍接近黑
  if (stats.avg <= softLuma && stats.blackRatio >= blackRatio * 0.72) {
    return true;
  }
  return false;
}

/**
 * 从边缘向内扫：连续 contentConfirm 行非黑边才停
 * 返回内容起始（从上扫）或结束（从下扫，左闭右开）
 */
function scanEdge(statsList, fromStart, hardLuma, softLuma, blackRatio, contentConfirm) {
  const len = statsList.length;
  if (len === 0) return 0;

  let edge = fromStart ? 0 : len;
  let contentStreak = 0;

  const begin = fromStart ? 0 : len - 1;
  const step = fromStart ? 1 : -1;

  for (let i = begin; fromStart ? i < len : i >= 0; i += step) {
    const letterbox = isLetterboxRow(
      statsList[i],
      hardLuma,
      softLuma,
      blackRatio,
    );

    if (letterbox) {
      edge = fromStart ? i + 1 : i;
      contentStreak = 0;
      continue;
    }

    contentStreak += 1;
    if (contentStreak >= contentConfirm) {
      break;
    }
  }

  return edge;
}

/** 二次软裁：继续吃掉明显暗于内容区的残留边 */
function softTrim(statsList, top, bottom, softLuma) {
  if (bottom - top < 8) return { top, bottom };

  const midStart = top + Math.floor((bottom - top) * 0.25);
  const midEnd = top + Math.floor((bottom - top) * 0.75);
  let sum = 0;
  let count = 0;
  for (let i = midStart; i < midEnd; i++) {
    sum += statsList[i].avg;
    count += 1;
  }
  const contentAvg = count ? sum / count : 128;
  // 相对内容足够暗，或仍低于软阈值
  const cutoff = Math.min(softLuma, Math.max(18, contentAvg * 0.28));

  let newTop = top;
  while (newTop < bottom - 2 && statsList[newTop].avg <= cutoff) {
    newTop += 1;
  }

  let newBottom = bottom;
  while (newBottom > newTop + 2 && statsList[newBottom - 1].avg <= cutoff) {
    newBottom -= 1;
  }

  return { top: newTop, bottom: newBottom };
}

self.addEventListener('message', function (event) {
  const {
    buffer,
    width,
    height,
    start = 0,
    end = height,
    requestId,
    // 纯黑/近黑硬阈值（JPEG 黑边常在 16～40）
    hardLuma = 42,
    // 深灰 letterbox
    softLuma = 58,
    // 一行里近黑像素占比
    blackRatio = 0.68,
    // 连续多少行非黑边才认定进入内容区（抗噪点）
    contentConfirm = 3,
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
  const rowCount = endY - startY;

  // 更密采样，减少窄亮线漏检 / 窄暗线误判
  const sampleStep = Math.max(1, Math.floor(width / 96));

  const statsList = new Array(rowCount);
  for (let y = 0; y < rowCount; y++) {
    statsList[y] = rowStats(data, width, startY + y, sampleStep, hardLuma);
  }

  let topLocal = scanEdge(
    statsList,
    true,
    hardLuma,
    softLuma,
    blackRatio,
    contentConfirm,
  );
  let bottomLocal = scanEdge(
    statsList,
    false,
    hardLuma,
    softLuma,
    blackRatio,
    contentConfirm,
  );

  if (bottomLocal <= topLocal) {
    topLocal = 0;
    bottomLocal = Math.min(rowCount, 1);
  } else {
    const trimmed = softTrim(statsList, topLocal, bottomLocal, softLuma);
    topLocal = trimmed.top;
    bottomLocal = trimmed.bottom;
  }

  // 转回绝对行号（相对传入 buffer 的 startY）
  const top = startY + topLocal;
  const bottom = startY + bottomLocal;

  self.postMessage({ top, bottom, requestId });
});
