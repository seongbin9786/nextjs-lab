import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";

// 페이지 컴포넌트 몸 안에서 "use cache"를 선언하면
// 이 페이지의 렌더링 결과가 통째로 캐시됩니다.
export default async function CachedPage() {
  "use cache";

  cacheLife("minutes");
  cacheTag("cached-page");

  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });

  return (
    <div className="container">
      <h1>use cache 페이지</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          캐시된 렌더링 시각: <strong className="metric">{now}</strong>
        </p>
      </div>
      <p>
        새로고침해도 시각이 바뀌지 않습니다. 첫 렌더링 결과가 캐시에
        저장되어 재사용되기 때문입니다.
      </p>
      <h2>코드</h2>
      <pre>
        <code>{`export default async function Page() {
  "use cache";            // 이 함수(페이지)를 캐시
  cacheLife("minutes");   // 캐시 수명 프로필
  cacheTag("cached-page"); // 무효화용 태그
  ...
}`}</code>
      </pre>
      <ul>
        <li>
          <code>cacheLife("minutes")</code>: 내장 프로필. 수십 초 후
          백그라운드 재검증, 수 분~수 시간 만료(stale-while-revalidate).
        </li>
        <li>
          <code>cacheTag</code>: <code>revalidateTag("cached-page", ...)</code>
          로 이 페이지만 골라 무효화할 수 있습니다.
        </li>
        <li>
          캐시 키는 컴파일러가 자동으로 생성합니다. unstable_cache 시절처럼
          키 문자열을 손으로 관리하지 않습니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
