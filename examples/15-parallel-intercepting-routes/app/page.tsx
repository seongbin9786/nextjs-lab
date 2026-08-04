import Link from "next/link";

const photos = Array.from({ length: 6 }, (_, i) => i + 1);

export default function GalleryPage() {
  return (
    <div className="container">
      <h1>갤러리</h1>
      <p>
        썸네일을 클릭해보세요. 페이지가 이동하지 않고{" "}
        <strong>모달</strong>이 뜹니다. 주소는 <code>/photo/1</code>로
        바뀌지만, 화면에는 갤러리 위에 모달만 겹쳐집니다.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {photos.map((id) => (
          <Link key={id} href={`/photo/${id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/photos/${id}.svg`}
              alt={`사진 ${id}`}
              style={{ width: "100%", borderRadius: 10, display: "block" }}
            />
          </Link>
        ))}
      </div>
      <div className="note">
        <p style={{ margin: 0 }}>
          이 모달은 <strong>인터셉팅 라우트</strong>가 만든 것입니다. 같은
          주소를 주소창에 직접 입력하거나 새로고침하면 모달 대신{" "}
          <Link href="/photo/1">전체 사진 페이지</Link>가 열립니다.
        </p>
      </div>
    </div>
  );
}
