// server/utils/edge-gec.ts
// Sec-MS-GEC v2 token generation for Microsoft Edge TTS
// Pure TypeScript port of edge-tts official drm.py
// Runs on Node.js / Vercel Serverless without Python

const U32_MASK = 0xffffffffn;

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = 11644473600n;
const S_TO_NS = 1000000000n;

// SHA-256 initial hash values
export const SHA256_INITIAL: bigint[] = [
  0x6a09e667n, 0xbb67ae85n, 0x3c6ef372n, 0xa54ff53an,
  0x510e527fn, 0x9b05688cn, 0x1f83d9abn, 0x5be0cd19n,
];

// SHA-256 state constants (from edge-tts drm.py)
export const SHA256_STATE: bigint[] = [
  0xfd9fbea2n, 0x91243ce7n, 0xbe499094n, 0xcd2e1e0an,
  0x6c006f49n, 0x04bd35abn, 0xfeb0a7e4n, 0x03effbd2n,
];

// SHA-256 schedule constants (from edge-tts drm.py, used for init only)
const SHA256_SCHEDULE: bigint[] = [
  0xEB24BF9En, 0x1558691Fn, 0xA0C09EE2n, 0x0CFA32BAn,
  0xA622EE8Cn, 0xD1DD9491n, 0xC0DD25A0n, 0xF9E70AB6n,
  0xF0C31573n, 0x7058CE4En, 0x7188E606n, 0x00E5AB33n,
  0xD258B060n, 0x72766564n,
];

// SHA-256 round constants (standard K[0..63], index 14 will be replaced with ADJUSTMENT)
const SHA256_ROUND_CONSTANTS: bigint[] = [
  0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n,
  0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n,
  0xd807aa98n, 0x12835b01n, 0x243185ben, 0x550c7dc3n,
  0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n,
  0xe49b69c1n, 0xefbe4786n, 0xfc19dc6n, 0x240ca1ccn,
  0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan,
  0x983e5152n, 0xa831c66dn, 0xb00327c8n, 0xbf597fc7n,
  0xc6e00bf3n, 0xd5a79147n, 0x6ca6351n, 0x14292967n,
  0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n,
  0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n,
  0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n,
  0xd192e819n, 0xd6990624n, 0xf40e3585n, 0x106aa070n,
  0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n,
  0x391c0cb3n, 0x4ed8aa4an, 0x5b9cca4fn, 0x682e6ff3n,
  0x748f82een, 0x78a5636fn, 0x84c87814n, 0x8cc70208n,
  0x90befffan, 0xa4506cebn, 0xbef9a3f7n, 0xc67178f2n,
];

const SHA256_ADJUSTMENT = 0xc9dc06a7n;
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80n;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0n;

export const SHA256_BLOCK_CONSTANTS: bigint[] = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15),
];

// CS64 constants
const CS64_COEFFICIENTS: [bigint, bigint][] = [
  [0xe82e91b1n, 0xb32700d0n],
  [0x44de24c6n, 0x88dff51dn],
  [0x3beb65bcn, 0x29514038n],
  [0xc89c5933n, 0xb328cbdfn],
  [0x8d1ec211n, 0xd405b4d5n],
  [0x314ef5d5n, 0x26e55f3cn],
  [0xe92491b1n, 0x607801c6n],
  [0xf0a5b9d5n, 0x82b2c1fbn],
  [0x06064cf3n, 0xfa51a3dan],
  [0xda79fa60n, 0x207cc464n],
  [0xbed20560n, 0x3c3c74f3n],
  [0x89f9c9f8n, 0xd2d14b61n],
  [0x35fa38c6n, 0xbb04a2c1n],
  [0xcb49e3c6n, 0xc5626167n],
];

const CS64_FACTOR = 0x82893933n;
const CS64_ADJUSTMENT0 = 0xf2f90b1an;
const CS64_ADJUSTMENT1 = 0x0b1a0000n;

const WORD_MUL = 0x100000001n;

function u32(n: bigint): bigint {
  return n & U32_MASK;
}

function rol16(value: bigint): bigint {
  value &= U32_MASK;
  return u32((value << 16n) | (value >> 16n));
}

function sigma0(value: bigint): bigint {
  return u32(
    (value >> 7n) ^ (value << 25n) ^ (value >> 18n) ^ (value << 14n) ^ (value >> 3n),
  );
}

function sigma1(value: bigint): bigint {
  return u32(
    (value >> 17n) ^ (value << 15n) ^ (value >> 19n) ^ (value << 13n) ^ (value >> 10n),
  );
}

function wordsLE4Even(data: Uint8Array): bigint[] {
  const padLen = ((4 - (data.length % 4)) % 4);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);

  const words: bigint[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    words.push(
      BigInt(padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)),
    );
  }
  if (words.length % 2 === 1) words.push(0n);
  return words;
}

function expandSchedule(words: bigint[], firstWord = 16): void {
  for (let index = firstWord; index < 64; index++) {
    const x = words[index - 2];
    const y = words[index - 15];
    // Inline sigma computations WITHOUT masking — high bits retained
    // until the final sum (matches Python _expand_sha256_schedule).
    const s1 = (x >> 17n) ^ (x << 15n) ^ (x >> 19n) ^ (x << 13n) ^ (x >> 10n);
    const s0 = (y >> 7n) ^ (y << 25n) ^ (y >> 18n) ^ (y << 14n) ^ (y >> 3n);
    words[index] = u32(s1 + words[index - 7] + s0 + words[index - 16]);
  }
}

function sha256Rounds(
  state: bigint[],
  words: bigint[],
  firstRound = 0,
): bigint[] {
  let [a, b, c, d, e, f, g, h] = state;
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8);

  // Phase 1: standard loop from firstRound to aligned
  for (let index = firstRound; index < aligned; index++) {
    const rot_e = e * WORD_MUL;
    const rot_a = a * WORD_MUL;
    const t1 =
      h +
      (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
      (g ^ (e & (f ^ g))) +
      constants[index] +
      words[index];
    const t2 =
      (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) +
      ((a & b) | (c & (a | b)));
    [a, b, c, d, e, f, g, h] = [
      u32(t1 + t2), a, b, c, u32(d + t1), e, f, g,
    ];
  }

  // Phase 2: unrolled 8-round groups with rotated variable roles
  for (let index = aligned; index < 64; index += 8) {
    {
      const rot_e = e * WORD_MUL;
      const rot_a = a * WORD_MUL;
      const t1 =
        h +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (g ^ (e & (f ^ g))) +
        constants[index] +
        words[index];
      d = u32(d + t1);
      h = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((a & b) | (c & (a | b))));
    }
    {
      const rot_e = d * WORD_MUL;
      const rot_a = h * WORD_MUL;
      const t1 =
        g +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (f ^ (d & (e ^ f))) +
        constants[index + 1] +
        words[index + 1];
      c = u32(c + t1);
      g = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((h & a) | (b & (h | a))));
    }
    {
      const rot_e = c * WORD_MUL;
      const rot_a = g * WORD_MUL;
      const t1 =
        f +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (e ^ (c & (d ^ e))) +
        constants[index + 2] +
        words[index + 2];
      b = u32(b + t1);
      f = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((g & h) | (a & (g | h))));
    }
    {
      const rot_e = b * WORD_MUL;
      const rot_a = f * WORD_MUL;
      const t1 =
        e +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (d ^ (b & (c ^ d))) +
        constants[index + 3] +
        words[index + 3];
      a = u32(a + t1);
      e = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((f & g) | (h & (f | g))));
    }
    {
      const rot_e = a * WORD_MUL;
      const rot_a = e * WORD_MUL;
      const t1 =
        d +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (c ^ (a & (b ^ c))) +
        constants[index + 4] +
        words[index + 4];
      h = u32(h + t1);
      d = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((e & f) | (g & (e | f))));
    }
    {
      const rot_e = h * WORD_MUL;
      const rot_a = d * WORD_MUL;
      const t1 =
        c +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (b ^ (h & (a ^ b))) +
        constants[index + 5] +
        words[index + 5];
      g = u32(g + t1);
      c = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((d & e) | (f & (d | e))));
    }
    {
      const rot_e = g * WORD_MUL;
      const rot_a = c * WORD_MUL;
      const t1 =
        b +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (a ^ (g & (h ^ a))) +
        constants[index + 6] +
        words[index + 6];
      f = u32(f + t1);
      b = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((c & d) | (e & (c | d))));
    }
    {
      const rot_e = f * WORD_MUL;
      const rot_a = b * WORD_MUL;
      const t1 =
        a +
        (rot_e >> 6n ^ rot_e >> 11n ^ rot_e >> 25n) +
        (h ^ (f & (g ^ h))) +
        constants[index + 7] +
        words[index + 7];
      e = u32(e + t1);
      a = u32(t1 + (rot_a >> 2n ^ rot_a >> 13n ^ rot_a >> 22n) + ((b & c) | (d & (b | c))));
    }
  }

  return [a, b, c, d, e, f, g, h];
}

export function sha256Init(data: Uint8Array): bigint[] {
  const words: bigint[] = new Array(14).fill(0n);
  // int.from_bytes(data[:3], "big") - 3 bytes interpreted as big-endian
  words.push(BigInt((data[0] << 16) | (data[1] << 8) | data[2]));
  // int.from_bytes(data[3:7], "big") - 4 bytes interpreted as big-endian
  words.push(
    BigInt(data[3] << 24) | BigInt(data[4] << 16) | BigInt(data[5] << 8) | BigInt(data[6]),
  );

  for (let index = 16; index < 30; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      const s1 =
        index === 16
          ? sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT
          : sigma1(words[index - 2]);
      value += s1;
    }
    if (index - 7 >= 14) {
      value += words[index - 7];
    }
    if (index - 15 >= 14) {
      const s0 =
        index === 29
          ? sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT
          : sigma0(words[index - 15]);
      value += s0;
    }
    words.push(u32(value));
  }

  words.push(
    u32(
      sigma1(words[28]) +
        words[23] +
        sigma0(words[15]) +
        words[14] +
        SHA256_ADJUSTMENT -
        SHA256_ROUND_CONSTANTS[14],
    ),
  );

  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return working.map((v, i) => u32(v + SHA256_INITIAL[i]));
}

export function sha256Digest(data: Uint8Array): Buffer {
  if (data.length < 7) {
    throw new Error('Token salt must contain at least seven bytes');
  }

  const length = 57 + data.length;
  const padLen = ((55 - length) % 64 + 64) % 64;

  const dataAfterSalt = data.subarray(7);
  const padded = Buffer.concat([
    Buffer.from(dataAfterSalt),
    Buffer.from([0x80]),
    Buffer.alloc(padLen),
    Buffer.alloc(8),
  ]);
  padded.writeBigUInt64BE(BigInt(length * 8), padded.length - 8);

  let state = sha256Init(data.subarray(0, 7));
  for (let offset = 0; offset < padded.length; offset += 64) {
    const block = padded.subarray(offset, offset + 64);
    const words: bigint[] = [];
    for (let i = 0; i < 16; i++) {
      words.push(BigInt(block.readUInt32BE(i * 4)));
    }
    expandSchedule(words);
    const working = sha256Rounds(state, words);
    state = working.map((v, i) => u32(v + state[i]));
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 8; i++) {
    out.writeUInt32BE(Number(state[i]), i * 4);
  }
  return out;
}

export function cs64Digest(data: Uint8Array, digest: Buffer): [bigint, bigint] {
  const keyA = BigInt(digest.readUInt32LE(0)) | 1n;
  const keyB = BigInt(digest.readUInt32LE(4)) | 1n;

  const factors = [u32(keyA * CS64_FACTOR), u32(keyB * CS64_FACTOR)];

  const terms: bigint[] = [];
  const offsets: bigint[] = [];

  for (let i = 0; i < CS64_COEFFICIENTS.length; i++) {
    const [coefficient, offset] = CS64_COEFFICIENTS[i];
    terms.push(u32(coefficient * factors[i % 2]));
    offsets.push(offset);
  }

  const words = wordsLE4Even(Uint8Array.from([0, ...data]));

  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    let term = u32(word * (index % 2 === 0 ? keyA : keyB));
    let offset = u32(
      rol16(word) * (index % 2 === 0 ? 0xef0569fbn : 0xc31713dbn),
    );

    if (index === 0) {
      term = u32(term + CS64_ADJUSTMENT0 * factors[0]);
      offset = u32(offset + CS64_ADJUSTMENT1);
    }

    terms.push(term);
    offsets.push(offset);
  }

  let swapAcc = 0n, swapLast = 0n, state = 0n, acc = 0n;
  for (let index = 0; index + 1 < terms.length; index += 2) {
    const x = terms[index];
    const y = terms[index + 1];

    let t = rol16(u32(offsets[index] + x));
    let q = u32(t * 0x76f50f34n);
    swapAcc = u32(swapAcc + u32(rol16(q) * 0xc3efea97n + q));

    t = rol16(u32(offsets[index + 1] + y));
    q = u32(t * 0x1881ce3cn);
    swapLast = u32(rol16(q) * 0x35bd1ec9n + q);
    swapAcc = u32(swapAcc + swapLast);

    state = u32(state * keyA + x);
    state = u32(rol16(state) * 0xcf98b111n);
    state = u32(rol16(state) * 0x87085b9fn);
    state = u32(rol16(state) * 0x12ceb96dn);
    state = u32(rol16(state) * 0x257e1d83n);
    acc = u32(acc + state);

    let tt = u32(state * keyB + y);
    tt = u32(rol16(tt) * 0xa27416f5n);
    tt = u32(rol16(tt) * 0xd38396ffn);
    state = u32(rol16(u32(rol16(tt) * 0x7c932b89n)) * 0xbfa49f69n);
    acc = u32(acc + state);
  }

  return [swapLast ^ state, swapAcc ^ acc];
}

/**
 * Generates a v2 Sec-MS-GEC token value.
 * The token combines CS64 and SHA256 digests in the format "<16 hex>-<64 hex>".
 */
export function generateSecMsGecV2(unixTimestamp?: number): string {
  // Replicate Python:
  // ticks = float(unix_timestamp)
  // ticks += WIN_EPOCH
  // ticks -= ticks % 300
  // ticks *= S_TO_NS / 100  # = 1e7
  let ticks = BigInt(unixTimestamp ?? Math.floor(Date.now() / 1000));
  ticks += WIN_EPOCH;
  ticks -= ticks % 300n;
  ticks *= S_TO_NS / 100n;

  const strToHash = `${ticks}${TRUSTED_CLIENT_TOKEN}`;
  const data = Uint8Array.from(strToHash.split('').map((c) => c.charCodeAt(0)));

  const digest = sha256Digest(data);
  const [cs64A, cs64B] = cs64Digest(data, digest);

  // struct.pack("<II", a, b) — little-endian
  const cs64Buf = Buffer.alloc(8);
  cs64Buf.writeUInt32LE(Number(cs64A), 0);
  cs64Buf.writeUInt32LE(Number(cs64B), 4);
  const cs64 = cs64Buf.toString('hex').toUpperCase();

  return `${cs64}-${digest.toString('hex').toUpperCase()}`;
}
