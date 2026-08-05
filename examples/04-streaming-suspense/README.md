# 04 — 스트리밍과 Suspense

> 페이지를 한 번에 완성해서 보내지 않고, 준비된 부분부터 흘려보냅니다.

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
bash scripts/bench.sh   # TTFB 정량 비교 (빌드 후 포트 3104에서 측정)
```

- `pnpm dev`로 열고 `/blocking`과 `/streaming`을 번갈아 새로고침하면 차이가
  바로 보입니다. `/progressive`는 0.5초/1.5초/3초 경계가 차례대로 채워집니다.
- `scripts/bench.sh`는 프로덕션 빌드를 만들어 curl로 TTFB(첫 바이트 도착
  시간)를 잽니다. 자세한 방법은 [정량 비교](#정량-비교) 참고.
- Next.js 16.3.0 + React 19.2.8 기준입니다.

## 이 예시가 보여주는 것

| 페이지 | 내용 |
| --- | --- |
| `/blocking` | 데이터를 전부 기다린 뒤 한 번에 응답 (비교군) |
| `/streaming` | 셸 즉시 전송 + Suspense로 느린 부분 스트리밍 |
| `/progressive` | 0.5초/1.5초/3초 경계 3개가 차례대로 채워짐 |
| `/with-loading` | `loading.tsx` 파일 하나로 로딩 UI |

네 페이지 모두 `export const dynamic = "force-dynamic"`으로 매 요청마다 서버에서
렌더링하게 해 두었습니다. 캐싱 변수를 제거해서 "데이터를 기다리는 시간" 자체만
관찰하기 위해서입니다. 실제 데이터 대신 `lib/slow.ts`의 `slowQuery()`가
`setTimeout`으로 지연을 흉내 냅니다.

## 동작 원리

### 문제: 블로킹 렌더링은 한 줄도 못 보낸다

전통적인 서버 사이드 렌더링에서는 서버가 HTML 문서를 **전부 만든 다음**에야
응답을 보냅니다. 느린 DB 쿼리나 외부 API 호출이 하나만 있어도 페이지 전체가
그 시간만큼 늦어집니다. 사용자는 그동안 빈 화면을 봅니다.

### 1단계: chunked transfer encoding — HTML을 나눠 보내는 규격

스트리밍의 전송 계층은 HTTP의 **chunked transfer encoding**입니다. 응답의 전체
크기를 미리 알 수 없을 때, 데이터를 길이로 구분된 조각(chunk)으로 나눠 보내는
방식입니다 (MDN `Transfer-Encoding` 문서 참고).

```text
# HTTP/1.1 chunked 응답의 생김새
7f\r\n            ← 청크 크기 (16진수, 바이트 단위)
<html>...         ← 그 크기만큼의 데이터
\r\n
1a2\r\n           ← 다음 청크 크기
<div>...          ← 다음 데이터
\r\n
0\r\n\r\n         ← 길이 0 청크 = 응답 끝
```

규칙을 정리하면 이렇습니다.

- 각 청크는 `16진수 크기 → CRLF → 데이터 → CRLF` 순서입니다.
- 전체 크기를 모르므로 `Content-Length` 헤더는 생략해야 합니다.
- 길이 0 청크가 오면 응답이 끝났다는 뜻입니다.
- HTTP/2 이상에서는 이 헤더 자체가 금지되어 있습니다. 대신 프로토콜 자체의
  프레임 단위로 스트리밍이 일어나므로, chunked encoding은 HTTP/1.1 시대의
  메커니즘이라고 이해하면 됩니다. 다만 "조각으로 나눠 보내고 브라우저가
  조각마다 즉시 렌더링한다"는 그림은 그대로 유지됩니다.

이 규격 덕분에 서버는 "아직 못 만든 부분"을 기다리지 않고, 만든 만큼 바로
밀어낼 수 있습니다. 브라우저는 나머지 HTML이 오는 동안에도 이미 도착한 부분을
그리기 시작합니다.

### 2단계: React 서버 렌더러는 Suspense 경계 단위로 청크를 만든다

그렇다면 "어디까지가 한 청크"일까요? Next.js 스트리밍 가이드의 표현을 빌리면,
**React의 서버 렌더러는 `<Suspense>` 경계에 맞춰 HTML 청크를 만듭니다.**
Next.js는 이걸 App Router에 통합해서 별도 설정 없이 동작하게 합니다.

흐름은 이렇습니다.

1. 서버가 페이지 컴포넌트 트리를 렌더링합니다.
2. 어떤 컴포넌트가 아직 끝나지 않은 비동기 작업(데이터 fetch 등)에 걸려 있으면,
   그 컴포넌트는 가장 가까운 `<Suspense>` 경계에서 **일시 중단(suspend)**됩니다.
3. 경계의 `fallback`은 즉시 렌더링됩니다. 이렇게 "비동기 작업이 끝나기 전에
   렌더링되는 모든 것" — 레이아웃, 내비게이션, 폴백 UI — 을 **정적 셸
   (static shell)**이라고 부릅니다.
4. 정적 셸은 즉시 첫 청크로 전송됩니다. 이 시점에 `TTFB`가 결정됩니다.
   셸에는 `<link>`/`<script>` 태그도 함께 실려 가서, 브라우저는 서버가 나머지
   HTML을 만드는 동안에도 CSS·JS·폰트 다운로드를 미리 시작합니다
   (early resource discovery).
5. 각 Suspense 경계는 **독립적인 스트리밍 지점**입니다. 서로 다른 경계에 있는
   컴포넌트는 각자 준비되는 대로, 준비된 순서대로 도착합니다. 느린 경계가
   빠른 경계를 막지 않습니다.

### 3단계: 완성되지 않은 경계는 어떻게 내려가는가 — `<template>`과 out-of-band 교체

핵심 질문: 아직 데이터가 없는 경계의 HTML은 어떻게 생겼을까요? React는 폴백을
"그 자리에" 그냥 두고 끝내는 게 아니라, 나중에 **교체할 수 있는 표식**을
만들어 둡니다. Next.js 문서의 chunk 관찰 예시를 보면 첫 청크에 이런 것들이
실려 갑니다.

- `<template id="B:0">` 같은 표식 — 아직 미완성인 Suspense 경계의 자리표입니다.
- 그 경계의 폴백 HTML (예: 스켈레톤).
- 교체를 수행할 부트스트랩 스크립트.

그리고 서버에서 비동기 작업이 끝나면, React는 해당 경계의 완성된 HTML을
**숨겨진 `<div hidden id="S:0">`** 형태로 스트림 뒤에 실어 보내고, 그 바로 뒤에
인라인 `<script>`를 붙입니다. 이 스크립트는 `B:0` 자리의 폴백을 `S:0`의 내용으로
교체합니다. Next.js 문서는 이 구조를 이렇게 요약합니다.

> `<template id="B:0">` 표식이 Suspense 폴백의 자리표다. 경계가 완성되면
> React는 완성된 HTML을 담은 `<div hidden id="S:0">`과 그것을 페이지에 끼워
> 넣는 스크립트를 스트리밍한다.

이 방식이 **out-of-band(대역 외) 전송**이라고 불리는 이유는, 완성된 HTML이
문서의 원래 순서대로 도착하는 게 아니라 문서 **끝부분에 숨겨진 채로** 도착한 뒤
스크립트가 제자리로 옮겨 심기 때문입니다. 그리고 이 교체 스크립트는 평범한
인라인 스크립트라 **페이지의 JS 번들이나 hydration을 기다리지 않습니다.**
브라우저가 청크를 받자마자 바로 실행해서 폴백을 실제 내용으로 바꿉니다.
사용자 눈에 "스켈레톤이 카드로 바뀌는" 순간이 바로 이 스크립트가 실행되는
순간입니다.

```text
브라우저                             서버 (Next.js + React)
    |                                       |
    |  GET /streaming                       |
    | ------------------------------------> |
    |                                       | 셸 렌더링: h1, 안내 문단,
    |                                       | 폴백 2개 (정적 셸)
    | 청크 1: <head> + 셸 + 폴백 + 표식      |
    | <------------------------------------ | ← TTFB (약 0.007초)
    | 셸을 즉시 그림                          |
    |                                       |
    | 청크 2: RSC 페이로드 (초기 분량)        |
    | <------------------------------------ |
    |                                       | 1초 경과: orders 완성
    | 청크 3: <div hidden id="S:0"> + 교체   |
    |         스크립트                       |
    | <------------------------------------ | ← 주문 카드 표시
    |                                       |
    |                                       | 2초 경과: reviews 완성
    | 청크 4: <div hidden id="S:1"> + 교체   |
    |         스크립트                       |
    | <------------------------------------ | ← 리뷰 카드 표시
    |                                       |
    | 청크 5: 길이 0 청크 (응답 종료)          |
    | <------------------------------------ |
```

### 4단계: `loading.tsx`는 자동으로 만들어지는 Suspense 경계

`app/어떤폴더/loading.tsx`는 같은 폴더의 `page.tsx`를 위한 **자동 Suspense
경계**입니다. Next.js가 빌드 시점에 `loading.tsx`를 `layout.tsx` 안쪽에 중첩하고
`page.tsx`를 `<Suspense>`로 감싸는 구조로 만들어 줍니다.

```text
<Layout>            ← 즉시 렌더링 (정적 셸의 일부)
  <Suspense fallback={<Loading />}>   ← loading.tsx가 폴백이 됨
    <Page />        ← 데이터 준비되면 스트리밍되어 스켈레톤과 교체
  </Suspense>
</Layout>
```

공식 문서(`loading.js` API 레퍼런스)의 동작 규칙입니다.

- 같은 폴더에서 `loading.js`는 `page.js`와 그 아래 자식들, 그리고 `not-found.js`와
  중첩 `layout.js`를 Suspense 경계로 감쌉니다. 단, **같은 세그먼트의
  `layout.js`, `template.js`, `error.js`는 감싸지 않습니다.**
- 폴백 UI는 prefetch 대상이라 `Link`로 이동할 때 즉시 표시됩니다
  (instant loading state). prefetch가 아직 안 끝난 경우에만 즉시 표시가
  안 될 수 있습니다.
- 내비게이션은 중단 가능합니다. 새 라우트가 다 로드되기를 기다리지 않고 다른
  라우트로 또 이동할 수 있습니다.
- 새 라우트가 로드되는 동안에도 공유 레이아웃은 계속 인터랙티브합니다.
- 주의: 레이아웃이 비캐시 데이터(`cookies()`, `headers()`, 비캐시 fetch 등)에
  접근하면 `loading.js`가 그 부분에 대한 폴백을 보여주지 못합니다. 내비게이션이
  레이아웃 렌더링이 끝날 때까지 막힙니다. 확실한 즉각 내비게이션을 원하면
  비캐시 데이터 접근을 `layout.tsx`에서 `page.tsx`로 옮기거나 자체
  `<Suspense>`로 감싸야 합니다.

`loading.tsx`가 보여주는 이런 즉시 로딩 상태를 Next.js는 **instant loading
state**라고 부릅니다. 스켈레톤이나 스피너처럼 가벼운 것, 또는 미래 화면의 작은
의미 있는 부분(커버 사진, 제목 등)을 미리 그려 넣어 "앱이 반응하고 있다"는
신호를 주는 것입니다.

### 5단계: RSC 페이로드 스트리밍과 hydration까지의 전체 타임라인

사용자가 보는 화면(HTML 스트림) 뒤에서는 **컴포넌트 페이로드(RSC 페이로드)**라는
또 하나의 스트림이 같이 흐릅니다. React가 클라이언트에서 트리를 다시 세우고
(hydration) 이후 클라이언트 업데이트를 처리하는 데 쓰는 직렬화된 데이터입니다.

1. **최초 페이지 로드**: RSC 페이로드는 HTML 스트림 안에 인라인으로 섞여
   도착합니다. 빌드 산물에서 보던 `self.__next_f.push(...)` 스크립트들이
   그것입니다.
2. **클라이언트 내비게이션(Link 클릭)**: 이때는 HTML이 아예 오가지 않습니다.
   `rsc: 1` 요청 헤더가 붙은 RSC 페이로드만 가져오고, React가 그걸로 컴포넌트
   트리를 제자리에서 업데이트합니다.
3. **hydration**: 스트리밍 + Suspense 환경에서 hydration은 페이지 전체를 한
   번에 막아버리는 방식이 아닙니다. 각 Suspense 경계가 hydration의 단위가 되고
   (selective hydration), React는 사용자가 상호작용하는 부분을 우선
   hydration합니다. 경계가 없다면 한 번의 블로킹 패스로 전체를 hydration하지만,
   경계가 있으면 작업이 잘게 나뉘어 메인 스레드가 숨 쉴 틈이 생깁니다
   (INP 개선).

정리하면, `/streaming` 첫 로드의 전체 타임라인은 이렇습니다.

| 시각 (이 예시 기준) | 서버 | 브라우저 |
| --- | --- | --- |
| 0초 | 셸 렌더링 완료 → 첫 청크 전송 | 셸 수신, 스켈레톤 2개 표시 (FCP) |
| 0초~ | CSS/JS 리소스 태그를 셸에서 발견 | JS 번들·CSS 다운로드 시작 |
| ~1초 | `OrdersSection` 완성 → 숨겨진 HTML + 교체 스크립트 전송 | 인라인 스크립트가 폴백을 주문 카드로 교체 |
| ~2초 | `ReviewsSection` 완성 → 같은 방식으로 전송 | 리뷰 카드로 교체 |
| ~2초 | 길이 0 청크로 응답 종료 | RSC 페이로드 기반으로 hydration, 카드들이 인터랙티브해짐 |

참고로 React 문서에 따르면, React는 중단된 내용을 **최대 300ms에 한 번**만
화면에 드러내고(reveal), 그 시간창 안에 준비가 끝난 경계들은 하나로 묶어 한꺼번에
드러냅니다. 내용이 하나씩 퐁퐁 튀어나와 화면이 깜빡이는 것을 막기 위한
배치 처리입니다.

## 코드와 함께 보는 설명

### `lib/slow.ts` — 느린 데이터 흉내내기

실제 앱에서 DB 쿼리나 외부 API 호출에 해당하는 부분입니다.

```ts
// lib/slow.ts
export async function slowQuery<T>(label: string, ms: number, value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}
```

### `app/blocking/page.tsx` — 비교군: 전부 기다리고 한 번에

```tsx
// app/blocking/page.tsx (일부)
export const dynamic = "force-dynamic";

export default async function BlockingPage() {
  // 느린 쿼리 2개를 순서대로 기다린 "다음"에야 HTML이 만들어집니다.
  const orders = await slowQuery("orders", 1000, [/* ... */]);
  const reviews = await slowQuery("reviews", 1000, [/* ... */]);
  // ...
}
```

`await` 두 개가 순서대로 실행되므로 서버는 약 2초 동안 HTML의 첫 한 글자도
보내지 못합니다. `<Suspense>` 경계가 없으니 React가 폴백을 대신 보내 줄 방법도
없습니다. curl로 재면 TTFB가 약 2초입니다.

### `app/streaming/page.tsx` — 셸 + 독립 경계 2개

```tsx
// app/streaming/page.tsx (일부)
<Suspense fallback={<SectionSkeleton label="주문 (불러오는 중)" />}>
  <OrdersSection />
</Suspense>

<Suspense fallback={<SectionSkeleton label="리뷰 (불러오는 중)" />}>
  <ReviewsSection />
</Suspense>
```

페이지 함수 자체는 동기 함수입니다 — 셸은 기다릴 것이 없으므로 즉시 첫 청크로
출발합니다. `OrdersSection`과 `ReviewsSection`은 비동기 서버 컴포넌트로,
각각 자기 `<Suspense>` 경계 안에서 일시 중단됩니다 (`components/slow-section.tsx`).

```tsx
// components/slow-section.tsx (일부)
export async function OrdersSection() {
  const orders = await slowQuery("orders", 1000, [/* ... */]);
  return (/* 주문 카드 JSX */);
}
```

`OrdersSection`은 1초, `ReviewsSection`은 2초 뒤에 완성되어 각각 스트리밍됩니다.
새로고침하면 스켈레톤 → 주문 카드(1초) → 리뷰 카드(2초) 순서로 채워집니다.

### `app/progressive/page.tsx` — 경계는 서로 막지 않는다

0.5초/1.5초/3초짜리 카드 세 개가 각자 자기 경계를 가집니다.

```tsx
// app/progressive/page.tsx (일부)
<Suspense fallback={<div className="card">0.5초 대기 중…</div>}>
  <FastCard />
</Suspense>
<Suspense fallback={<div className="card">1.5초 대기 중…</div>}>
  <MediumCard />
</Suspense>
<Suspense fallback={<div className="card">3초 대기 중…</div>}>
  <SlowCard />
</Suspense>
```

블로킹 방식이었다면 가장 느린 3초에 맞춰 페이지 전체가 늦어집니다.
스트리밍에서는 첫 바이트가 즉시, 각 카드가 준비되는 대로 도착합니다.
**페이지 체감 속도 = 가장 느린 데이터가 아니라 셸의 속도**가 됩니다.

### `app/with-loading/` — 파일 하나로 만드는 경계

```tsx
// app/with-loading/loading.tsx (일부)
// loading.tsx는 같은 폴더의 page.tsx를 위한 자동 Suspense 경계입니다.
// 1) 서버 스트리밍 중 page가 준비되기 전
// 2) 클라이언트 내비게이션(Link 클릭)으로 이 라우트로 오는 중
// 에 이 파일이 즉시 표시됩니다.
export default function Loading() {
  return (/* shimmer 스켈레톤 JSX */);
}
```

`page.tsx`는 1.5초짜리 `slowQuery`를 기다립니다. 홈에서 `Link`를 클릭하면
`loading.tsx`가 즉시 표시되어 "멈춘 느낌"을 없앱니다. 수동으로 `<Suspense>`를
감을 필요가 없습니다.

### `scripts/bench.sh` — TTFB 측정 방법

1. `pnpm build`로 프로덕션 빌드를 만듭니다 (dev 서버는 측정 대상이 아님).
2. 포트 3104로 `pnpm start`를 백그라운드에 띄우고 준비될 때까지 대기합니다.
3. `/blocking`과 `/streaming`에 각각 3번씩 curl 요청을 보내
   `time_starttransfer`(TTFB)와 `time_total`을 출력합니다.

## 정량 비교

### 이 저장소에서 실제 측정 (2026-08)

`scripts/bench.sh` 실행 결과:

| 페이지 | TTFB (첫 바이트) | 전체 응답 |
| --- | --- | --- |
| `/blocking` | **약 2.01초** | 약 2.01초 |
| `/streaming` | **약 0.007초** | 약 2.01초 |

- 첫 바이트 도착이 **약 250배** 빠릅니다.
- 전체 시간은 둘 다 ~2초로 같습니다. 스트리밍은 총량을 줄이는 최적화가
  아니라 **첫 화면을 빨리 보여주는** 최적화입니다.
- Web Vitals로 번역하면: TTFB가 "가장 느린 쿼리 시간"에서 "셸 렌더링 시간"으로
  줄고, 셸이 즉시 그려지므로 FCP가 데이터 fetch 시간과 분리됩니다.

### `loading.tsx` vs 수동 `<Suspense>`

Next.js 문서가 정리한 비교입니다.

| | `loading.tsx` | `<Suspense>` |
| --- | --- | --- |
| 범위 | 페이지 전체 | 아무 컴포넌트나 |
| 설정 | 파일 하나만 추가 | 감쌀 컴포넌트를 명시 |
| 내비게이션 | 즉시 폴백으로 prefetch됨 | 기본으로 prefetch 안 됨 |
| 어울리는 곳 | 데이터 없이는 그릴 것이 없는 페이지 | 대부분의 페이지, 세밀한 제어 |

문서의 권장 사항은 "동적 접근에 가까운 곳에 명시적 `<Suspense>` 경계를 두라"는
것입니다. 사전 렌더러가 동적 작업을 만나면 트리를 위로 거슬러 올라가 가장 가까운
Suspense 경계를 찾는데, 트리 꼭대기의 `loading.tsx`만 경계로 존재하면 페이지
전체가 통째로 스켈레톤으로 밀려나기 때문입니다.

### 스트리밍을 망칠 수 있는 것들

서버가 아무리 청크를 잘 쪼개 보내도, 중간 어딘가에서 응답을 통째로 모아 버리면
사용자는 지연된 단일 응답을 보게 됩니다. Next.js 문서가 꼽는 지점들입니다.

- **리버스 프록시**: Nginx 등은 기본으로 응답을 버퍼링합니다.
  `X-Accel-Buffering: no` 헤더로 끌 수 있습니다.
- **CDN**: 응답 전체를 모았다가 전달하는 CDN이 있습니다. 스트리밍 통과 설정이
  필요할 수 있습니다.
- **압축**: gzip/brotli는 압축 효율을 위해 내부에서 청크를 모았다가 flush하므로
  첫 청크가 늦어질 수 있습니다.
- **클라이언트**: 일부 브라우저(Safari/WebKit)는 1024바이트가 찰 때까지 스트림을
  버퍼링합니다. 실제 앱은 쉽게 넘기는 크기라 최소 데모에만 영향을 줍니다.
  curl도 기본 버퍼링이 있어 관찰 시 `-N` 플래그가 필요합니다.

## 좋은 활용 사례

- 페이지 상단(헤더·본문 틀)은 즉시, 느린 데이터(추천·리뷰)는 스트리밍
- 대시보드처럼 여러 독립 데이터 소스가 있는 페이지 — 소스별 경계
- `loading.tsx`로 내비게이션 즉시 피드백 (흰 화면 제거)
- LCP 요소(히어로 이미지, 메인 제목)는 Suspense 경계 **밖에** 두어 셸과 함께
  그려지게 하고, `next/image`의 `preload` prop으로 첫 청크에서부터 이미지를
  미리 받게 합니다.
- 스켈레톤 폴백은 실제 콘텐츠와 **크기를 맞춰** 설계합니다. 폴백이 교체될 때
  레이아웃이 밀리면 CLS가 커집니다. 경계 주변에 `min-height`로 자리를 확보하는
  것도 방법입니다.
- 동적 접근(`params`, `searchParams`, `cookies()` 등)은 페이지 최상단에서
  `await`하지 말고, 그 값이 진짜 필요한 컴포넌트까지 프로미스를 내려보내 경계
  안에서 해결하게 합니다. 그래야 셸이 최대한 커집니다.

## 흔한 오해와 주의점

1. **"스트리밍하면 응답이 빨라진다"** — 아닙니다. 전체 응답 시간은 동일합니다
   (이 예시에서도 둘 다 ~2초). 좋아지는 것은 첫 바이트와 첫 화면뿐입니다.
   서버 작업 총량이 줄어드는 최적화가 아닙니다.
2. **"스트리밍 중에는 상태 코드를 바꿀 수 있다"** — 첫 청크와 함께 이미
   `200 OK` 헤더가 나갔으므로 이후에는 상태 코드를 바꿀 수 없습니다. 스트림
   중간에 `notFound()`가 발생하면 404 대신 `<meta name="robots" content="noindex">`가
   삽입되고, `redirect()`는 클라이언트 사이드 리다이렉트가 됩니다. 진짜 404가
   필요하다면 `notFound()`를 모든 `await`와 Suspense 경계 **앞**에서 호출해야
   합니다.
3. **"Suspense를 쓰면 무조건 스트리밍된다"** — Suspense는 스트리밍의 *단위*를
   정의할 뿐입니다. 실제 전달은 chunked 전송이 중간에서 버퍼링되지 않아야
   작동합니다. 프록시/CDN/압축 계층 점검이 필요합니다 (위 목록 참고).
4. **"경계는 많을수록 좋다"** — 경계가 늘수록 hydration 단위가 잘게 나뉘어
   INP에는 유리하지만, 폴백이 화면 여기저기서 교체되면 어지럽게 보일 수
   있습니다. React가 300ms 창으로 reveal을 배치하는 이유이기도 합니다.
   UX적으로 함께 나타나야 할 콘텐츠는 한 경계에 담으세요.
5. **"폴백은 아무거나 넣으면 된다"** — 폴백과 실제 콘텐츠의 크기가 다르면
   교체가 layout shift를 일으킵니다. 폴백은 자리를 보존하는 역할도 합니다.

## DX 개선

- 수동 스켈레톤/폴백 배선이 파일 규칙(`loading.tsx`)으로 대체
- "느린 데이터 하나가 페이지 전체를 막는" 문제를 구조적으로 해결
- React Suspense와 동일 API — 별도 스트리밍 라이브러리 불필요

## 관련 문서

- [Streaming](https://nextjs.org/docs/app/guides/streaming)
- [loading.tsx](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [React Suspense 레퍼런스](https://react.dev/reference/react/Suspense) — 셸 우선 전송, reveal 배치, 중첩 경계
- [MDN: Transfer-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Transfer-Encoding) — chunked 인코딩 규격
- [Next.js 스트리밍 데모](https://streaming-demo.labs.vercel.dev/) ([소스](https://github.com/vercel-labs/streaming-demo)) — 경계별 스트리밍/하이드레이션 비교
- [RSC Explorer](https://rscexplorer.dev/) — RSC 페이로드 형식 탐색
