import Link from "next/link";

export default function BenchmarkPage() {
  return (
    <div className="container">
      <h1>정량 비교</h1>
      <p>
        각 페이지 HTML에서 <strong>실행되는</strong> <code>&lt;script
        src&gt;</code>의 합계(첫 로딩 JS)입니다.{" "}
        <code>scripts/compare-bundles.sh</code>를 실행하면 측정 후 이
        페이지에 숫자가 채워집니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>라우트</th>
            <th>무거운 차트 포함 방식</th>
            <th>첫 로딩 JS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="metric">/static-import</td>
            <td>정적 import (첫 로딩에 포함)</td>
            <td className="metric">705.6 kB</td>
          </tr>
          <tr>
            <td className="metric">/lazy-load</td>
            <td>next/dynamic (분리됨)</td>
            <td className="metric">564.2 kB</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        <p style={{ marginTop: 0 }}>
          차이는 <strong>141.4 kB</strong>입니다. lazy-load 페이지에서는 이
          만큼(170KB 데이터 + 차트 코드)이 첫 로딩에서 빠지고, 차트가
          필요해지는 시점에 로드됩니다.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>미세하지만 중요한 디테일</strong>: 지연 청크는 첫 HTML에{" "}
          <code>{"<link rel=\"preload\" fetchPriority=\"low\">"}</code> 힌트로만
          걸립니다. 초기 렌더링을 막지 않고, 브라우저가 한가할 때 낮은
          우선순위로 미리 받아두는 용도입니다. 숫자는 압축 전 원본 크기
          기준입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
