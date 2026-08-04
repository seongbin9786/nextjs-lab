import { PhotoModal } from "@/components/photo-modal";

// 인터셉팅 라우트. (.)photo 는 "같은 수준에서 /photo 로 가는 내비게이션"을
// 가로챕니다. 갤러리에서 Link로 이동하면 이 파일이 렌더링되어 모달을 띄웁니다.
// 반면 주소창에 직접 입력/새로고침하면 이 라우트가 매칭되지 않아
// app/photo/[id]/page.tsx(전체 페이지)가 열립니다.
export default async function PhotoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PhotoModal id={id} />;
}
