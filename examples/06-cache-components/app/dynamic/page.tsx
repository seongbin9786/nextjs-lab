import Link from "next/link";
import { connection } from "next/server";

// "이 라우트는 즉시 렌더링 검증을 끄고, 매 요청 전체를 렌더링하겠다"는
// 선언입니다. Next.js 16 Cache Components는 기본적으로 모든 라우트가
// 즉시(즉각 내비게이션 가능하게) 렌더되길 요구하는데, 이 설정으로
// 예외를 만들 수 있습니다.
export const instant = false;

export default async function DynamicPage() {
  await connection();
  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });

  return (
    <div className="container">
      <h1>요청 시 렌더링 (blocking 라우트)</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          렌더링 시각: <strong className="metric">{now}</strong>
        </p>
      </div>
      <p>새로고침할 때마다 시각이 바뀝니다. 매 요청 실행되니까요.</p>
      <h2>여기까지 오는 길</h2>
      <p>
        Cache Components는 빌드 시 모든 라우트의 <strong>정적 셸</strong>을
        만들려고 합니다. 그 과정에서 두 번 막혔습니다.
      </p>
      <ol>
        <li>
          <code>new Date()</code> 그대로 프리렌더 → <strong>빌드 오류</strong>
          . 렌더링마다 값이 바뀌는 것을 허용하지 않습니다.
        </li>
        <li>
          <code>await connection()</code>만 추가 → 여전히 오류.{" "}
          <code>connection()</code>이 <code>&lt;Suspense&gt;</code> 밖에 있으면
          정적 셸 생성을 통째로 막기 때문입니다.
        </li>
        <li>
          해결: 이 라우트는 통째로 동적이므로{" "}
          <code>export const instant = false</code>로 검증에서 제외했습니다.
        </li>
      </ol>
      <div className="note">
        <p style={{ margin: 0 }}>
          페이지의 <strong>일부만</strong> 동적이라면{" "}
          <code>instant = false</code> 대신 동적 부분을{" "}
          <code>&lt;Suspense&gt;</code>로 감싸세요. 셸은 즉시 전송되고 동적
          부분만 스트리밍됩니다. <Link href="/mixed">/mixed 예시</Link>가
          그 방식입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
