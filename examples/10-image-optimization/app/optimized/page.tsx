import Image from "next/image";
import Link from "next/link";

export default function OptimizedPage() {
  return (
    <div className="container">
      <h1>next/image</h1>
      <p>
        같은 이미지(<code>/images/hero.jpg</code>)를{" "}
        <code>next/image</code>로 렌더링합니다.
      </p>
      <div style={{ position: "relative", aspectRatio: "3 / 2" }}>
        <Image
          src="/images/hero.jpg"
          alt="next/image로 최적화된 이미지"
          fill
          sizes="(max-width: 780px) 100vw, 780px"
          priority
        />
      </div>
      <h2>일어난 일</h2>
      <ul>
        <li>
          <strong>포맷 변환</strong>: 브라우저가 AVIF를 지원하면 AVIF,
          아니면 WebP, 그것도 안 되면 JPEG. <code>Accept</code> 헤더로
          자동 협상됩니다.
        </li>
        <li>
          <strong>리사이징</strong>: <code>sizes</code>에 선언된 크기 기준의{" "}
          <code>srcset</code>이 만들어지고, 기기에 맞는 해상도만
          다운로드됩니다.
        </li>
        <li>
          <strong>CLS 방지</strong>: <code>fill</code> +{" "}
          <code>aspect-ratio</code> 컨테이너로 자리 예약이 되어 화면이
          출렁이지 않습니다.
        </li>
        <li>
          <strong>priority</strong>: 첫 화면 핵심 이미지(LCP 후보)는
          지연 로딩에서 제외하고 미리 로드합니다.
        </li>
      </ul>
      <div className="note">
        <p style={{ margin: 0 }}>
          DevTools → Network → Img에서 <code>/_next/image?url=...</code>{" "}
          요청을 찾아보세요. 원본 대비 전송 크기가 크게 줄어 있습니다.{" "}
          <Link href="/benchmark">정량 비교 페이지</Link>에 숫자가 있습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
