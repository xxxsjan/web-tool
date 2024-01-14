// -转驼峰
function transf(str = 'z-index') {
  console.log(
    str.replace(/-([a-z]?)/g, (...args) => {
      return args[1].toLocaleUpperCase();
    })
  );
}
// 测试
// transf('content-type');
