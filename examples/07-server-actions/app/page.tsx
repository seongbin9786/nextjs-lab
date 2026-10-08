import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Server Actions와 폼</h1>
      <p>
        Server Action은 <code>&quot;use server&quot;</code>로 표시하는 서버
        함수입니다. 폼의 <code>action</code> 속성에 넣으면{" "}
        <strong>API 라우트 없이</strong> 서버 로직을 호출합니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/todos">할 일 추가 폼</Link>
          </h3>
          <p>
            <code>useActionState</code>로 결과 상태,{" "}
            <code>useFormStatus</code>로 제출 중 상태를 다룹니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/photos">낙관적 업데이트</Link>
          </h3>
          <p>
            <code>useOptimistic</code>으로 서버 응답 전에 좋아요 수를 즉시
            반영합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/manual">폼 없이 호출하기</Link>
          </h3>
          <p>
            <code>useTransition</code>으로 버튼 클릭에서 액션을 호출합니다.
          </p>
        </div>
      </div>

      <h2>왜 Server Action인가요?</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>API 라우트 방식</th>
            <th>Server Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>엔드포인트 작성</td>
            <td>route.ts + fetch 코드 별도 작성</td>
            <td>함수 하나면 됨</td>
          </tr>
          <tr>
            <td>직렬화</td>
            <td>JSON 수동 파싱</td>
            <td>FormData 자동 전달</td>
          </tr>
          <tr>
            <td>JS 꺼진 환경</td>
            <td>폼 제출 불가</td>
            <td>네이티브 폼 제출로 동작</td>
          </tr>
          <tr>
            <td>제출 후 새로고침</td>
            <td>직접 처리</td>
            <td>재검증(revalidatePath 등) 호출 시 re-render</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        참고: Next.js 16부터 Server Action 응답은 단일 왕복(single
        roundtrip)으로 최적화되어, 액션 실행과 페이지 갱신이 한 번의
        응답으로 처리됩니다.
      </p>
    </div>
  );
}
