import Link from "next/link";

export default function CssInJsPage() {
  return (
    <div className="container">
      <h1>CSS-in-JS</h1>
      <p>
        styled-components, emotion처럼 <strong>JS 안에서 CSS를
        작성</strong>하는 방식입니다. App Router(서버 컴포넌트) 시대에는
        선택 기준이 조금 달라졌습니다.
      </p>

      <h2>런타임 CSS-in-JS의 비용</h2>
      <ul>
        <li>
          스타일을 <strong>런타임에 생성/주입</strong>하므로 JS 번들이
          커지고, 렌더링 시 스타일 계산 비용이 듭니다.
        </li>
        <li>
          서버 컴포넌트에서는 클라이언트 전용 훅 기반 라이브러리가 그대로
          동작하지 않습니다.
        </li>
      </ul>

      <h2>App Router에서 쓰는 법</h2>
      <table>
        <thead>
          <tr>
            <th>방식</th>
            <th>예시</th>
            <th>특징</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>런타임</td>
            <td>styled-components</td>
            <td>
              SSR 시 스타일을 수집하는 별도 설정 필요. 클라이언트 컴포넌트에서
              사용
            </td>
          </tr>
          <tr>
            <td>빌드 시 (제로 런타임)</td>
            <td>vanilla-extract, styled-jsx(CSS Modules 결합)</td>
            <td>빌드 때 CSS를 추출해 JS 비용이 없음. RSC 친화적</td>
          </tr>
          <tr>
            <td>인라인</td>
            <td><code>{"style={{}}"}</code></td>
            <td>동적 값에 간편하지만 재사용/의사 클래스 불가</td>
          </tr>
        </tbody>
      </table>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>요즘 권장</strong>: 성능이 중요하다면{" "}
          <strong>제로 런타임</strong> CSS(vanilla-extract 등)나 CSS
          Modules/Tailwind를, 개발 경험이 중요하다면 설정을 갖춘
          styled-components를 고려하세요. 이 페이지는 개념 설명이라 실제
          CSS-in-JS 라이브러리는 번들하지 않았습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
