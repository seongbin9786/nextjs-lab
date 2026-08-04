export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export const products: Product[] = [
  {
    id: "keyboard",
    name: "기계식 키보드",
    price: 89000,
    description: "갈축 스위치, PBT 키캡, 유무선 겸용",
  },
  {
    id: "mouse",
    name: "무선 마우스",
    price: 45000,
    description: "저소음 클릭, USB-C 충전, 3대 페어링",
  },
  {
    id: "monitor",
    name: "27인치 모니터",
    price: 329000,
    description: "4K IPS, USB-C 90W 충전, 높낮이 조절",
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export type Post = {
  slug: string;
  title: string;
  body: string;
};

export const posts: Post[] = [
  {
    slug: "what-is-ssg",
    title: "SSG가 뭔가요?",
    body: "빌드 시점에 HTML을 미리 만들어 두는 방식입니다. 방문자는 서버 계산 없이 완성된 HTML을 바로 받습니다.",
  },
  {
    slug: "what-is-isr",
    title: "ISR가 뭔가요?",
    body: "정적 페이지를 일정 주기로 다시 생성하는 방식입니다. 재배포 없이 콘텐츠를 갱신할 수 있습니다.",
  },
  {
    slug: "params-are-a-promise",
    title: "params는 Promise입니다",
    body: "Next.js 15부터 params, searchParams, cookies(), headers()는 모두 Promise입니다. 반드시 await 해야 합니다.",
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
