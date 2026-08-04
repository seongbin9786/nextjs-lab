// 번들 크기 비교 데모용 상품 카탈로그 데이터를 생성합니다.
// 사용법: node scripts/gen-catalog.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "lib"), { recursive: true });

const adjectives = [
  "견고한", "가벼운", "조용한", "빠른", "휴대용", "무선", "접이식",
  "인체공학", "저소음", "고해상도", "광각", "초슬림",
];
const nouns = [
  "키보드", "마우스", "모니터 받침대", "노트북 스탠드", "웹캠", "마이크",
  "허브", "충전기", "케이블", "파우치", "조명", "헤드셋",
];
const details = [
  "하루 종일 사용해도 피로가 적도록 설계되었습니다.",
  "출장이나 이동이 많은 사용자에게 적합합니다.",
  "설치가 간편하고 별도 드라이버가 필요 없습니다.",
  "기존 장비와 폭넓게 호환됩니다.",
  "마감이 우수하고 장기간 사용에도 내구성이 좋습니다.",
  "공간을 적게 차지해 좁은 책상에도 어울립니다.",
];

const rows = [];
for (let i = 1; i <= 260; i++) {
  const name = `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i}`;
  const desc = `${details[i % details.length]} ${details[(i + 3) % details.length]} 품번 ${i.toString(36).toUpperCase()} 모델입니다.`;
  const price = 10000 + ((i * 7919) % 90) * 1000;
  rows.push(`  { id: ${i}, name: "${name}", price: ${price}, description: "${desc}" }`);
}

const out = `// 자동 생성 파일 (scripts/gen-catalog.mjs). 번들 비교 데모용입니다.
export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
};

export const catalog: Product[] = [
${rows.join(",\n")}
];
`;

writeFileSync(join(root, "lib", "catalog.ts"), out);
console.log(`lib/catalog.ts 생성: ${(out.length / 1024).toFixed(0)}KB`);
