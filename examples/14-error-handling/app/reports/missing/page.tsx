import { notFound } from "next/navigation";

// 존재하지 않는 리소스를 요청받으면 throw 대신 notFound()를 호출합니다.
// 그러면 가장 가까운 not-found.tsx가 렌더링됩니다.
export default function MissingPage() {
  notFound();
}
