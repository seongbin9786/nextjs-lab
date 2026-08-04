import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { InteractiveCard } from "@/components/interactive-card";

// 이 페이지(서버 컴포넌트)가 클라이언트 컴포넌트(InteractiveCard)에게
// 서버에서 렌더링한 children을 전달하는 "합성" 패턴입니다.
export default async function CompositionPage() {
  const pkgRaw = await readFile(path.join(process.cwd(), "package.json"), "utf-8");
  const pkg = JSON.parse(pkgRaw) as { dependencies: Record<string, string> };
  const depCount = Object.keys(pkg.dependencies).length;

  return (
    <div className="container">
      <h1>합성 (composition) 패턴</h1>
      <p>
        클라이언트 컴포넌트는 서버 컴포넌트를 import할 수 없습니다. 대신
        아래처럼 <strong>서버 컴포넌트가 클라이언트 컴포넌트를 감싸며
        children으로 서버 콘텐츠를 전달</strong>합니다.
      </p>

      {/* children은 서버에서 렌더링되어 클라이언트 컴포넌트로 들어갑니다 */}
      <InteractiveCard title="서버에서 만든 콘텐츠 (children)">
        <p>
          이 문단은 <strong>서버 컴포넌트</strong>가 렌더링했습니다. 서버의{" "}
          <code>package.json</code>을 읽어보니 의존성이{" "}
          <strong className="metric">{depCount}개</strong>입니다.
        </p>
        <p className="muted">
          fs.readFile은 서버에서 실행됐지만, 이 카드를 접고 펼치는 버튼은
          클라이언트 컴포넌트가 처리합니다.
        </p>
      </InteractiveCard>

      <h2>왜 이 패턴을 쓰나요?</h2>
      <ul>
        <li>
          InteractiveCard(<code>"use client"</code>)는 children이 어떻게
          만들어지는지 모릅니다. 덕분에 서버 전용 로직(fs, DB)이 클라이언트
          번들로 들어가지 않습니다.
        </li>
        <li>
          클라이언트 번들에는 InteractiveCard와 접기/펼치기 상태만
          포함됩니다. children은 HTML로 직렬화되어 전달됩니다.
        </li>
        <li>
          페이지 전체를 클라이언트로 만드는 것보다 번들이 훨씬 작아집니다.
        </li>
      </ul>

      <pre>
        <code>{`// app/composition/page.tsx — 서버 컴포넌트
import { InteractiveCard } from "@/components/interactive-card";

export default async function Page() {
  const data = await readFile(...);   // 서버에서 실행
  return (
    <InteractiveCard title="...">
      <p>{data}</p>                    {/* 서버에서 렌더링된 children */}
    </InteractiveCard>
  );
}`}</code>
      </pre>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
