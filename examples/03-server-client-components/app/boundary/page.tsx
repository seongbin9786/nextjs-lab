import Link from "next/link";
import { PropsDisplay } from "@/components/props-display";

export default function BoundaryPage() {
  // 서버에서 만든 값들을 클라이언트 컴포넌트로 넘깁니다.
  // 이 지점이 "서버 → 클라이언트 경계"입니다.
  const renderedAt = new Date();

  return (
    <div className="container">
      <h1>클라이언트 경계</h1>
      <p>
        <code>"use client"</code>를 붙이는 순간, 그 파일과 그 파일이
        import하는 모든 모듈이 클라이언트 번들에 포함됩니다. 경계는{" "}
        <strong>파일에 붙이는 것</strong>이지, 함수나 JSX 일부에 붙이는 것이
        아닙니다.
      </p>

      <PropsDisplay
        text="서버에서 만든 문자열"
        number={42}
        date={renderedAt}
        list={["page.tsx", "layout.tsx", "loading.tsx"]}
        nested={{ ok: true }}
      />

      <h2>경계를 넘어갈 수 있는 것 / 없는 것</h2>
      <table>
        <thead>
          <tr>
            <th>props로 전달 가능</th>
            <th>전달 불가</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>문자열, 숫자, 불리언, null</td>
            <td>함수 (이벤트 핸들러 등)</td>
          </tr>
          <tr>
            <td>배열, 중첩 객체</td>
            <td>클래스 인스턴스 (일반적인 경우)</td>
          </tr>
          <tr>
            <td>Date, Map, Set (직렬화 지원)</td>
            <td>DB 커넥션, 파일 핸들</td>
          </tr>
          <tr>
            <td>React 노드 (children)</td>
            <td>서버 컴포넌트 자체를 import</td>
          </tr>
        </tbody>
      </table>

      <h2>경계 배치 원칙</h2>
      <ul>
        <li>
          <strong>경계는 잎사귀로</strong>: 인터랙션이 필요한 가장 깊은
          컴포넌트(버튼, 입력창, 차트)에만 <code>"use client"</code>를
          붙입니다.
        </li>
        <li>
          <strong>페이지는 서버로</strong>: <code>page.tsx</code>는 서버
          컴포넌트로 유지하고, 필요한 조각만 클라이언트로 만듭니다.
        </li>
        <li>
          데이터를 서버에서 가져온 뒤 경계 너머로 넘기면, 클라이언트에서
          fetch할 필요가 없어 워터폴이 줄어듭니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
