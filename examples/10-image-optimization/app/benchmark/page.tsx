import Link from "next/link";

// scripts/bench.sh 로 실제 측정한 값입니다. (2026-08 측정)
// 원본: hero.jpg 2400x1600, 약 1747KB
export default function BenchmarkPage() {
  return (
    <div className="container">
      <h1>정량 비교</h1>
      <p>
        같은 이미지(<code>/images/hero.jpg</code>, 2400×1600, 약{" "}
        <strong className="metric">1747KB</strong>)를 브라우저가 실제 내려받는
        크기입니다. <code>scripts/bench.sh</code>로 재현할 수 있습니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>요청</th>
            <th>전송 크기</th>
            <th>원본 대비</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="metric">원본 hero.jpg</td>
            <td className="metric">1747KB</td>
            <td>—</td>
          </tr>
          <tr>
            <td className="metric">/_next/image → WebP (w=1080, q=75)</td>
            <td className="metric">11KB</td>
            <td>
              <strong>약 159배 작음</strong>
            </td>
          </tr>
          <tr>
            <td className="metric">/_next/image → AVIF (w=1080, q=75)</td>
            <td className="metric">7KB</td>
            <td>
              <strong>약 245배 작음</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        <p style={{ marginTop: 0 }}>
          <strong>참고</strong>: 이 예시 이미지는 그라데이션이라 압축이 유난히
          잘 됩니다. 실제 사진에서는 차이가 이보다 작지만, 그래도{" "}
          <strong>수 배~수십 배</strong> 줄어드는 것이 일반적입니다. 핵심은{" "}
          (1) 최신 포맷 자동 협상, (2) 필요한 해상도로만 리사이징, (3) 브라우저
          캐시 TTL이 Next 16 기준 <strong>4시간</strong>이라는 점입니다.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>DX 포인트</strong>: 이 모든 것이{" "}
          <code>{"<Image src=... fill />"}</code> 한 줄로 됩니다. 이미지
          파이프라인(리사이즈 스크립트, 포맷 변환, srcset 수작업)을 직접
          관리하지 않습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
