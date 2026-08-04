import Link from "next/link";

export default function PlainPage() {
  return (
    <div className="container">
      <h1>그냥 img 태그</h1>
      <p>
        <code>{"<img src=\"/images/hero.jpg\">"}</code> — 원본을 그대로
        다운로드합니다.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero.jpg"
        alt="원본 그대로 로드되는 이미지"
        style={{ width: "100%", borderRadius: 12 }}
      />
      <h2>이 방식의 문제</h2>
      <ul>
        <li>
          <strong>크기 고정</strong>: 화면이 400px만 필요한데도 원본
          2400px 이미지를 전부 받습니다.
        </li>
        <li>
          <strong>포맷 고정</strong>: AVIF/WebP를 지원하는 브라우저에도
          JPEG을 보냅니다.
        </li>
        <li>
          <strong>레이아웃 이동(CLS)</strong>: width/height를 명시하지
          않으면 이미지가 로드되며 화면이 출렁입니다.
        </li>
        <li>
          <strong>즉시 로드</strong>: 화면 밖 이미지까지 전부
          다운로드합니다.
        </li>
      </ul>
      <p>
        DevTools → Network → Img에서 전송 크기를 확인해보세요.{" "}
        <Link href="/optimized">next/image 페이지</Link>와 비교됩니다.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
