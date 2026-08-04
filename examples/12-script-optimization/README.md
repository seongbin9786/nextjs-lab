# 12 — 스크립트 최적화 (next/script)

> analytics, 챗 위젯 같은 서드파티 스크립트를 "언제" 로드할지 전략으로 제어합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/demo` — 세 전략의 로드 시점을 ms 단위로 측정해 표시
- `/inline` — 인라인 스크립트와 `id` 규칙

## 전략 4가지

| 전략 | 로드 시점 | 용도 |
| --- | --- | --- |
| `beforeInteractive` | 페이지 JS 실행 전 (초기 HTML 주입) | 봇 감지 등 반드시 먼저 필요한 것 |
| `afterInteractive` (기본) | 하이드레이션 직후 | analytics 대부분 |
| `lazyOnload` | 모든 리소스 로드 후, 유휴 시간 | 챗 위젯 등 우선순위 낮은 것 |
| `worker` (Partytown) | 웹 워커로 이동 | 메인 스레드 완전 분리 |

## 정량 비교: 메인 스레드 비용

| 구성 | 첫 페이지 파싱/실행에 포함되는 스크립트 |
| --- | --- |
| `<script src>`를 `<head>`에 직접 | **전부** — 렌더링/TTI 지연 |
| `next/script` (afterInteractive/lazyOnload) | 핵심 HTML만 — 스크립트는 뒤로 |

`/demo` 페이지의 표에서 `page-start.js`(beforeInteractive)는 페이지 JS보다
먼저(음수), `tracker.js`는 수십 ms, `chat-widget.js`는 가장 늦게 실행되는
것을 볼 수 있습니다.

## 핵심 개념

```tsx
import Script from "next/script";

<Script src="/chat-widget.js" strategy="lazyOnload" />

// 인라인은 id 필수
<Script id="page-start" strategy="beforeInteractive">
  {`window.__boot = Date.now();`}
</Script>
```

- `beforeInteractive`은 **루트 레이아웃**에서만 사용 가능합니다.
- 같은 `id`의 인라인 스크립트는 중복 주입되지 않습니다.

## 좋은 활용 사례

- GA/GTM은 `@next/third-parties` 패키지가 최적 로딩을 대신해줌 (권장)
- 무거운 위젯(챗, 지도)은 `lazyOnload`
- feature flag 초기화 같은 작은 코드는 인라인 `afterInteractive`

## DX 개선

- 로드 시점 제어가 prop 하나 — 수동 `defer`/`async`/IntersectionObserver 불필요
- 인라인 스크립트 중복 주입을 프레임워크가 관리

## 관련 문서

- [Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [@next/third-parties](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
