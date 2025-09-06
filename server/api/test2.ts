import axios from 'axios';

import crypto from 'sm-crypto';

const sm3 = crypto.sm3;

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
  static endCheckNum(arr) {
    let result = 0;
    for (let i = 0; i < arr.length; i++) {
      result ^= arr[i];
    }
    return result;
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
        n =
          (s.charCodeAt(i) << 16) |
          (s.charCodeAt(i + 1) << 8) |
          s.charCodeAt(i + 2);
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

function getValue(
  urlParams,
  method = 'GET',
  startTime = 0,
  endTime = 0,
  randomNum1 = null,
  randomNum2 = null,
  randomNum3 = null,
) {
  // 生成第一个字符串（对应Python中的generate_string_1）
  const string1 = ABogus.generateString1(randomNum1, randomNum2, randomNum3);

  // 处理URL参数：对象转查询字符串，否则直接使用
  const processedParams =
    typeof urlParams === 'object'
      ? new URLSearchParams(urlParams).toString()
      : urlParams;

  // 生成第二个字符串（对应Python中的generate_string_2）
  const string2 = ABogus.generateString2(
    processedParams,
    method,
    startTime,
    endTime,
  );

  // 拼接字符串
  const string = string1 + string2;

  return ABogus.generateResult(string, 's4');
}
export default defineEventHandler(async event => {
  // 获取查询参数
  // const query = getQuery(event);
  // const { url } = query;

  const config = {
    TokenManager: {
      douyin: {
        headers: {
          'Accept-Language':
            'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
          Referer: 'https://www.douyin.com/',
          Cookie:
            '__ac_nonce=067d687ac00d70af16eab; __ac_signature=_02B4Z6wo00f018O6kmgAAIDAR1H8JrcivBPDi5bAAJdBcf; ttwid=1%7C46sVJ6G5zO0ZRKBqbFef2B13U3CqP9gLwQEH8IV2y6A%7C1742112685%7Cae649397cca7dde21884d5f8e3e3d53eb2361aa64af04cd6889fa71d7f23344b; UIFID_TEMP=986fab8dfc2c74111fac2b883dbdee67777473ded35e2c4bebbf68cc8b91739da61f6b365ad9795b0aa3a8bddce6cc3e39c5d4fd4bad667aaefd3d3ec08baac66fe3b215343f12d8aae84e0a24048f44; douyin.com; device_web_cpu_core=16; device_web_memory_size=-1; architecture=amd64; hevc_supported=true; IsDouyinActive=true; home_can_add_dy_2_desktop=%220%22; dy_swidth=1835; dy_sheight=1147; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A1835%2C%5C%22screen_height%5C%22%3A1147%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A16%2C%5C%22device_memory%5C%22%3A0%2C%5C%22downlink%5C%22%3A%5C%22%5C%22%2C%5C%22effective_type%5C%22%3A%5C%22%5C%22%2C%5C%22round_trip_time%5C%22%3A0%7D%22; strategyABtestKey=%221742112685.842%22; volume_info=%7B%22isUserMute%22%3Afalse%2C%22isMute%22%3Afalse%2C%22volume%22%3A0.5%7D; stream_player_status_params=%22%7B%5C%22is_auto_play%5C%22%3A0%2C%5C%22is_full_screen%5C%22%3A0%2C%5C%22is_full_webscreen%5C%22%3A0%2C%5C%22is_mute%5C%22%3A0%2C%5C%22is_speed%5C%22%3A1%2C%5C%22is_visible%5C%22%3A1%7D%22; xgplayer_user_id=835787001711; fpk1=U2FsdGVkX19Ke0llbjXpGOOr1Jeel/2GnaSJz41VO3mAFs271jC0hG7gdWlk+2pYLM4GF8TVGtwClCJIXsTKUw==; fpk2=2333b8d335abc6e14aef1caed0ae26fc; s_v_web_id=verify_m8bcww86_XfwSCnmj_5i3F_4Joq_8edO_9gRH9JENh07f; csrf_session_id=6f34e666e71445c9d39d8d06a347a13f; FORCE_LOGIN=%7B%22videoConsumedRemainSeconds%22%3A180%7D; biz_trace_id=c34e5eaf; passport_csrf_token=ab84b3e39ad78e719b236035a27379c0; passport_csrf_token_default=ab84b3e39ad78e719b236035a27379c0; __security_mc_1_s_sdk_crypt_sdk=ac2d56c3-44cd-a161; __security_mc_1_s_sdk_cert_key=ccf2bd2d-4718-b8de; __security_mc_1_s_sdk_sign_data_key_web_protect=9995d368-4e45-b17f; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCUHR2ZDlUeGU4UlhPaWdIczFqaStJWityQlF4UWZMKytiL2drbXlYUmNrelNua1lQUjJTRVZHVlo4MWFCU0EvSW4xSnBmbzN3TFlvSnhIZTZTV29DTmc9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; bd_ticket_guard_client_web_domain=2; xg_device_score=8.208487995540095; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f27303035353c3337343437313234272927676c715a75776a716a666a69273f2763646976602778; bit_env=LVdHnIescW9BCGpo5gGuqIlwNfgj757SBdMhdZXBSWjPWbxp9Nv_B2vUt_LtEvr-ioRv0E9b8N8HWiOHe20JqcUhO4YmpIM6gB83hjgqZfmAhYEbzJR7z2bRViJaPg4xeoyGhwdjwK_Bzogp6uoUs4ov-P4JYzMh78i7jaY5Pzd6h3CaVO-eUKnTiFfUlJo_jmhSfHXGdwkurXwR4lO_UnU4Loqa0YlmDiyi0fPxURFIN5t4Ny6Ua8LLSYcUrBXHlXoQ5G4bQN4XqwuWwT9YauexXbkotU1Jv8pMJUiAhlFIMjbvfTutTSnOXJLoH_JsR_doifURl0wf8CIa_OcYw-A2VglrpbaFU6HDVTKbSRKovzIMY9bUwl_4EAiLBf87g2BU0Uz1MHd_lGNdH3ImEWpLtdRvUsW_KD7q87rPsEGVTceyQ5U3ZlETqoEOwOiggNGu5lL_1O8lt8_7eydeGA%3D%3D; gulu_source_res=eyJwX2luIjoiM2Y3NGJhZDgxMzc3OThkNmVkN2U5ZjM3NDMzNGJkYjMwNzRhYjI0ZWJhMDZkMzdmYWNiNjgzNTY2ZjY0OGUyNCJ9; passport_auth_mix_state=c534f2qcgpohqv4juisp74wq28e90snz',
        },
        proxies: {
          http: '',
          https: '',
        },
        msToken: {
          url: 'https://mssdk.bytedance.com/web/report',
          magic: 538969122,
          version: 1,
          dataType: 8,
          strData:
            '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',
          'User-Agent':
            '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47',
        },
        ttwid: {
          url: 'https://ttwid.bytedance.com/ttwid/union/register/',
          data: '{"region":"cn","aid":1768,"needFid":false,"service":"www.ixigua.com","migrate_info":{"ticket":"","source":"node"},"cbUrlProtocol":"https","union":true}',
        },
      },
    },
  };
  const aweme_id = '1212';

  const baseRequestModel: any = {
    aweme_id,
    device_platform: 'webapp',
    aid: '6383',
    channel: 'channel_pc_web',
    pc_client_type: 1,
    version_code: '290100',
    version_name: '29.1.0',
    cookie_enabled: 'true',
    screen_width: 1920,
    screen_height: 1080,
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Chrome',
    browser_version: '130.0.0.0',
    browser_online: 'true',
    engine_name: 'Blink',
    engine_version: '130.0.0.0',
    os_name: 'Windows',
    os_version: '10',
    cpu_core_num: 12,
    device_memory: 8,
    platform: 'PC',
    downlink: '10',
    effective_type: '4g',
    from_user_page: '1',
    locate_query: 'false',
    need_time_list: '1',
    pc_libra_divert: 'Windows',
    publish_video_strategy_type: '2',
    round_trip_time: '0',
    show_live_replay_strategy: '1',
    time_list_query: '0',
    whale_cut_token: '',
    update_version_code: '170400',
    // msToken: TokenManager.gen_real_msToken(), // 保持与原逻辑一致的方法调用
    msToken: '',
  };
  console.log(getValue(baseRequestModel));
  const a_bogus = '';

  const url = `https://www.douyin.com/aweme/v1/web/aweme/detail/?${new URLSearchParams(
    baseRequestModel,
  ).toString()}&a_bogus=${a_bogus}`;
  const response = await axios(url as string, {
    method: 'GET',
    headers: config.TokenManager.douyin.headers,
  });
  // 返回响应数据
  return {
    status: 'success',
    message: `success!`,
    data: {
      timestamp: Date.now(),
      url: response.request.res.responseUrl,
    },
  };
});
