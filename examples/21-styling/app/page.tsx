import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>스타일링</h1>
      <p>
        Next.js는 여러 스타일링 방식을 동시에 지원합니다. 이 예시는 세
        가지를 한 앱에서 공존시키며 각각의 특징을 보여줍니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/css-modules">CSS Modules</Link>
          </h3>
          <p>
            <code>*.module.css</code> — 클래스가 자동 스코프 처리되어 이름
            충돌이 없습니다. 설정이 필요 없습니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/tailwind">Tailwind CSS v4</Link>
          </h3>
          <p>
            유틸리티 클래스. <code>@layer</code> 기반이라 커스텀 CSS와
            공존합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/css-in-js">CSS-in-JS</Link>
          </h3>
          <p>
            styled-components 등. 서버 컴포넌트 시대의 주의사항과 대안.
          </p>
        </div>
      </div>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>추천</strong>: 새로운 App Router 프로젝트라면 전역 스타일과
          디자인 토큰은 <strong>전역 CSS(또는 Tailwind)</strong>, 컴포넌트
          단위 분리는 <strong>CSS Modules</strong> 또는 Tailwind 유틸리티가
          무난합니다. CSS-in-JS는 런타임 비용과 RSC 호환성을 확인하세요.
        </p>
      </div>
    </div>
  );
}
