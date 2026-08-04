import Link from "next/link";
import Script from "next/script";

export default function InlinePage() {
  return (
    <div className="container">
      <h1>인라인 스크립트</h1>
      <p>
        <code>next/script</code>는 외부 파일뿐 아니라 인라인 코드도
        지원합니다. 인라인일 때는 <code>id</code>가 필수입니다(중복 주입
        방지).
      </p>

      <Script id="inline-demo" strategy="afterInteractive">
        {`document.getElementById("inline-result").textContent =
  "인라인 스크립트가 " + new Date().toLocaleTimeString("ko-KR") + " 에 실행됨";`}
      </Script>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <p id="inline-result" className="metric" style={{ margin: 0 }}>
          아직 실행 전…
        </p>
      </div>

      <h2>언제 쓰나요?</h2>
      <ul>
        <li>한두 줄짜리 초기화 코드 (전역 플래그, feature flag 주입)</li>
        <li>외부 파일을 만들기 애매한 작은 snippet</li>
        <li>
          JSON-LD 같은 데이터 스크립트 (13예시 metadata에서도 사용)
        </li>
      </ul>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>주의</strong>: 같은 <code>id</code>의 스크립트는 페이지가
          바뀌어도 다시 주입되지 않습니다. 의도한 동작이지만,{" "}
          <code>useEffect</code>로 충분하다면 그것도 대안입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
