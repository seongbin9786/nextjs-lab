import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Cache Components (Next.js 16)</h1>
      <p>
        Next.js 16의 새 캐싱 모델입니다. <code>cacheComponents: true</code>를
        켜면 세상이 반대로 바뀝니다.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>이전 모델 (15까지)</th>
            <th>Cache Components (16)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>기본 동작</td>
            <td>
              fetch 캐시는 옵션 지정 시에만, 정적/동적 판단이 암묵적
            </td>
            <td>
              <strong>모든 것이 요청 시 실행</strong>. 캐싱은 명시적 선택
            </td>
          </tr>
          <tr>
            <td>캐싱 방법</td>
            <td>
              fetch 옵션, <code>revalidate</code>,{" "}
              <code>dynamic</code> 등 세그먼트 설정
            </td>
            <td>
              <code>&quot;use cache&quot;</code> 지시어 +{" "}
              <code>cacheLife</code>/<code>cacheTag</code>
            </td>
          </tr>
          <tr>
            <td>무효화</td>
            <td>revalidateTag(tag)</td>
            <td>
              <code>revalidateTag(tag, 프로필)</code>,{" "}
              <code>updateTag(tag)</code>, <code>refresh()</code>
            </td>
          </tr>
          <tr>
            <td>정적+동적 혼합</td>
            <td>experimental PPR</td>
            <td>기본 내장 (Suspense로 동적 구멍 만듦)</td>
          </tr>
        </tbody>
      </table>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/dynamic">매 요청 렌더링 (instant = false)</Link>
          </h3>
          <p>
            정적 셸 없이 통째로 동적인 라우트. 빌드 오류 2개를 통과하며
            규칙을 배웁니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/cached">use cache 페이지</Link>
          </h3>
          <p>
            <code>&quot;use cache&quot;</code> + <code>cacheLife</code>로
            페이지 전체를 캐시합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/posts">태그 + 즉시 반영 (updateTag)</Link>
          </h3>
          <p>
            캐시에 태그를 달고, Server Action에서 <code>updateTag</code>로
            쓴 값을 즉시 읽습니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/mixed">정적 셸 + 동적 구멍 (PPR)</Link>
          </h3>
          <p>
            캐시된 부분과 요청 시 계산되는 부분이 한 페이지에 섞입니다.
          </p>
        </div>
      </div>

      <div className="note">
        이 예시의 <code>next.config.ts</code>에는{" "}
        <code>cacheComponents: true</code>가 켜져 있습니다. 켜는 순간{" "}
        <code>export const dynamic</code>, <code>revalidate</code> 같은 기존
        세그먼트 설정은 빌드 오류가 됩니다.
      </div>
    </div>
  );
}
