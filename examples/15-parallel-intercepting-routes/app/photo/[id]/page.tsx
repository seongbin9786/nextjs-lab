import Link from "next/link";

export const metadata = {
  title: "사진 상세",
};

// 직접 접속/새로고침 시 열리는 "전체 페이지" 버전.
// 클라이언트 내비게이션일 때는 @modal의 인터셉팅 라우트가 대신 열립니다.
export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">갤러리</Link> <span>/</span> <span>photo/{id}</span>
      </nav>
      <h1>사진 #{id} (전체 페이지)</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/photos/${id}.svg`}
        alt={`사진 ${id}`}
        style={{ width: "100%", borderRadius: 12 }}
      />
      <div className="note">
        <p style={{ margin: 0 }}>
          이 페이지는 <strong>주소창에서 직접 들어왔거나 새로고침</strong>{" "}
          했을 때만 보입니다. 갤러리에서 썸네일을 클릭하면 같은 주소라도
          인터셉팅 라우트가 가로채서 모달로 보여줍니다. 뒤로가기 버튼으로
          비교해보세요.
        </p>
      </div>
      <p>
        <Link href="/">← 갤러리로</Link>
      </p>
    </div>
  );
}
