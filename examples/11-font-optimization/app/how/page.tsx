import Link from "next/link";

export default function HowPage() {
  return (
    <div className="container">
      <h1>원리: 빌드 때 무슨 일이 일어나나</h1>
      <p>
        <code>next/font</code>는 런타임이 아니라{" "}
        <strong>빌드 시점</strong>에 동작합니다.
      </p>
      <ol>
        <li>
          <code>next/font/google</code>이면 폰트 파일을{" "}
          <strong>빌드 때 다운로드</strong>해 <code>.next</code>에 저장,
          <code> next/font/local</code>이면 내 파일을 그대로 사용.
        </li>
        <li>
          <code>@font-face</code> CSS를 생성. 이때{" "}
          <code>size-adjust</code>, <code>ascent-override</code> 등으로
          fallback 폰트와의 크기 차이를 보정.
        </li>
        <li>
          폰트 파일을 <code>/_next/static</code>의 정적 에셋으로 서빙.
        </li>
      </ol>

      <h2>왜 CLS가 사라지나</h2>
      <p>
        폰트가 늦게 로드되면, 브라우저는 일단 fallback(시스템) 폰트로
        그렸다가 웹 폰트로 갈아끼웁니다. 두 폰트의 글자 너비/높이가 다르면
        그 순간 텍스트가 움직입니다(CLS).
      </p>
      <p>
        next/font는 fallback 폰트에 <code>size-adjust</code>를 적용해{" "}
        <strong>웹 폰트와 차지하는 공간을 거의 같게</strong> 만듭니다.
        폰트가 바뀌어도 레이아웃이 흔들리지 않습니다.
      </p>

      <h2>요청 수 비교</h2>
      <table>
        <thead>
          <tr>
            <th>방식</th>
            <th>외부 요청</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>구글 Fonts <code>&lt;link&gt;</code></td>
            <td>2회+</td>
            <td>
              CSS 가져오기 + 폰트 파일. CDN 경유, first-party가 아님
            </td>
          </tr>
          <tr>
            <td><code>@font-face</code> 직접 작성</td>
            <td>1회+</td>
            <td>폰트 파일은 자체 서빙, CSS는 직접 관리</td>
          </tr>
          <tr>
            <td><code>next/font</code></td>
            <td>
              <strong>0회 (외부)</strong>
            </td>
            <td>
              CSS 자동 인라인/동일 origin, 폰트만 자체 서빙
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
