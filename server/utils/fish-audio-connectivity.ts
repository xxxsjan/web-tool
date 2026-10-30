import { setDefaultResultOrder } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { connect, isIPv4, isIPv6 } from 'node:net';
import { normalizeFishAudioApiBase } from '~/utils/fish-audio-tts';

// Fish Audio 在部分网络下 IPv6 解析异常（甚至落到无关网段），统一优先 IPv4
try {
  setDefaultResultOrder('ipv4first');
} catch {
  /* Node < 16.13 无此 API */
}

export type FishAudioConnectivityResult = {
  ok: boolean;
  apiBase: string;
  host: string;
  port: number;
  dns: {
    ok: boolean;
    addresses: string[];
    ms: number;
    error?: string;
    note?: string;
  };
  tcp: {
    ok: boolean;
    address?: string;
    tried?: string[];
    ms: number;
    error?: string;
  };
  https: {
    ok: boolean;
    status?: number;
    ms: number;
    error?: string;
  };
  /** 给人看的一句话结论 */
  message: string;
};

function parseApiHost(apiBase: string) {
  try {
    const u = new URL(apiBase);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : u.protocol === 'http:' ? 80 : 443,
      origin: `${u.protocol}//${u.host}`,
    };
  } catch {
    return {
      host: 'api.fish.audio',
      port: 443,
      origin: 'https://api.fish.audio',
    };
  }
}

/** IPv4 优先，便于绕过异常 IPv6 */
function sortAddresses(addresses: string[]) {
  return [...addresses].sort((a, b) => {
    const sa = isIPv4(a) ? 0 : isIPv6(a) ? 1 : 2;
    const sb = isIPv4(b) ? 0 : isIPv6(b) ? 1 : 2;
    return sa - sb;
  });
}

/** 已知异常：Meta/Facebook 网段常被污染到无关域名上 */
function looksLikePollutedIpv6(addr: string) {
  return /^2a03:2880:/i.test(addr);
}

function tcpConnect(
  host: string,
  port: number,
  timeoutMs: number,
): Promise<{ ok: boolean; ms: number; error?: string }> {
  const started = Date.now();
  return new Promise(resolve => {
    const socket = connect({ host, port, family: isIPv6(host) ? 6 : 4 });
    let settled = false;

    const finish = (ok: boolean, error?: string) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve({ ok, ms: Date.now() - started, error });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, `TCP 连接超时（${timeoutMs}ms）`));
    socket.once('error', (err: Error & { code?: string }) =>
      finish(false, err.code || err.message || 'TCP 连接失败'),
    );
  });
}

/**
 * 检测本机到 Fish Audio API 的 DNS / TCP / HTTPS 可达性。
 * 不消耗合成额度：只探测连通，不调用 TTS。
 */
export async function checkFishAudioConnectivity(options?: {
  apiBase?: string;
  timeoutMs?: number;
}): Promise<FishAudioConnectivityResult> {
  const apiBase = normalizeFishAudioApiBase(options?.apiBase);
  const timeoutMs = Math.min(20000, Math.max(3000, options?.timeoutMs ?? 8000));
  const { host, port, origin } = parseApiHost(apiBase);

  const dns: FishAudioConnectivityResult['dns'] = {
    ok: false,
    addresses: [],
    ms: 0,
  };
  const tcp: FishAudioConnectivityResult['tcp'] = {
    ok: false,
    ms: 0,
    tried: [],
  };
  const https: FishAudioConnectivityResult['https'] = {
    ok: false,
    ms: 0,
  };

  const dnsStarted = Date.now();
  try {
    const records = await lookup(host, { all: true });
    const sorted = sortAddresses(records.map(r => r.address));
    dns.ok = sorted.length > 0;
    dns.addresses = sorted;
    dns.ms = Date.now() - dnsStarted;
    const polluted = sorted.filter(looksLikePollutedIpv6);
    if (polluted.length) {
      dns.note = `检测到可疑 IPv6（${polluted.join(', ')}），疑似 DNS 污染，已优先探测 IPv4`;
    }
  } catch (err: any) {
    dns.ok = false;
    dns.ms = Date.now() - dnsStarted;
    dns.error = err?.code || err?.message || 'DNS 解析失败';
  }

  if (dns.ok && dns.addresses.length) {
    const errors: string[] = [];
    for (const addr of dns.addresses) {
      tcp.tried!.push(addr);
      const tcpResult = await tcpConnect(addr, port, timeoutMs);
      if (tcpResult.ok) {
        tcp.ok = true;
        tcp.address = addr;
        tcp.ms = tcpResult.ms;
        break;
      }
      errors.push(`${addr}: ${tcpResult.error || '失败'}`);
      // 单个地址失败后继续试下一个（尤其是跳过异常 IPv6）
    }
    if (!tcp.ok) {
      tcp.ms = timeoutMs;
      tcp.address = dns.addresses.find(isIPv4) || dns.addresses[0];
      tcp.error = errors.join('；') || '全部地址 TCP 失败';
    }
  } else {
    tcp.error = '跳过：DNS 未成功';
  }

  if (tcp.ok) {
    const httpsStarted = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // 故意用不存在的路径：能拿到 HTTP 响应即说明 TLS+路由通（已 ipv4first）
      const res = await fetch(`${origin}/v1/__connectivity_probe__`, {
        method: 'GET',
        signal: controller.signal,
      });
      https.ok = true;
      https.status = res.status;
      https.ms = Date.now() - httpsStarted;
    } catch (err: any) {
      https.ok = false;
      https.ms = Date.now() - httpsStarted;
      const cause = err?.cause;
      const code = String(cause?.code || err?.code || '');
      const msg = String(cause?.message || err?.message || '');
      if (code === 'UND_ERR_CONNECT_TIMEOUT' || /Connect Timeout/i.test(msg)) {
        https.error = `HTTPS 连接超时（${timeoutMs}ms）`;
      } else if (err?.name === 'AbortError') {
        https.error = `HTTPS 请求超时（${timeoutMs}ms）`;
      } else {
        https.error = code || msg || 'HTTPS 请求失败';
      }
    } finally {
      clearTimeout(timer);
    }
  } else {
    https.error = '跳过：TCP 未连通';
  }

  let message = '';
  if (dns.ok && tcp.ok && https.ok) {
    message = `Fish Audio 可达（${host} → ${tcp.address} · DNS ${dns.ms}ms · TCP ${tcp.ms}ms · HTTPS ${https.ms}ms）`;
  } else if (!dns.ok) {
    message = `DNS 解析失败：${dns.error || host}`;
  } else if (!tcp.ok) {
    const hint = dns.note ? ` ${dns.note}。` : '';
    message = `无法 TCP 连接 ${host}:${port}（已试 ${tcp.tried?.join(', ') || '无地址'}）。${hint}多为网络/防火墙限制，请开代理或配置 FISH_API_BASE`;
  } else {
    message = `TCP 通但 HTTPS 失败：${https.error || '未知错误'}。请检查代理 HTTPS 或证书设置`;
  }

  return {
    ok: dns.ok && tcp.ok && https.ok,
    apiBase,
    host,
    port,
    dns,
    tcp,
    https,
    message,
  };
}
