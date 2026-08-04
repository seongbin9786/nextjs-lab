import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>standalone과 Docker</h1>
      <p>
        <code>output: &quot;standalone&quot;</code>은 자체 서버 배포를 위한
        옵션입니다. 서버 기능이 필요한 앱(24예시의 정적 export로 안 되는
        앱)을 컨테이너로 돌릴 때 씁니다.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>빌드와 실행</h3>
        <pre style={{ margin: 0 }}>
          <code>{`# Docker 이미지 빌드
docker build -t nextjs-lab-standalone .

# 실행
docker run -p 3000:3000 nextjs-lab-standalone`}</code>
        </pre>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          서버 없이 로컬에서 standalone 확인
        </h3>
        <pre style={{ margin: 0 }}>
          <code>{`pnpm build
node .next/standalone/server.js
# → http://localhost:3000`}</code>
        </pre>
      </div>

      <h2>standalone이 주는 것</h2>
      <ul>
        <li>
          <strong>최소 번들</strong>: <code>.next/standalone</code>에는 서버
          실행에 필요한 모듈만 트리셰이킹되어 담깁니다. 수백 MB짜리
          node_modules를 이미지마다 복사하지 않습니다.
        </li>
        <li>
          <strong>내장 서버</strong>: <code>server.js</code>가 next start
          없이 앱을 서빙합니다.
        </li>
        <li>
          <strong>이미지 크기 절감</strong>: 멀티스테이지 빌드 + standalone
          조합으로 최종 이미지가 크게 작아집니다.
        </li>
      </ul>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>주의</strong>: standalone 출력에는 <code>.next/static</code>과{" "}
          <code>public</code>이 자동 포함되지 않습니다. Dockerfile처럼 별도로
          복사해야 정적 에셋이 서빙됩니다.
        </p>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/server-time">서버 렌더링 확인</Link>
          </h3>
          <p>매 요청 서버에서 렌더링되는 동적 페이지.</p>
        </div>
      </div>
    </div>
  );
}
