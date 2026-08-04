export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
};

export const products: Product[] = [
  {
    id: "keyboard",
    name: "기계식 키보드 K1",
    price: 89000,
    description: "갈축 스위치와 PBT 키캡을 갖춘 유무선 겸용 키보드",
    category: "전자기기",
  },
  {
    id: "mouse",
    name: "무선 마우스 M2",
    price: 45000,
    description: "저소음 클릭과 USB-C 충전을 지원하는 3대 페어링 마우스",
    category: "전자기기",
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
