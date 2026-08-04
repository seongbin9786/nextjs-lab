import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1 style={{ fontFamily: "var(--font-plex), sans-serif" }}>
        폰트 최적화 (next/font)
      </h1>
      <p>
        이 페이지 전체가 <code>next/font</code>로 로드한{" "}
        <strong>IBM Plex Sans KR</strong>로 렌더링됩니다. 외부 폰트 서버
        요청이 <strong>0개</strong>입니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/how">원리</Link>
          </h3>
          <p>빌드 때 무엇이 일어나는지, 왜 CLS가 사라지는지.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/cdn">고전 방식 비교</Link>
          </h3>
          <p>
            <code>{"<link>"}</code> 태그로 구글 폰트를 쓰는 방식과
            비교합니다.
          </p>
        </div>
      </div>

      <h2>next/font가 해주는 것</h2>
      <ul>
        <li>
          <strong>자체 호스팅</strong>: <code>next/font/google</code>은 빌드
          시 폰트 파일을 다운로드해 내 앱에 포함합니다. 폰트 CDN 요청이
          사라지고, GDPR 같은 외부 리소스 이슈도 줄어듭니다.
        </li>
        <li>
          <strong>레이아웃 이동(CLS) 0</strong>:{" "}
          <code>font-display: swap</code>과 fallback 폰트 크기 보정(
          <code>size-adjust</code>)을 자동 생성해서 폰트가 바뀌는 순간
          화면이 출렁이는 것을 막습니다.
        </li>
        <li>
          <strong>자동 preload</strong>: 첫 화면에 필요한 폰트 파일만{" "}
          preload합니다.
        </li>
        <li>
          <strong>제로 런타임</strong>: CSS는 빌드 때 생성되고, 클라이언트
          JS는 들지 않습니다.
        </li>
      </ul>

      <div className="note">
        DevTools → Network를 열고 새로고침해보세요.{" "}
        <code>fonts.googleapis.com</code>, <code>fonts.gstatic.com</code>{" "}
        요청이 없습니다. 폰트 파일(<code>.woff2</code>)은 같은 origin에서
        한 번만 로드됩니다.
      </div>
    </div>
  );
}
