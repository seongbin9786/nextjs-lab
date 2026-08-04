import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

// 서버 컴포넌트에서는 Node.js API를 그대로 사용할 수 있습니다.
// 이 코드는 브라우저로 전송되지 않으므로 비밀 키나 DB 접속 정보도 안전합니다.
export default async function ServerOnlyPage() {
  const pkgPath = path.join(process.cwd(), "package.json");
  const pkgRaw = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgRaw) as { name: string; dependencies: Record<string, string> };

  return (
    <div className="container">
      <h1>
        서버 전용 코드 <span className="badge server">서버 컴포넌트</span>
      </h1>
      <p>
        이 페이지는 <code>node:fs</code>로 서버의 파일 시스템을 직접 읽어서{" "}
        <code>package.json</code>의 내용을 보여줍니다.
      </p>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>서버에서 읽은 package.json</h3>
        <p style={{ margin: "4px 0" }}>
          name: <code>{pkg.name}</code>
        </p>
        <ul style={{ margin: "4px 0" }}>
          {Object.entries(pkg.dependencies).map(([name, version]) => (
            <li key={name}>
              <code>{name}</code> @ <code>{version}</code>
            </li>
          ))}
        </ul>
      </div>
      <h2>왜 이것이 중요한가요?</h2>
      <ul>
        <li>
          <strong>번들 크기 0 바이트</strong>: 서버 컴포넌트의 렌더링 로직은
          클라이언트 자바스크립트 번들에 포함되지 않습니다. 사용자는 완성된
          HTML만 받습니다.
        </li>
        <li>
          <strong>비밀 유지</strong>: API 키, 데이터베이스 접속 문자열이
          브라우저로 새어 나가지 않습니다. 같은 파일을 클라이언트
          컴포넌트에서 import하면 빌드가 실패하거나 비밀이 노출됩니다.
        </li>
        <li>
          <strong>서버 근처에서 데이터 접근</strong>: 데이터베이스, 파일
          시스템, 내부 API에 직접 접근합니다. 브라우저 → API 서버 → DB로
          왕복할 필요가 없습니다.
        </li>
      </ul>
      <div className="note">
        확인 방법: DevTools → Network → JS 파일들을 보세요. 이 페이지의
        fs 호출 코드는 어디에도 없습니다. (참고: <code>server-only</code>{" "}
        패키지를 쓰면 서버 전용 모듈을 클라이언트에서 실수로 import할 때
        빌드 단계에서 오류를 낼 수 있습니다.)
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
