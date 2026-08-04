"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// ssr: false 는 서버 렌더링을 완전히 건너뜁니다.
// 브라우저 전용 API(window, document, canvas 라이브러리 등)를
// 렌더링 경로에서 직접 쓰는 컴포넌트에 필요합니다.
const WindowOnlyWidget = dynamic(
  () =>
    import("@/components/window-only-widget").then((m) => m.WindowOnlyWidget),
  {
    ssr: false,
    loading: () => (
      <div className="card">
        <p style={{ margin: 0 }}>브라우저에서만 렌더링되는 위젯 로드 중…</p>
      </div>
    ),
  },
);

export default function NoSsrPage() {
  return (
    <div className="container">
      <h1>ssr: false</h1>
      <WindowOnlyWidget />
      <h2>코드</h2>
      <pre>
        <code>{`const WindowOnlyWidget = dynamic(
  () => import("@/components/window-only-widget")
    .then((m) => m.WindowOnlyWidget),
  { ssr: false }
);`}</code>
      </pre>
      <ul>
        <li>
          이 옵션은 <strong>클라이언트 컴포넌트 파일에서만</strong> 쓸 수
          있습니다. 서버 컴포넌트에서 쓰면 빌드 오류가 납니다.
        </li>
        <li>
          지도, 차트, 웹GL, 서드파티 위젯처럼 DOM 측정이 필수인 컴포넌트에
          사용합니다.
        </li>
        <li>
          대부분은 <code>ssr: false</code> 없이{" "}
          <code>useEffect</code>로 브라우저 값을 읽는 쪽이 SEO에 유리합니다.
          정말 SSR이 불가능할 때만 쓰세요.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
