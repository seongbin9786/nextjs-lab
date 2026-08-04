import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>이미지 최적화 (next/image)</h1>
      <p>
        <code>next/image</code>는 이미지 서빙을 최적화 계층으로 바꿉니다:
        자동 리사이징, 최신 포맷(AVIF/WebP) 변환, 지연 로딩, 레이아웃
        이동 방지.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/plain">그냥 img 태그</Link>
          </h3>
          <p>
            원본 JPEG(약 1.7MB)을 그대로 받는 비교군입니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/optimized">next/image</Link>
          </h3>
          <p>
            같은 이미지를 브라우저에 맞춰 AVIF/WebP로, 필요한 크기로만
            받습니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/props">주요 props</Link>
          </h3>
          <p>
            <code>fill</code>, <code>sizes</code>, <code>priority</code>,{" "}
            <code>placeholder</code>를 한눈에.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/benchmark">정량 비교</Link>
          </h3>
          <p>실제 전송 바이트 수를 잰 결과와 재현 스크립트.</p>
        </div>
      </div>

      <div className="note">
        <p style={{ margin: 0 }}>
          정량 측정은 <code>scripts/bench.sh</code>로도 재현할 수 있습니다.
          원본 JPEG과 <code>/_next/image</code> 최적화 응답의 바이트 수를
          curl로 비교합니다.
        </p>
      </div>
    </div>
  );
}
