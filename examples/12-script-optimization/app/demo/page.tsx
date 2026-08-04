import Link from "next/link";
import Script from "next/script";
import { ScriptLoadMonitor } from "@/components/script-load-monitor";

export default function DemoPage() {
  const pageShownAt = Date.now();

  return (
    <div className="container">
      <h1>전략 비교 데모</h1>
      <p>
        이 페이지는 세 개의 스크립트를 서로 다른 전략으로 로드합니다.
        아래 표에 페이지 표시 후 몇 ms 만에 각 스크립트가 실행됐는지
        표시됩니다.
      </p>

      {/* 1) beforeInteractive: 루트 레이아웃에서만 사용 가능.
          이 예시의 app/layout.tsx에 인라인으로 들어가 있습니다. */}

      {/* 2) afterInteractive (기본): 하이드레이션 직후 */}
      <Script src="/demo-scripts/tracker.js" strategy="afterInteractive" />

      {/* 3) lazyOnload: 유휴 시간에 로드 */}
      <Script src="/demo-scripts/chat-widget.js" strategy="lazyOnload" />

      <ScriptLoadMonitor pageShownAt={pageShownAt} />

      <h2>기대 결과</h2>
      <ul>
        <li>
          <code>page-start.js</code> (beforeInteractive): 0ms — 페이지보다
          먼저 실행되어 오히려 "음수"가 표시될 수 있습니다.
        </li>
        <li>
          <code>tracker.js</code> (afterInteractive): 수십 ms 이내.
        </li>
        <li>
          <code>chat-widget.js</code> (lazyOnload): 모든 리소스가 로드된
          후라 가장 늦습니다.
        </li>
      </ul>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>효과</strong>: 메인 스레드가 무거운 스크립트 로딩/파싱에서
          해방되어 <strong>첫 조작 반응(INP)과 TTI가 좋아집니다</strong>.
          페이지의 핵심 콘텐츠는 그대로, 곁가지 스크립트만 뒤로 미루는
          것입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
