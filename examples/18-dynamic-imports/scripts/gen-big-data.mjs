// 번들 크기 비교 데모용 "무거운" 데이터 파일을 생성합니다.
// 문자열 리터럴은 최소화 후에도 그대로 남아서 번들 크기에 영향을 줍니다.
// 사용법: node scripts/gen-big-data.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "lib"), { recursive: true });

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026);
const rows = [];
const words = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf",
  "hotel", "india", "juliet", "kilo", "lima", "mike", "november",
  "oscar", "papa", "quebec", "romeo", "sierra", "tango",
];

for (let i = 0; i < 2500; i++) {
  const label = `${words[Math.floor(rand() * words.length)]}-${words[Math.floor(rand() * words.length)]}-${i.toString(36)}`;
  const hex = Math.floor(rand() * 0xffffff).toString(16).padStart(6, "0");
  rows.push(`  { id: ${i + 1}, label: "${label}", code: "#${hex}", value: ${Math.floor(rand() * 10000)} }`);
}

const out = `// 자동 생성된 파일입니다. (scripts/gen-big-data.mjs)
// 의도적으로 크게 만들어 번들 크기 차이를 보여주는 용도입니다.
export type Row = { id: number; label: string; code: string; value: number };

export const bigData: Row[] = [
${rows.join(",\n")}
];

export function summarize(rows: Row[]) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const max = rows.reduce((m, r) => (r.value > m.value ? r : m), rows[0]);
  return { count: rows.length, total, max };
}
`;

writeFileSync(join(root, "lib", "big-data.ts"), out);
// 두 번째 사본: 같은 형태지만 "다른 파일"이어야 bundler가
// 공유 청크로 승격시키지 않습니다. (static-import 전용과
// lazy-load 전용이 각각 자기 데이터를 갖게 하려는 의도)
writeFileSync(join(root, "lib", "big-data-2.ts"), out);
console.log(`lib/big-data.ts, lib/big-data-2.ts 생성: ${(out.length / 1024).toFixed(0)}KB`);
