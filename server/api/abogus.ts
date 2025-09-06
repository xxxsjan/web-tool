const sm3 = require('sm-crypto').sm3;

class ABogus {
  // 静态方法：模拟 Python 的 from_char_code
  static fromCharCode(...args) {
    return String.fromCharCode(...args);
  }

  // 静态方法：random_list - 生成随机数列表
  static randomList(a = null, b = 170, c = 85, d = 0, e = 0, f = 0, g = 0) {
    // 如果没有提供随机数，则生成一个 0-10000 之间的随机数
    const r = a || Math.random() * 10000;
    const v = [
      r,
      Math.floor(r) & 255, // int(r) & 255
      Math.floor(r) >> 8, // int(r) >> 8
    ];

    let s = (v[1] & b) | d;
    v.push(s);
    s = (v[1] & c) | e;
    v.push(s);
    s = (v[2] & b) | f;
    v.push(s);
    s = (v[2] & c) | g;
    v.push(s);

    // 返回最后四个元素
    return v.slice(-4);
  }

  // 类方法：list_1
  static list_1(random_num = null, a = 170, b = 85, c = 45) {
    return ABogus.randomList(
      random_num,
      a,
      b,
      1,
      2,
      5,
      c & a, // 位运算：c 和 a 的按位与
    );
  }

  // 类方法：list_2
  static list_2(random_num = null, a = 170, b = 85) {
    return ABogus.randomList(random_num, a, b, 1, 0, 0, 0);
  }

  // 类方法：list_3
  static list_3(random_num = null, a = 170, b = 85) {
    return ABogus.randomList(random_num, a, b, 1, 0, 5, 0);
  }

  // 类方法：generate_string_1 - 转换的目标方法
  static generateString1(
    random_num_1 = null,
    random_num_2 = null,
    random_num_3 = null,
  ) {
    // 调用 list_1, list_2, list_3 生成字符并拼接
    return (
      ABogus.fromCharCode(...ABogus.list_1(random_num_1)) +
      ABogus.fromCharCode(...ABogus.list_2(random_num_2)) +
      ABogus.fromCharCode(...ABogus.list_3(random_num_3))
    );
  }

  static generateString2(
    urlParams,
    method = 'GET',
    startTime = 0,
    endTime = 0,
  ) {
    const a = this.generateString2List(urlParams, method, startTime, endTime);
    const e = this.endCheckNum(a);
    a.push(...this.browserCode);
    a.push(e);
    return this.rc4Encrypt(this.fromCharCode(...a), 'y');
  }

  fromCharCode(...args) {
    return String.fromCharCode(...args);
  }

  endCheckNum(a) {
    let r = 0;
    for (let i = 0; i < a.length; i++) {
      r ^= a[i];
    }
    return r;
  }

  rc4Encrypt = function (plaintext, key) {
    const s = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;

    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
      [s[i], s[j]] = [s[j], s[i]]; // 交换s[i]和s[j]
    }

    let i = 0;
    j = 0;
    const cipher = [];

    for (let k = 0; k < plaintext.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      [s[i], s[j]] = [s[j], s[i]]; // 交换s[i]和s[j]
      const t = (s[i] + s[j]) % 256;
      cipher.push(String.fromCharCode(s[t] ^ plaintext.charCodeAt(k)));
    }

    return cipher.join('');
  };

  static generateResult(s, e = 's4') {
    const r = [];
    const charSets = this.__str; // 字符集对象，需要在ABogus类中定义

    // 检查字符集是否存在
    if (!charSets[e]) {
      throw new Error(`字符集 ${e} 不存在`);
    }

    for (let i = 0; i < s.length; i += 3) {
      let n;

      // 根据可用字符数量计算n值
      if (i + 2 < s.length) {
        n = (
          (s.charCodeAt(i) << 16) |
          (s.charCodeAt(i + 1) << 8) |
          s.charCodeAt(i + 2)
        );
      } else if (i + 1 < s.length) {
        n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8);
      } else {
        n = s.charCodeAt(i) << 16;
      }

      // 遍历位移和掩码对
      const shifts = [18, 12, 6, 0];
      const masks = [0xfc0000, 0x03f000, 0x0fc0, 0x3f];

      for (let j = 0; j < shifts.length; j++) {
        const shift = shifts[j];
        const mask = masks[j];

        // 根据字符串长度决定是否跳过某些位
        if (
          (shift === 6 && i + 1 >= s.length) ||
          (shift === 0 && i + 2 >= s.length)
        ) {
          break;
        }

        // 计算索引并从字符集中获取字符
        const index = (n & mask) >> shift;
        r.push(charSets[e][index]);
      }
    }

    // 添加填充字符"="
    const paddingCount = (4 - (r.length % 4)) % 4;
    r.push('='.repeat(paddingCount));

    return r.join('');
  }

  static __str = {
    s0: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    s1: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s2: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s3: 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe',
    s4: 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe',
  };
  static uaCode = [
    76,
    98,
    15,
    131,
    97,
    245,
    224,
    133,
    122,
    199,
    241,
    166,
    79,
    34,
    90,
    191,
    128,
    126,
    122,
    98,
    66,
    11,
    14,
    40, // 索引23的值为40
    49,
    110,
    110,
    173,
    67,
    96,
    138,
    252,
  ];
  static generateString2List(
    urlParams,
    method = 'GET',
    startTime = 0,
    endTime = 0,
  ) {
    // 如果没有提供时间戳，则生成当前时间戳
    startTime = startTime || Math.floor(Date.now());
    endTime = endTime || startTime + this.randInt(4, 8);

    // 生成参数和方法的编码数组
    const paramsArray = this.generateParamsCode(urlParams);
    const methodArray = this.generateMethodCode(method);

    // 调用list4方法生成最终的列表
    return this.list4(
      (endTime >> 24) & 255, // a
      paramsArray[21], // b
      this.uaCode[23], // c
      (endTime >> 16) & 255, // d
      paramsArray[22], // e
      this.uaCode[24], // f
      (endTime >> 8) & 255, // g
      (endTime >> 0) & 255, // h
      (startTime >> 24) & 255, // i
      (startTime >> 16) & 255, // j
      (startTime >> 8) & 255, // k
      (startTime >> 0) & 255, // m
      methodArray[21], // n
      methodArray[22], // o
      Math.floor(endTime / 256 / 256 / 256 / 256) >> 0, // p
      Math.floor(startTime / 256 / 256 / 256 / 256) >> 0, // q
      this.browserLen, // r
    );
  }

  static randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成参数的编码数组
   * @param {string} params - URL参数
   * @returns {number[]} 编码后的数组
   */
  static generateParamsCode(params) {
    return this.sm3ToArray(this.sm3ToArray(params + this.__endString));
  }

  /**
   * 生成请求方法的编码数组
   * @param {string} method - HTTP请求方法
   * @returns {number[]} 编码后的数组
   */
  static generateMethodCode(method = 'GET') {
    return this.sm3ToArray(this.sm3ToArray(method + this.__endString));
  }

  /**
   * 生成固定格式的数字列表
   * @param {...number} args - 17个数值参数
   * @returns {number[]} 生成的数字列表
   */
  static list4(a, b, c, d, e, f, g, h, i, j, k, m, n, o, p, q, r) {
    return [
      44,
      a,
      0,
      0,
      0,
      0,
      24,
      b,
      n,
      0,
      c,
      d,
      0,
      0,
      0,
      1,
      0,
      239,
      e,
      o,
      f,
      g,
      0,
      0,
      0,
      0,
      h,
      0,
      0,
      14,
      i,
      j,
      0,
      k,
      m,
      3,
      p,
      1,
      q,
      1,
      r,
      0,
      0,
      0,
    ];
  }

  /**
   * 计算请求体的SM3哈希值，并将结果转换为整数数组
   * Calculate the SM3 hash value of the request body and convert the result to an array of integers
   *
   * @param {string|number[]} data - 输入数据 (Input data)
   * @returns {number[]} 哈希值的整数数组 (Array of integers representing the hash value)
   */
  static sm3ToArray(data) {
    let bytes;

    // 处理输入数据，转换为字节数组
    if (typeof data === 'string') {
      // 将字符串转换为UTF-8字节数组
      const encoder = new TextEncoder();
      bytes = encoder.encode(data);
    } else {
      // 假设data是数字数组，直接转换为Uint8Array
      bytes = new Uint8Array(data);
    }

    // 这里假设存在sm3哈希函数实现，可以处理Uint8Array
    // 在实际应用中，需要引入SM3哈希算法的JavaScript实现库
    // 例如使用sm-crypto或其他支持SM3的库

    const list = Array.from(bytes);
    const hashHex = sm3(list, false);

    // 将十六进制字符串结果转换为十进制整数列表
    const result = [];
    for (let i = 0; i < hashHex.length; i += 2) {
      result.push(parseInt(hashHex.substr(i, 2), 16));
    }

    return result;
  }
}

export default ABogus;