function getColor(x, y, imageData, width, height) {
  const i = y * width * 4 + x * 4;
  return [
    imageData.data[i],
    imageData.data[i + 1],
    imageData.data[i + 2],
    imageData.data[i + 3],
  ];
}
function deltaE(lab1, lab2) {
  let deltaL = lab1[0] - lab2[0];
  let deltaA = lab1[1] - lab2[1];
  let deltaB = lab1[2] - lab2[2];
  let deltaE = Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);
  return deltaE;
}
self.addEventListener("message", function (event) {
  const { imageData, width, height } = event.data;
  console.log("worker: ", imageData, width, height);
  // 获取底部要截取像素
  let bottom = height;
  let top = -1;
  let isTargetColorCount = 0;
  let precision = Math.floor(width * 0.1); // 一行 每几个像素检查一次
  let maxPointCount = Math.floor(width / precision); // 一行最大检查点的数量
  // 下边
  for (let y = height - 1; y > height / 2; y--) {
    // 每行第一个点判断上一行结果
    if (y !== height - 1) {
      // console.log("bottom", y + 1, isTargetColorCount, maxPointCount);
      if (isTargetColorCount >= maxPointCount) {
        bottom = y + 1;
        isTargetColorCount = 0;
      } else {
        isTargetColorCount = 0;
        break;
      }
    }
    for (let x = width - 1; x >= 0; x = x - precision) {
      const result = getColor(x, y, imageData, width, height);
      const delta = deltaE(result, [0, 0, 0, 255])
      if (y === 1689) {
        console.log("1689行: ", x, result,delta);
      }
      if (delta < 10) {
        isTargetColorCount++;
      }
    }
  }
  // 上边
  for (let y = 0; y < height; y++) {
    // 一轮首次
    if (y !== 0) {
      // console.log("top", y - 1, isTargetColorCount, maxPointCount);
      if (isTargetColorCount >= maxPointCount) {
        top = y - 1;
        isTargetColorCount = 0;
      } else {
        isTargetColorCount = 0;
        break;
      }
    }
    for (let x = 0; x < width; x++) {
      const result = getColor(x, y, imageData, width, height);
      const delta = deltaE(result, [0, 0, 0, 255]);
      // console.log("上边result: ", x, y, result);

      // 相比0, 0, 0, 255色差
      if (delta < 30) {
        isTargetColorCount++;
      }
    }
  }
  // 处理数据的代码...
  self.postMessage({ bottom, top });
});
