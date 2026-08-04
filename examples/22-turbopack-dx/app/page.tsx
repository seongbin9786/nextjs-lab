import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Turbopack DX</h1>
      <p>
        Next.js 16부터 <strong>Turbopack이 기본 번들러</strong>입니다.
        Rust로 작성된 번들러로, 개발 체감 속도를 크게 끌어올립니다.
      </p>

      <h2>숫자로 보는 개선</h2>
      <table>
        <thead>
          <tr>
            <th>항목</th>
            <th>webpack 대비</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>프로덕션 빌드</td>
            <td>
              <strong>2~5배 빠름</strong>
            </td>
          </tr>
          <tr>
            <td>Fast Refresh (수정 반영)</td>
            <td>
              <strong>최대 10배 빠름</strong>
            </td>
          </tr>
          <tr>
            <td>dev 서버 시작</td>
            <td>
              large 앱에서 유의미하게 빠름 + 파일 시스템 캐시로 재시작 가속
            </td>
          </tr>
        </tbody>
      </table>

      <h3>이 예시에서 직접 잰 값 (2026-08, 작은 앱)</h3>
      <table>
        <thead>
          <tr>
            <th>측정</th>
            <th>Turbopack</th>
            <th>webpack</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>프로덕션 빌드 (3회 중 최소)</td>
            <td className="metric">2.14s</td>
            <td className="metric">7.06s</td>
          </tr>
          <tr>
            <td>dev 서버 첫 응답</td>
            <td className="metric">1.42s</td>
            <td className="metric">3.26s</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        <code>scripts/bench.sh</code>로 재현할 수 있습니다. 아주 작은 앱이라
        격차가 보수적으로 나왔고, 앱이 클수록 벌어집니다.
      </p>

      <h2>직접 비교</h2>
      <pre>
        <code>{`# 프로덕션 빌드 비교
pnpm build                # Turbopack (기본)
pnpm build -- --webpack   # webpack

# dev 서버
pnpm dev                  # Turbopack
pnpm dev -- --webpack     # webpack`}</code>
      </pre>

      <h2>함께 온 DX 개선들</h2>
      <ul>
        <li>
          <strong>빌드 단계별 소요 시간 표시</strong>: 컴파일, 타입 체크,
          정적 생성 등 각 단계 시간이 터미널에 나옵니다.
        </li>
        <li>
          <strong>개발 요청 로그</strong>: Compile 시간과 Render 시간이
          분리되어 느린 지점을 찾기 쉬워졌습니다.
        </li>
        <li>
          <strong>동시 실행 보호</strong>: 같은 프로젝트에서{" "}
          <code>next dev</code> 두 개가 동시에 뜨지 않도록 락파일이
          생겼습니다.
        </li>
        <li>
          <strong>dev/build 출력 디렉터리 분리</strong>: dev 서버를 띄운 채
          빌드해도 서로 충돌하지 않습니다.
        </li>
        <li>
          <strong>파일 시스템 캐시 (beta)</strong>:{" "}
          <code>experimental.turbopackFileSystemCacheForDev</code>를 켜면
          재시작 컴파일이 더 빨라집니다.
        </li>
      </ul>
      <p>
        <Link href="/nested/page">느린 컴포넌트 예시</Link> 페이지에서 수정
        후 Fast Refresh 속도도 체감해볼 수 있습니다.
      </p>
    </div>
  );
}
