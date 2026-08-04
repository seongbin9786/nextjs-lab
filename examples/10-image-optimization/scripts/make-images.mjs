// 의존성 없이 PNG/JPG 예시 이미지를 생성하는 스크립트.
// 사용법: node scripts/make-images.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images");
mkdirSync(outDir, { recursive: true });

// ---------- 최소 PNG 인코더 ----------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgbAt) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = rgbAt(x, y);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- 이미지 생성 ----------
// 결정적 의사난수 (이미지가 매번 달라지지 않도록)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1) 그라데이션 + 노이즈 혼합의 큰 원본 (2400x1600)
const W = 2400;
const H = 1600;
const rand = mulberry32(42);
const noise = new Float32Array(W * H);
for (let i = 0; i < noise.length; i++) noise[i] = rand();

const heroPng = encodePng(W, H, (x, y) => {
  const gx = x / W;
  const gy = y / H;
  const n = noise[y * W + x] * 28; // 노이즈를 섞어 압축이 덜 되게 함
  const r = Math.min(255, 30 + gx * 160 + n);
  const g = Math.min(255, 60 + gy * 120 + n);
  const b = Math.min(255, 120 + (1 - gx) * 130 + n);
  return [r, g, b];
});
writeFileSync(join(outDir, "hero.png"), heroPng);
console.log(`hero.png: ${(heroPng.length / 1024).toFixed(0)}KB (${W}x${H})`);

// 2) 작은 썸네일 (400x300)
const TW = 400;
const TH = 300;
const thumbPng = encodePng(TW, TH, (x, y) => {
  const cx = x - TW / 2;
  const cy = y - TH / 2;
  const d = Math.sqrt(cx * cx + cy * cy) / (TW / 2);
  const r = Math.min(255, 250 - d * 180);
  const g = Math.min(255, 120 + d * 60);
  const b = Math.min(255, 60 + d * 140);
  return [r, g, b];
});
writeFileSync(join(outDir, "thumb.png"), thumbPng);
console.log(`thumb.png: ${(thumbPng.length / 1024).toFixed(0)}KB (${TW}x${TH})`);

// 3) hero를 JPEG로도 변환 (macOS sips 사용)
try {
  execSync(
    `sips -s format jpeg -s formatOptions 90 "${join(outDir, "hero.png")}" --out "${join(outDir, "hero.jpg")}"`,
    { stdio: "pipe" },
  );
  console.log("hero.jpg: 생성 완료");
} catch {
  console.log("sips 불가 — hero.jpg 생략");
}
