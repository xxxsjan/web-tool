function getColor(x, y, imageData, width, height) {
  const i = y * width * 4 + x * 4;
  return [
    imageData.data[i],
    imageData.data[i + 1],
    imageData.data[i + 2],
    imageData.data[i + 3]
  ];
}
function deltaE(lab1, lab2) {
  let deltaL = lab1[0] - lab2[0];
  let deltaA = lab1[1] - lab2[1];
  let deltaB = lab1[2] - lab2[2];
  let deltaE = Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);
  return deltaE;
}
self.addEventListener('message', function (event) {
  const { imageData, width, height, start, end } = event.data;
  console.log('worker: ', imageData, width, height);
  // 获取底部要截取像素
  let bottom = end || height;
  let top = start - 1;
  let similarCount = 0;
  let precision = Math.floor(width * 0.1); // 一行 每几个像素检查一次
  let removeFlag = Math.floor((width / precision) * 0.6); //  每行抽样的点，有60%符合即可满足移除条件
  // 下边
  let yEnd = end || height - 1;
  for (let y = yEnd; y > height / 2; y--) {
    // 每行第一个点判断上一行结果
    if (y !== yEnd) {
      // console.log("bottom", y + 1, similarCount, removeFlag);
      if (similarCount >= removeFlag) {
        bottom = y + 1;
        similarCount = 0;
      } else {
        similarCount = 0;
        break;
      }
    }
    for (let x = width - 1; x >= 0; x = x - precision) {
      const result = getColor(x, y, imageData, width, height); // number[]
      const delta = deltaE(result, [0, 0, 0, 255]);

      if (delta < 52) {
        similarCount++;
      } else {
        // console.log(
        //   `%c ${y}行${x}像素：`,
        //   `background-color:rgba(${result.toString()})`,
        //   result,
        //   delta
        // );
      }
    }
  }
  console.log('bottom: ', bottom);
  // 上边
  let yStart = start || 0;
  for (let y = yStart; y < height; y++) {
    // 一轮首次
    if (y !== yStart) {
      // console.log("top", y - 1, similarCount, removeFlag);
      if (similarCount >= removeFlag) {
        top = y - 1;
        similarCount = 0;
      } else {
        similarCount = 0;
        break;
      }
    }
    for (let x = 0; x < width; x = x + precision) {
      const result = getColor(x, y, imageData, width, height);
      const delta = deltaE(result, [0, 0, 0, 255]);
      // console.log("上边result: ", x, y, result, delta, similarCount);

      // 相比0, 0, 0, 255颜色接近
      if (delta < 30) {
        similarCount++;
      }
    }
  }
  // 处理数据的代码...
  self.postMessage({ bottom, top });
});
