import Link from "next/link";

export default function ComparePage() {
  return (
    <div className="container">
      <h1>번들 크기 비교</h1>
      <p>
        같은 화면(상품 목록 + 클릭 인터랙션)을 두 방식으로 만들었습니다.
        차이는 <strong>데이터와 페이지 로직이 어느 번들에 실리느냐</strong>뿐입니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/compare/server">서버 합성</Link>
          </h3>
          <p>
            서버 페이지가 데이터를 읽어 클라이언트 컴포넌트에 전달. 데이터는
            HTML/RSC 페이로드로 가고 <strong>JS 번들에는 없음</strong>.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/compare/client">전부 클라이언트</Link>
          </h3>
          <p>
            페이지 전체가 <code>&quot;use client&quot;</code>. 데이터
            리터럴이 <strong>JS 번들에 포함</strong>.
          </p>
        </div>
      </div>

      <h2>정량 측정 (scripts/compare-bundles.sh)</h2>
      <table>
        <thead>
          <tr>
            <th>라우트</th>
            <th>구성</th>
            <th>첫 로딩 JS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="metric">/compare/server</td>
            <td>서버 페이지 + 클라이언트 잎사귀</td>
            <td className="metric">560.9 kB</td>
          </tr>
          <tr>
            <td className="metric">/compare/client</td>
            <td>전부 클라이언트</td>
            <td className="metric">617.1 kB</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        <p style={{ marginTop: 0 }}>
          차이는 <strong>56.2 kB</strong>입니다. 전부-클라이언트 방식은 약
          40KB의 상품 데이터 리터럴과 페이지 렌더링 코드가 브라우저 JS
          번들에 포함되기 때문입니다. 서버 합성 방식에서 이 데이터는
          HTML/RSC 페이로드로 전달되어 <strong>JS 번들에서는 빠집니다</strong>.
        </p>
        <p style={{ marginBottom: 0 }}>
          화면에 보이는 결과와 인터랙션은 두 방식이 동일합니다. 데이터와
          페이지가 커질수록 이 격차는 그대로 벌어집니다. (측정:{" "}
          <code>scripts/compare-bundles.sh</code>, 압축 전 원본 크기 기준)
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
