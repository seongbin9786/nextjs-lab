import Link from "next/link";

// 고전 방식 비교 페이지: 구글 Fonts CDN에서 Noto Sans KR을 가져옵니다.
// React 19는 precedence prop이 있는 <link rel="stylesheet">만 <head>로
// 올립니다. 이 link에는 precedence가 없어 body 안 제자리에 렌더링됩니다.
export default function CdnPage() {
  return (
    <div className="container">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <h1 style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        고전 방식: CDN 폰트
      </h1>
      <p style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        이 페이지는 <code>{"<link>"}</code> 태그로 구글 폰트 CDN에서{" "}
        <strong>Noto Sans KR</strong>을 가져옵니다.
      </p>

      <h2>이 방식에서 일어나는 일</h2>
      <ol>
        <li>
          HTML 도착 → <code>fonts.googleapis.com</code>에서{" "}
          <strong>CSS를 요청</strong> (외부 1회, 왕복 발생)
        </li>
        <li>
          그 CSS를 파싱한 뒤에야 폰트 파일 URL을 알고{" "}
          <code>fonts.gstatic.com</code>에서 <strong>woff2를 요청</strong>{" "}
          (외부 2회)
        </li>
        <li>
          그 사이 브라우저는 fallback 폰트로 표시 → 폰트 도착 시 교체 →{" "}
          <strong>CLS 발생 가능</strong>
        </li>
      </ol>

      <h2>next/font와 비교</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>이 페이지 (CDN)</th>
            <th>홈 (next/font)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>외부 origin 요청</td>
            <td>2개 이상 (CSS + 폰트)</td>
            <td>0개</td>
          </tr>
          <tr>
            <td>폰트 발견 시점</td>
            <td>CSS 도착 후 (직렬)</td>
            <td>HTML과 함께 preload (병렬)</td>
          </tr>
          <tr>
            <td>개인정보/추적</td>
            <td>CDN이 IP 수집 가능</td>
            <td>자체 호스팅으로 없음</td>
          </tr>
          <tr>
            <td>오프라인/방화벽</td>
            <td>CDN 차단 시 깨짐</td>
            <td>영향 없음</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        <p style={{ margin: 0 }}>
          DevTools → Network에서 <code>fonts.googleapis.com</code>,{" "}
          <code>fonts.gstatic.com</code> 도메인을 확인해보세요. 홈
          페이지에는 이 요청들이 없습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
