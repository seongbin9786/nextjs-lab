import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>proxy.ts (구 middleware)</h1>
      <p>
        <code>proxy.ts</code>는 모든 요청이 라우트에 도달하기 전에 실행되는
        함수입니다. Next.js 16에서 <code>middleware.ts</code>의 새
        이름이며, 헤더 수정·리다이렉트·리라이트·접근 제어를 담당합니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/headers">헤더 심기</Link>
          </h3>
          <p>
            proxy가 <code>x-request-id</code>를 요청 헤더에 넣고, 페이지가
            그걸 읽어서 보여줍니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/admin">접근 제어</Link>
          </h3>
          <p>
            <code>auth</code> 쿠키가 없으면 <code>/login</code>으로
            리다이렉트됩니다. 로그인 후 다시 와보세요.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/old-blog/hello">리라이트</Link>
          </h3>
          <p>
            주소는 <code>/old-blog/hello</code>인데 실제로는{" "}
            <code>/blog/hello</code>가 렌더링됩니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/legacy">리다이렉트</Link>
          </h3>
          <p>
            <code>/legacy</code>는 홈으로 307 리다이렉트됩니다.
          </p>
        </div>
      </div>

      <div className="note">
        <p style={{ margin: 0 }}>
          DevTools → Network에서 아무 응답이나 골라 Response Headers를
          보세요. <code>x-request-id</code>,{" "}
          <code>x-powered-by-proxy</code> 헤더가 proxy가 붙인 것입니다.
        </p>
      </div>

      <h2>middleware에서 바뀐 점</h2>
      <ul>
        <li>
          파일명 <code>middleware.ts</code> → <code>proxy.ts</code>, export도{" "}
          <code>proxy</code>로 (default export도 가능)
        </li>
        <li>네트워크 경계라는 역할이 이름에 드러남</li>
        <li>
          <code>middleware.ts</code>는 deprecated — 아직 동작하지만 미래
          버전에서 제거 예정
        </li>
      </ul>
      <p className="muted">
        주의: proxy는 빠른 낙관적 검사용입니다. 무거운 데이터 조회나 진짜
        권한 검증은 서버 컴포넌트/Server Action에서 다시 해야 합니다.
      </p>
    </div>
  );
}
