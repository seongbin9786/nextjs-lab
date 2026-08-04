import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>데이터 fetching과 캐싱</h1>
      <p>
        Next.js에는 캐시 계층이 4개 있습니다. 이 예시는 그중{" "}
        <strong>데이터 캐시(Data Cache)</strong>와{" "}
        <strong>요청 메모이제이션</strong>, <strong>풀 라우트 캐시(ISR)</strong>
        를 다룹니다.
      </p>

      <table>
        <thead>
          <tr>
            <th>계층</th>
            <th>역할</th>
            <th>이 예시의 데모</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>요청 메모이제이션</td>
            <td>한 번의 렌더 안에서 같은 fetch를 재사용</td>
            <td>
              <Link href="/dedupe">/dedupe</Link>
            </td>
          </tr>
          <tr>
            <td>데이터 캐시</td>
            <td>fetch 결과를 서버에 저장해 재사용</td>
            <td>
              <Link href="/cached">/cached</Link>,{" "}
              <Link href="/time-based">/time-based</Link>
            </td>
          </tr>
          <tr>
            <td>풀 라우트 캐시</td>
            <td>렌더링 결과(HTML) 자체를 저장</td>
            <td>
              <Link href="/isr">/isr</Link>
            </td>
          </tr>
          <tr>
            <td>라우터 캐시</td>
            <td>클라이언트가 내비게이션 결과를 메모리에 유지</td>
            <td>19예시에서 Link와 함께 다룸</td>
          </tr>
        </tbody>
      </table>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/fresh">캐시 없음 (기본)</Link>
          </h3>
          <p>
            Next.js 15+ 부터 <code>fetch</code>는{" "}
            <strong>기본이 캐시 없음</strong>입니다. 매 요청 새로
            가져옵니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/cached">force-cache + 태그 무효화</Link>
          </h3>
          <p>
            <code>cache: "force-cache"</code>로 저장하고,{" "}
            <code>revalidateTag</code>로 무효화합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/time-based">시간 기반 재검증</Link>
          </h3>
          <p>
            <code>{"next: { revalidate: 10 }"}</code> — 10초마다 갱신.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/dedupe">요청 메모이제이션</Link>
          </h3>
          <p>같은 렌더에서 같은 fetch는 한 번만 요청됩니다.</p>
        </div>
      </div>

      <div className="note">
        모든 페이지가 같은 API(<code>/api/now</code>)를 호출합니다. API는
        호출될 때마다 counter가 1씩 증가하므로, 화면에 보이는 counter 값으로
        캐시 적중 여부를 직접 확인할 수 있습니다.
      </div>
    </div>
  );
}
