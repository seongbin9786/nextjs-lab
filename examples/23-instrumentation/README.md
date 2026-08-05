# 23 — instrumentation과 OpenTelemetry

> 서버 시작 시 초기화 훅(`register`)과 요청 에러 가로채기(`onRequestError`).

Next.js 서버의 생명주기에서 "시작될 때"와 "요청 중 에러가 났을 때" 두 지점에
코드를 끼워 넣는 방법을 보여줍니다. 외부 패키지 없이 프레임워크 내장 훅만으로
터미널에서 바로 동작을 확인할 수 있는 예시입니다.

## 실행

```bash
pnpm install
pnpm dev   # 터미널 로그를 함께 보세요
```

1. 서버 시작 시 터미널에 `[instrumentation] register() 실행됨` 출력
2. `/crash?boom=1` 접속 → `[instrumentation] 요청 에러: GET /crash — ...` 출력

프로덕션 모드(`pnpm build && pnpm start`)에서도 같은 로그가 찍힙니다.
`register()`는 개발 서버든 프로덕션 서버든 서버 인스턴스가 시작될 때마다
호출되기 때문입니다.

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `instrumentation.ts` | 서버 시작 시 1회 호출되는 `register()`, 요청 에러 때 호출되는 `onRequestError()` |
| `app/crash/page.tsx` | 렌더링 도중 서버 에러를 던져 `onRequestError` 훅을 실제로 발동 |
| 터미널 로그 | 두 훅이 실제로 호출되는 시점과 전달되는 정보 |

## 동작 원리

### instrumentation.ts는 "루트"에서 인식되는 파일입니다

`instrumentation.ts`(또는 `.js`)는 **프로젝트 루트**에 둡니다. `src/` 폴더를
쓴다면 `src/` 안, `app`·`pages`와 같은 깊이에 둡니다. `app/`이나 `pages/`
안에 넣으면 프레임워크가 인식하지 못합니다. 이 파일은 라우트가 아니라
"서버 생명주기 훅의 묶음"이기 때문입니다.

### register()는 언제, 어떤 프로세스에서 호출되나요

공식 문서의 정의는 이렇습니다.

> `register` 함수는 새 Next.js 서버 인스턴스가 시작될 때 **한 번** 호출되며,
> 서버가 요청을 받을 준비가 되기 전에 완료되어야 한다.

정리하면 세 가지입니다.

1. **한 서버 프로세스(인스턴스)당 한 번** 호출됩니다. `next start`로 띄운
   프로덕션 서버라면 프로세스 시작 시 한 번, `next dev`라면 개발 서버가
   시작될 때 한 번입니다. 요청이 몇 번 들어오든 다시 실행되지 않습니다.
2. **서버가 요청을 받기 전에 완료**되어야 합니다. `register()`가 느리면 서버
   시작도 늦어집니다. 그래서 DB 커넥션 풀 준비, 트레이싱 SDK 등록처럼
   "요청마다 하면 낭비인 초기화"를 두는 자리입니다.
3. **모든 런타임 환경에서 호출**됩니다. Node.js 런타임과 Edge 런타임 모두에서
   호출되기 때문에, 특정 런타임에서만 동작하는 코드는 `NEXT_RUNTIME` 환경
   변수로 구분해서 조건부로 불러와야 합니다.

```ts
// NEXT_RUNTIME으로 런타임 구분 (공식 문서 패턴)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node"); // Node 전용 초기화
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./instrumentation-edge"); // Edge 전용 초기화
  }
}
```

부수 효과가 있는 모듈(전역 등록, 폴리필 등)은 파일 맨 위가 아니라
`register()` **안에서** `import` 하는 것이 권장됩니다. 모든 부수 효과를 한
곳에 모으고, 빌드 중에 의도치 않게 실행되는 것을 막기 위해서입니다.

### onRequestError()는 요청 생명주기의 어디에 걸리나요

요청 처리 흐름은 대략 이렇습니다.

```
요청 도착 → 라우트 매칭 → 렌더링(render) / 라우트 핸들러(route) /
서버 액션(action) / 프록시(proxy) 실행 → 응답
```

이 흐름 어디선가 **잡히지 않은 에러**가 던져져서 Next.js 서버가 그 에러를
포착하는 순간 `onRequestError()`가 호출됩니다. 즉 "에러가 사용자에게 에러
화면으로 전달되기 직전, 서버 측에서 마지막으로 가로챌 수 있는 지점"입니다.
`try/catch`로 직접 잡은 에러는 이 훅까지 오지 않습니다.

Next.js 15에서 도입된 이 훅은 세 가지 인자를 받습니다.

| 인자 | 내용 |
| --- | --- |
| `error` | 던져진 에러. 타입은 `unknown`이라 사용하기 전에 좁혀야 합니다 |
| `request` | `{ path, method, headers }` — 요청 경로, 메서드, 헤더 |
| `context` | 에러가 발생한 맥락 (아래 표) |

`context`에 담기는 정보는 꽤 구체적입니다.

| 필드 | 값 |
| --- | --- |
| `routerKind` | `'App Router'` 또는 `'Pages Router'` |
| `routePath` | 라우트 파일 경로, 예: `/app/blog/[dynamic]` |
| `routeType` | 에러 발생 지점: `'render'` \| `'route'` \| `'action'` \| `'proxy'` |
| `renderSource` | `'react-server-components'` \| `'react-server-components-payload'` \| `'server-rendering'` |
| `revalidateReason` | `'on-demand'` \| `'stale'` \| `undefined` (일반 요청) |
| `renderType` | `'dynamic'` \| `'dynamic-resume'` (PPR) |

여기서 중요한 함정이 하나 있습니다. **`error`가 원래 던져진 에러 인스턴스가
아닐 수 있습니다.** 서버 컴포넌트 렌더링 도중 발생한 에러는 React가 한 번
가공해서 전달합니다. 이때 원본 에러를 식별하는 단서가 `digest` 속성입니다.
예시의 로그에 `digest`를 함께 찍는 이유가 이것입니다.

또 하나, `onRequestError` 안에서 비동기 작업(에러 리포팅 API 호출 등)을 한다면
반드시 `await` 해야 합니다. 훅이 리턴된 뒤에 백그라운드에서 도는 작업은
완전히 실행된다는 보장이 없습니다.

### 예시의 커스텀 로깅은 이렇게 끼워집니다

`/crash?boom=1` 요청의 전체 흐름을 따라가 보겠습니다.

1. `app/crash/page.tsx`가 렌더링됩니다. 이 페이지는 `searchParams`에서
   `boom === "1"`이면 `throw new Error(...)`로 서버 에러를 던집니다.
2. Next.js 서버가 렌더링 중 에러를 포착하고 기본 오류 화면을 사용자에게
   보냅니다 (이 앱에는 `error.tsx`가 없으므로 기본 화면).
3. 같은 시점에 `onRequestError()`가 호출됩니다. 에러 객체와 함께
   `request.path = "/crash?boom=1"`, `request.method = "GET"`이 전달됩니다.
4. 예시는 여기서 `console.error`로 로그를 남깁니다. 실제 운영에서는 이 한
   줄이 Sentry 전송, 슬랙 알림, OTel 로그 레코드 생성 등으로 바뀝니다.

핵심은 **에러 리포팅 연동 지점이 한 곳**이라는 것입니다. 페이지마다, 라우트
핸들러마다 `try/catch`를 뿌리지 않아도 됩니다.

### OpenTelemetry 훅을 켜면 생기는 span들

Next.js는 자체적으로 이미 OpenTelemetry 계측이 들어가 있습니다. 즉 우리가
Next.js 내부를 손대지 않아도, **SDK만 등록하면** Next.js가 요청 처리 과정에서
span을 만들어 내보냅니다. SDK 등록 자리가 바로 `register()`입니다.

```ts
// 방법 1: @vercel/otel (Edge 런타임도 지원)
import { registerOTel } from "@vercel/otel";
export function register() {
  registerOTel({ serviceName: "next-app" });
}
```

```ts
// 방법 2: NodeSDK 직접 설정 (Node.js 런타임 전용)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node"); // 여기서 NodeSDK start
  }
}
```

`NodeSDK`는 Edge 런타임과 호환되지 않으므로 반드시 `NEXT_RUNTIME` 가드가
필요합니다. 예시의 `instrumentation.ts`에 주석으로 들어 있는 패턴이 바로
이것입니다.

SDK가 등록되어 있으면 요청마다 루트 span `GET /requested/pathname`이 생기고,
그 아래에 Next.js가 자동으로 만든 span들이 걸립니다. 공식 문서에 나온 주요
span은 다음과 같습니다.

| span 이름 | 타입(`next.span_type`) | 의미 |
| --- | --- | --- |
| `[http.method] [next.route]` | `BaseServer.handleRequest` | 요청당 하나씩 생기는 루트 span |
| `render route (app) [next.route]` | `AppRender.getBodyResult` | App Router 라우트 렌더링 |
| `fetch [http.method] [http.url]` | `AppRender.fetch` | 코드에서 실행한 fetch |
| `executing api route (app) [next.route]` | `AppRouteRouteHandlers.runHandler` | Route Handler 실행 |
| `generateMetadata [next.page]` | `ResolveMetadata.generateMetadata` | metadata 생성 |
| `resolve page components` | `NextNodeServer.findPageComponents` | 페이지 컴포넌트 해석 |
| `resolve segment modules` | `NextNodeServer.getLayoutOrPageModule` | 레이아웃/페이지 모듈 로드 |
| `start response` | `NextNodeServer.startResponse` | 첫 바이트 송신 시점 (길이가 0인 span) |

Pages Router를 함께 쓴다면 `getServerSideProps`, `getStaticProps`,
`render route (pages)` span도 생깁니다. span들에는 OpenTelemetry 표준 속성과
함께 `next.span_name`, `next.span_type`, `next.route`, `next.rsc`, `next.page`
같은 커스텀 속성이 붙습니다.

두 가지 환경 변수도 알아두면 좋습니다.

- `NEXT_OTEL_VERBOSE=1` — Next.js는 기본적으로 내보내는 것보다 더 많은 span을
  계측하고 있습니다. 자세한 span까지 보고 싶을 때 켭니다.
- `NEXT_OTEL_FETCH_DISABLED=1` — `fetch` span을 끕니다. 별도의 fetch 계측
  라이브러리를 쓸 때 중복을 피하는 용도입니다.

여기에 `@opentelemetry/api`의 `startActiveSpan`으로 비즈니스 로직 span을 직접
추가하면, "한 요청 안에서 렌더링 → fetch → 내 코드"가 하나의 trace로
이어집니다.

### 클라이언트 측 계측은 다른 파일입니다

`instrumentation.ts`는 서버 전용입니다. 브라우저에서 실행되는 계측(애널리틱스,
클라이언트 에러 추적 등)은 `instrumentation-client.ts`라는 별도 파일에
작성합니다. 이 파일은 HTML 문서가 로드된 뒤, React 하이드레이션이 시작되기
전에 브라우저에서 실행됩니다. 서버 훅과 클라이언트 훅을 같은 파일에 넣으려
하면 안 됩니다.

## 코드와 함께 보는 설명

### `instrumentation.ts` — register()

```ts
// instrumentation.ts: 서버 시작 시 한 번 실행되는 초기화 훅입니다.
// app/ 폴더 밖(프로젝트 루트)에 둡니다.

export async function register() {
  console.log(
    `[instrumentation] register() 실행됨 — 런타임: ${process.env.NEXT_RUNTIME ?? "nodejs"}`,
  );

  // OpenTelemetry를 쓴다면 여기서 초기화합니다.
  // if (process.env.NEXT_RUNTIME === "nodejs") {
  //   await import("./instrumentation-otel");
  // }
}
```

로그에 `NEXT_RUNTIME`을 함께 찍어 어느 런타임에서 호출됐는지 확인할 수
있습니다. 이 예시는 Edge 런타임 라우트가 없어서 `nodejs`만 보입니다.

### `instrumentation.ts` — onRequestError()

```ts
// instrumentation.ts
export function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
) {
  console.error(
    `[instrumentation] 요청 에러: ${request.method} ${request.path} — ${err.message} (digest: ${err.digest ?? "없음"})`,
  );
}
```

실제 서명은 `error: unknown`이고 세 번째 인자 `context`도 받지만, 예시는
설명을 위해 많이 쓰는 필드만 타입으로 적었습니다. 에러 리포팅 서비스로
보낼 때는 `context.routeType`과 `context.routePath`까지 함께 보내면
"어느 라우트의 어떤 종류의 처리에서 났는지"까지 분류할 수 있습니다.

### `app/crash/page.tsx` — 에러를 던지는 페이지

```tsx
// app/crash/page.tsx
export default async function CrashPage({
  searchParams,
}: {
  searchParams: Promise<{ boom?: string }>;
}) {
  const { boom } = await searchParams;

  if (boom === "1") {
    throw new Error("instrumentation 데모용 서버 에러");
  }
  // ... 생략: 에러 없이 렌더링되는 안내 화면
}
```

`boom=1`일 때 던져진 에러는 어디서도 잡히지 않으므로 Next.js 서버가
포착하고, 그 순간 `onRequestError`가 호출됩니다.

## 정량 비교: 에러 감지 시점

| 방식 | 발견 시점 |
| --- | --- |
| 사용자 제보 | 운영 영향 후 |
| 로그 모니터링 | 로그 수집 주기만큼 지연 |
| `onRequestError` + APM | **발생 즉시** (경로·메서드·digest 포함) |

## 좋은 활용 사례

- 에러 리포팅(Sentry 등)은 `onRequestError` 한 곳에서
- `digest`로 클라이언트 오류 화면과 서버 로그 매칭
- 무거운 초기화는 `register()`에서 한 번만 (요청마다 하지 않음)
- DB 커넥션 풀, 외부 서비스 클라이언트처럼 "서버 프로세스와 수명을 같이하는"
  객체 준비
- OTel SDK 등록 후 `startActiveSpan`으로 비즈니스 로직 커스텀 span 추가 —
  Next.js 자동 span과 같은 trace로 이어집니다

## DX 개선

- 프레임워크 라이프사이클 훅이라 웹훅/별도 서버 없이 초기화
- 에러 컨텍스트(경로, 메서드, 헤더)가 자동으로 함께 전달
- 추가로 `context`(라우터 종류, 라우트 경로, 에러 발생 지점의 종류)까지
  제공되어 에러 분류 로직을 서버 측에서 끝낼 수 있음

## 흔한 오해와 주의점

1. **`app/` 안에 넣으면 동작하지 않습니다.** `instrumentation.ts`는 프로젝트
   루트(또는 `src/`)에 있어야 합니다. `pageExtensions`를 customize했다면 파일
   이름도 그에 맞춰 바꿔야 합니다.
2. **`register()`는 서버 시작을 막습니다.** 요청을 받기 전에 완료되어야
   하므로, 여기서 느린 네트워크 호출을 동기적으로 기다리면 서버 시작 자체가
   늦어집니다. 타임아웃이 있는 초기화라면 비동기 처리 방식을 고민하세요.
3. **`onRequestError`의 에러는 원본이 아닐 수 있습니다.** 서버 컴포넌트
   렌더링 중 발생한 에러는 React가 가공한 인스턴스가 전달됩니다. 원본을
   특정하려면 `digest`를 기준으로 매칭해야 합니다.
4. **클라이언트 에러는 이 훅의 담당이 아닙니다.** `onRequestError`는 서버가
   포착한 에러만 받습니다. 브라우저에서 나는 에러는
   `instrumentation-client.ts`에서 `window.addEventListener("error", ...)`
   등으로 잡아야 합니다.
5. **직접 잡은 에러는 훅까지 오지 않습니다.** 이 훅은 Next.js 서버가 포착한
   "잡히지 않은" 서버 에러가 대상입니다. `try/catch`로 스스로 처리한 에러는
   여기 전달되지 않으니, 의도적으로 복구하고 넘기는 에러와 리포팅해야 할
   에러를 구분해 설계하세요.

## 관련 문서

- [OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry)
- [instrumentation.js API 참조](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) — `onRequestError` 전체 서명
- [Instrumentation 가이드](https://nextjs.org/docs/app/guides/instrumentation) — `NEXT_RUNTIME` 분기, 부수 효과 import 패턴
- [instrumentation-client.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client) — 클라이언트 측 계측
