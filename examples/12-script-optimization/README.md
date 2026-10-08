# 12 — 스크립트 최적화 (next/script)

> analytics, 챗 위젯 같은 서드파티 스크립트를 "언제" 로드할지 전략으로 제어합니다.
> 페이지의 핵심 렌더링은 그대로 두고, 곁가지 스크립트만 뒤로 미루거나 분리합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` — 전략 4가지 요약
- `/demo` — 세 전략의 로드 시점을 ms 단위로 측정해 표시
- `/inline` — 인라인 스크립트와 `id` 규칙

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `app/layout.tsx` | 루트 레이아웃의 인라인 `beforeInteractive` 스크립트 |
| `app/demo/page.tsx` | `afterInteractive`/`lazyOnload` 외부 스크립트 로드 |
| `app/inline/page.tsx` | 인라인 스크립트와 `id` 필수 규칙 |
| `components/script-load-monitor.tsx` | 스크립트 실행 시각을 측정해 표로 표시 |
| `public/demo-scripts/*.js` | 로드 순간을 기록하는 더미 서드파티 스크립트 |

## 전략 4가지

| 전략 | 로드 시점 | 용도 |
| --- | --- | --- |
| `beforeInteractive` | 페이지 JS 실행 전 (초기 HTML 주입) | 봇 감지 등 반드시 먼저 필요한 것 |
| `afterInteractive` (기본) | 하이드레이션 직후 | analytics 대부분 |
| `lazyOnload` | 모든 리소스 로드 후, 유휴 시간 | 챗 위젯 등 우선순위 낮은 것 |
| `worker` (Partytown) | 웹 워커로 이동 | 메인 스레드 완전 분리 |

## 동작 원리

`next/script`는 전략마다 `<script>` 요소를 DOM에 넣는 **시점과 방법**을 다르게
구현합니다. "언제 삽입하는가"가 곧 "메인 스레드를 언제 차지하는가"입니다.

### beforeInteractive — 초기 HTML에 주입

서버가 HTML을 만들 때 `<head>` 안에 `<script>`를 직접 넣어 보냅니다.

- 어떤 Next.js 코드보다 **먼저 다운로드**되고, 배치된 순서대로 실행됩니다.
- 컴포넌트 트리에서 어디에 두든 **항상 `<head>`로 주입**됩니다.
- 다운로드 자체는 빠르지만 실행이 hydration을 막지는 않습니다.
- **루트 레이아웃(`app/layout.tsx`)에서만** 사용할 수 있습니다. 앱 전체에
  필요한 스크립트(봇 감지, 쿠키 동의 관리자 등)용입니다.

이 예시에서는 루트 레이아웃의 인라인 `beforeInteractive` 스크립트가
`window.__loadedScripts` 배열을 초기화하고 시작 시각을 기록합니다. 그래서
`/demo`에서 다른 스크립트들이 "페이지보다 먼저(음수)" 실행된 것으로 표시됩니다.

### afterInteractive — hydration 후 동적 삽입 (기본)

초기 HTML에는 없고, 클라이언트에서 **하이드레이션이 일어난 뒤** 스크립트 요소를
만들어 DOM에 삽입합니다.

- "가능한 한 빨리, 하지만 내 앱의 첫 렌더링·상호작용 이후"라는 위치입니다.
- 태그 매니저, analytics처럼 대부분이 여기에 속합니다.
- 어떤 페이지/레이아웃에 두든 그 페이지(또는 레이아웃 범위)가 열릴 때만 로드됩니다.

### lazyOnload — 유휴 시간에 삽입

역시 클라이언트에서 삽입하되, **페이지의 모든 리소스가 로드된 뒤 브라우저가
한가한 시간**까지 기다렸다가 삽입합니다.

- 첫 렌더링은 물론 `load` 이벤트 이후로 밀리므로 가장 늦게 실행됩니다.
- 챗 위젯, 소셜 위젯 등 없어도 페이지 사용에 지장이 없는 스크립트용입니다.

### worker — 웹 워커로 분리 (Partytown)

스크립트 실행 자체를 **웹 워커**로 옮겨 메인 스레드에서 완전히 분리합니다.

- 실험 단계이며, **App Router에서는 아직 동작하지 않습니다**(Pages Router 전용).
- 사용하려면 `next.config.js`에 `experimental.nextScriptWorkers: true`를 켜고
  Partytown 패키지를 설치해야 합니다.
- 이 예시(App Router)에서는 사용할 수 없어 표와 설명으로만 다룹니다.

```js
// next.config.js — worker 전략 사용 조건 (Pages Router 전용)
module.exports = {
  experimental: { nextScriptWorkers: true },
};
```

이 플래그를 켜고 개발 서버를 실행하면 Next.js가 Partytown 패키지
(`@builder.io/partytown`) 설치 방법을 안내합니다. Partytown은 워커 안에서도 DOM
API에 접근할 수 있게 프록시하는 방식이라, 모든 서드파티 스크립트가 완벽히
동작하긴 어렵습니다. 도입 전 Partytown의 trade-offs 문서를 확인하세요.

### 같은 src의 중복 제거

여러 페이지나 레이아웃에 같은 `src`의 `<Script>`를 두어도, Next.js는 그
스크립트를 **한 번만 로드**합니다. 사용자가 같은 레이아웃 아래 라우트들을
오가도 재다운로드·재실행되지 않습니다. 인라인 스크립트는 `id`가 식별자 역할을
합니다 — 같은 `id`의 인라인 스크립트는 중복 주입되지 않습니다.

### 인라인 스크립트 처리

외부 파일 없이 코드 자체를 children이나 `dangerouslySetInnerHTML`로 넣을 수
있습니다. 이때는 **`id`가 필수**입니다. Next.js가 스크립트를 추적하고 중복을
막는 기준이 `id`이기 때문입니다.

```tsx
<Script id="inline-demo" strategy="afterInteractive">
  {`document.getElementById("result").textContent = "실행됨";`}
</Script>
```

`onLoad`, `onReady`, `onError` 핸들러도 지원합니다. 단, 이 핸들러들은 **클라이언트
컴포넌트**에서만 동작하며, `onLoad`/`onError`는 `beforeInteractive`과 함께 쓸 수
없습니다(대신 `onReady` 사용). `nonce`나 `data-*` 같은 추가 속성은 그대로
최종 `<script>` 요소에 전달됩니다.

```tsx
// 추가 속성은 그대로 최종 <script> 요소에 전달됩니다 (예: CSP용 nonce)
<Script
  src="https://example.com/script.js"
  id="example-script"
  nonce="XUENAJFW"
  data-test="script"
/>
```

### /demo의 로드 순서 타임라인

이 예시의 `/demo` 페이지에서는 세 스크립트가 다음 순서로 DOM에 삽입됩니다.

| 순서 | 스크립트 | 전략 | 삽입 위치/시점 |
| --- | --- | --- | --- |
| 1 | `page-start.js` (인라인) | beforeInteractive | 초기 HTML `<head>` |
| 2 | `tracker.js` | afterInteractive | 하이드레이션 후 DOM 삽입 |
| 3 | `chat-widget.js` | lazyOnload | `load` 이후 유휴 시간에 DOM 삽입 |

`beforeInteractive`만 서버가 HTML에 직접 넣고, 나머지 둘은 클라이언트 JS가
시점에 맞춰 `<script>` 요소를 만들어 끼워 넣는다는 차이가 핵심입니다.

## 코드와 함께 보는 설명

### app/layout.tsx — beforeInteractive (루트 레이아웃 전용)

```tsx
// app/layout.tsx
<Script id="page-start" strategy="beforeInteractive">
  {`window.__loadedScripts = window.__loadedScripts || [];
window.__loadedScripts.push({ name: "page-start.js (beforeInteractive)", at: Date.now() });`}
</Script>
```

초기 HTML의 `<head>`에 주입되어, 다른 모든 스크립트와 페이지 JS보다 먼저
실행됩니다. 전역 배열을 만들어 두는 덕분에 뒤이어 로드되는 스크립트들이 자기
실행 시각을 기록할 수 있습니다.

### app/demo/page.tsx — 세 전략의 로드 시점 측정

```tsx
// app/demo/page.tsx
{/* afterInteractive (기본): 하이드레이션 직후 */}
<Script src="/demo-scripts/tracker.js" strategy="afterInteractive" />

{/* lazyOnload: 유휴 시간에 로드 */}
<Script src="/demo-scripts/chat-widget.js" strategy="lazyOnload" />

<ScriptLoadMonitor />
```

`tracker.js`와 `chat-widget.js`는 실행되면 자기 이름과 시각을
`window.__loadedScripts`에 기록하는 더미 스크립트입니다. 별도 계측 도구 없이
페이지 안에서 로드 순서가 그대로 드러나도록 설계했습니다.

### components/script-load-monitor.tsx — 시각 표

`window.__loadedScripts`를 300ms 간격으로 읽어, 각 스크립트의 실행 시각에서
`pageShownAt`(브라우저에서 이 컴포넌트가 hydration된 시각)을 뺀 차이를 ms로
표시합니다. 기준 시각을 서버 컴포넌트의 `Date.now()`로 잡지 않는 이유는 `/demo`가
정적 생성 페이지라 그 값이 빌드 시각이 되기 때문입니다. 음수가 나오면
"페이지 JS보다 먼저 실행됨"으로 표시합니다. `beforeInteractive` 스크립트가
음수가 되는 것이 기대 동작입니다.

### public/demo-scripts/tracker.js — 더미 서드파티

```js
// public/demo-scripts/tracker.js
window.__loadedScripts = window.__loadedScripts || [];
window.__loadedScripts.push({
  name: "tracker.js",
  at: Date.now(),
});
```

`chat-widget.js`도 이름만 다르고 형태가 같습니다. 실행 순간을 전역 배열에
기록하는 간단한 트릭으로, 별도 계측 도구 없이 전략별 실행 시점을 페이지
안에서 그대로 비교할 수 있습니다.

### DevTools에서 직접 확인하는 법

- **Network**: `tracker.js` 요청은 문서/하이드레이션 직후에, `chat-widget.js`
  요청은 타임라인의 맨 끝쪽에 나타납니다. `page-start`(인라인)는 별도 요청이
  없습니다 — HTML 자체에 포함되어 있기 때문입니다.
- **Elements**: `beforeInteractive` 스크립트는 `<head>` 안에, `afterInteractive`/
  `lazyOnload`로 삽입된 스크립트는 `<body>` 아래쪽에 동적으로 추가된 것을
  볼 수 있습니다.
- **Console**: `window.__loadedScripts`를 직접 실행하면 각 스크립트의 실행
  시각 배열을 볼 수 있습니다.

### app/inline/page.tsx — 인라인과 id 규칙

```tsx
// app/inline/page.tsx
<Script id="inline-demo" strategy="afterInteractive">
  {`document.getElementById("inline-result").textContent =
  "인라인 스크립트가 " + new Date().toLocaleTimeString("ko-KR") + " 에 실행됨";`}
</Script>
```

같은 `id`의 스크립트는 페이지가 바뀌어도 다시 주입되지 않습니다(의도된 중복
제거). 페이지마다 새로 실행되어야 하는 코드라면 `onReady`나 `useEffect`가
더 맞는 도구입니다.

## 정량 비교

### 메인 스레드 비용

| 구성 | 첫 페이지 파싱/실행에 포함되는 스크립트 |
| --- | --- |
| `<script src>`를 `<head>`에 직접 | **전부** — 렌더링/TTI 지연 |
| `next/script` (afterInteractive/lazyOnload) | 핵심 HTML만 — 스크립트는 뒤로 |

`<head>`에 `<script src>`를 직접 넣으면 브라우저는 그 스크립트를 발견하는 즉시
다운로드·파싱·실행을 메인 스레드에서 처리합니다. 서드파티가 무거울수록 첫
렌더링과 조작 가능 시점(TTI)이 밀립니다. `next/script`는 이 비용을 초기 경로에서
빼서 뒤로 미룹니다.

### /demo에서 직접 확인하기

`/demo` 페이지의 표에서 `page-start.js`(beforeInteractive)는 페이지 JS보다
먼저(음수), `tracker.js`(afterInteractive)는 수십 ms, `chat-widget.js`(lazyOnload)는
모든 리소스가 로드된 후라 가장 늦게 실행되는 것을 볼 수 있습니다.

효과는 메인 스레드가 무거운 스크립트 로딩/파싱에서 해방되어 **첫 조작
반응(INP)과 TTI가 좋아지는** 것입니다. 페이지의 핵심 콘텐츠는 그대로, 곁가지
스크립트만 뒤로 미루는 셈입니다.

## 좋은 활용 사례

- GA/GTM은 `@next/third-parties` 패키지가 최적 로딩을 대신해줌 (권장)
- 무거운 위젯(챗, 지도)은 `lazyOnload`
- feature flag 초기화 같은 작은 코드는 인라인 `afterInteractive`
- 봇 감지, 쿠키 동의처럼 반드시 먼저 필요한 것만 `beforeInteractive`
- 스크립트 범위는 필요 범위에 맞춰 배치 — 전체 앱이면 루트 레이아웃, 특정
  섹션이면 그 레이아웃, 한 페이지면 그 페이지 (불필요한 성능 영향을 줄임)

### next/script가 필요 없는 경우

- **내가 직접 짠 코드(first-party)** — 내 코드는 로드 전략이 아니라 코드 분할
  (예시 18)로 접근하는 문제입니다. `next/script`는 서드파티용 도구입니다.
- **페이지마다 다시 초기화해야 하는 상태** — 해당 컴포넌트의 `useEffect`가
  더 단순하고 읽기 쉽습니다.
- **GA/GTM** — `@next/third-parties`의 전용 컴포넌트(`GoogleAnalytics`,
  `GoogleTagManager`)가 최적 로딩을 내장하고 있어, `next/script`를 직접 짤
  일이 거의 없습니다. (이 예시는 의존성을 최소화하려고 직접 사용합니다.)

### DX 개선

- 로드 시점 제어가 prop 하나 — 수동 `defer`/`async`/IntersectionObserver 불필요
- 인라인 스크립트 중복 주입을 프레임워크가 관리

## 흔한 오해와 주의점

1. **"`beforeInteractive`를 아무 페이지에서나 쓸 수 있다"** — 루트 레이아웃
   (`app/layout.tsx`)에서만 사용할 수 있습니다. 앱 전체가 아니라 특정 페이지에만
   필요한 스크립트라면 `afterInteractive`/`lazyOnload`를 그 페이지에 두세요.
2. **"`worker` 전략을 App Router에서 쓸 수 있다"** — 아직 실험 단계이며 App
   Router에서는 동작하지 않습니다(Pages Router 전용). 이 예시에서도 사용할 수 없습니다.
3. **"인라인 스크립트에 `id`를 안 붙여도 된다"** — `id`는 필수입니다. Next.js가
   스크립트를 추적하고 중복 주입을 막는 기준입니다.
4. **"같은 스크립트를 여러 페이지에 두면 여러 번 실행된다"** — 같은 `src`는 한
   번만 로드됩니다. 페이지마다 초기화가 다시 필요하다면 `onReady`나 `useEffect`를
   함께 쓰세요.
5. **"`onLoad`는 어디서나 동작한다"** — `onLoad`/`onReady`/`onError`는 클라이언트
   컴포넌트(`"use client"`)에서만 동작하며, `onLoad`는 `beforeInteractive`과 함께
   쓸 수 없습니다.

## 관련 문서

- [@next/third-parties와 서드파티 라이브러리](https://nextjs.org/docs/app/guides/third-party-libraries)
- [Script — Guide](https://nextjs.org/docs/app/guides/scripts)
- [Script Component API](https://nextjs.org/docs/app/api-reference/components/script)
