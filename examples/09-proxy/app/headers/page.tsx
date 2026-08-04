import { headers } from "next/headers";
import Link from "next/link";

export default async function HeadersPage() {
  // proxy.ts가 requestHeaders에 심은 값을 여기서 읽습니다.
  const h = await headers();
  const requestId = h.get("x-request-id") ?? "(없음)";

  return (
    <div className="container">
      <h1>헤더 심기</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          이번 요청의 ID: <strong className="metric">{requestId}</strong>
        </p>
      </div>
      <p>새로고침할 때마다 값이 바뀝니다. 흐름은 이렇습니다.</p>
      <ol>
        <li>
          <code>proxy.ts</code>가 요청마다 랜덤 ID를 만들어{" "}
          <strong>요청 헤더</strong>에 추가
        </li>
        <li>
          이 페이지(서버 컴포넌트)가 <code>headers()</code>로 그 값을 읽음
        </li>
        <li>같은 ID가 응답 헤더에도 실려 DevTools에서 확인 가능</li>
      </ol>
      <p className="muted">
        이 패턴으로 추적 ID, A/B 테스트 그룹, 지역 정보 등을 요청 흐름 전체에
        전달합니다.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
