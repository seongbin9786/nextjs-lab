# 17 — 환경 변수

> `.env` 파일 로딩 우선순위, 서버 전용 vs `NEXT_PUBLIC_`, 빌드 시 인라인 vs 런타임.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` — 우선순위 요약 + 현재 값 표시
- `/server` — 서버 전용 변수 (클라이언트 번들에 없음)
- `/client` — `NEXT_PUBLIC_` 변수 (빌드 시 인라인)
- `/runtime` — 셸에서 주입한 런타임 변수
- `/priority` — `.env.local`을 만들어 우선순위를 직접 실험

## 이 예시가 보여주는 것

| 페이지 | 데모 | 확인할 원리 |
| --- | --- | --- |
| `/` | `EXAMPLE_PRIORITY` 현재 값 표시 | 로딩 우선순위가 어디서 승자였는지 |
| `/server` | `DB_PASSWORD` 마스킹 출력 | 접두사 없는 변수는 번들에서 빠짐 |
| `/client` | `NEXT_PUBLIC_API_URL` 출력 | 빌드 시 문자열 인라인 |
| `/runtime` | `DEPLOY_REGION` 출력 | 셸 주입 값은 요청 시점에 읽힘 |
| `/priority` | `.env.local` 실험 안내 | 파일 간 우선순위를 눈으로 확인 |

이 예시는 `.env`, `.env.development`, `.env.production`, `.env.example`을
포함합니다. `cp .env.example .env.local` 후 새로고침하면 `EXAMPLE_PRIORITY`
값이 바뀌어 우선순위를 눈으로 확인할 수 있습니다.

## 동작 원리

### 핵심 개념: 변수의 3가지 성격

| 성격 | 예시 | 읽는 곳 | 변경하려면 |
| --- | --- | --- | --- |
| 서버 전용 | `DB_PASSWORD` | 서버 컴포넌트/액션 | 재시작 |
| `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` | 브라우저 포함 **빌드 시 인라인** | **다시 빌드** |
| 런타임 | `DEPLOY_REGION` | 서버 프로세스 | 재시작 |

아래 각 절에서 이 셋이 왜 이렇게 다른지를 하나씩 뜯어봅니다.

### .env 파일 로드 우선순위

Next.js는 `.env*` 파일을 자동으로 `process.env`로 읽어옵니다. 공식 문서가
정의한 조회 순서는 이렇습니다 — **위에서 아래로 찾다가, 처음 발견한 값에서
멈춥니다.**

| 순위 | 소스 | 설명 |
| --- | --- | --- |
| 1 | 셸에서 이미 export된 값 (`process.env`) | 가장 우선. .env 파일이 절대 못 이김 |
| 2 | `.env.$(NODE_ENV).local` | 예: `.env.development.local` |
| 3 | `.env.local` | 모든 환경. 단, `NODE_ENV`가 `test`일 때는 읽지 않음 |
| 4 | `.env.$(NODE_ENV)` | `NODE_ENV`에 따라 `.env.development` 또는 `.env.production` 중 하나만 |
| 5 | `.env` | 모든 환경의 기본값. 가장 낮은 우선순위 |

정리하면 (높은 순):

1. 셸에서 이미 export된 값
2. `.env.local` (git 커밋 금지)
3. `.env.development` 또는 `.env.production` (NODE_ENV에 따라)
4. `.env` (기본값)

여기서 헷갈리기 쉬운 점들을 정리합니다.

- **NODE_ENV는 누가 정하나?** 환경 변수로 지정하지 않았다면, `next dev`는
  `development`, 그 외의 명령(`next build`, `next start` 등)은
  `production`을 자동으로 부여합니다.
- **`.env.local`은 test에서 예외.** 테스트는 누구든 같은 결과를 내야
  하므로 `NODE_ENV=test`일 때는 `.env.local`을 읽지 않습니다. 대신
  `.env.test`가 기본값 역할을 하고, `.env.test.local`은 커밋하면 안 됩니다.
- **`.env.development`와 `.env.production`은 동시에 로드되지 않습니다.**
  현재 `NODE_ENV`에 해당하는 파일 하나만 적용됩니다.
- **셸 변수는 항상 이깁니다.** 이미 export된 값이 있으면 어떤 `.env` 파일도
  그 값을 덮어쓰지 못합니다. "값이 안 바뀌는" 것 같을 때는 셸 환경을 먼저
  의심하세요.

`.env` 파일 안에서 다른 변수를 `$VARIABLE` 문법으로 참조할 수도 있고,
여러 줄 값을 따옴표 안에 넣는 것도 지원합니다.

### NEXT_PUBLIC_ 접두사: 빌드 시 인라인의 원리

기본적으로 `NEXT_PUBLIC_`이 없는 환경 변수는 **Node.js 환경에서만**
사용할 수 있습니다. 브라우저(클라이언트)는 완전히 다른 환경이라 이 값에
접근할 수 없습니다.

브라우저에서도 필요한 값을 쓰려면 `NEXT_PUBLIC_` 접두사를 붙입니다. 그러면
Next.js가 **빌드 시점에** 코드 안의 `process.env.NEXT_PUBLIC_변수` 참조를
모두 실제 값으로 **치환(인라인)** 합니다.

```ts
// components/public-env-display.tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "(없음)";
```

빌드 후 번들에는 변수 참조가 아니라 **문자열 그 자체**가 박힙니다.

```ts
// 빌드 후 번들에는 이렇게 됩니다
const apiUrl = "https://api.example.com";
```

이 "빌드 시 문자열 치환"이 만들어내는 결과가 중요합니다.

- **빌드 후에는 값을 바꿀 수 없습니다.** 공식 문서 표현대로, 빌드가 끝난
  앱은 이 환경 변수의 변화에 더 이상 반응하지 않습니다. Heroku 파이프라인처럼
  한 환경에서 빌드한 결과물을 다른 환경으로 승격하거나, 하나의 Docker
  이미지를 여러 환경에 배포하면, 모든 `NEXT_PUBLIC_` 값은 **빌드 시점의
  값으로 얼어붙습니다.** 배포 단계별로 값이 다르면 **단계별로 다시 빌드**해야
  합니다.
- **동적 참조는 인라인되지 않습니다.** 변수 이름이 빌드 시점에 고정되어야
  치환할 수 있기 때문입니다.

```ts
// 동작 안 함: 변수로 참조하면 인라인되지 않음
const varName = "NEXT_PUBLIC_API_URL";
setupAnalyticsService(process.env[varName]);

// 동작 안 함: process.env를 통째로 변수에 담으면 안 됨
const env = process.env;
setupAnalyticsService(env.NEXT_PUBLIC_API_URL);
```

직접 참조(`process.env.NEXT_PUBLIC_X`)만 치환됩니다.

- **민감한 값은 절대 `NEXT_PUBLIC_`를 붙이지 마세요.** 인라인된다는 것은
  브라우저에 내려가는 모든 JS에 그 값이 문자로 박힌다는 뜻입니다.

빌드 후에도 브라우저에서 바뀔 수 있는 값이 필요하다면, 클라이언트가 서버의
API를 통해 그 값을 받아오도록 직접 만들어야 합니다.

### 서버 전용 변수는 왜 번들에서 빠지는가

`NEXT_PUBLIC_`가 없는 변수는 클라이언트 번들에 아예 포함되지 않습니다.

| 방식 | 브라우저 번들에 포함? |
| --- | --- |
| `process.env.DB_PASSWORD` (접두사 없음) | **아니요** — 자동 제외 |
| `NEXT_PUBLIC_DB_PASSWORD` | **예** — 누구나 볼 수 있음 |

클라이언트 컴포넌트에서 `process.env.DB_PASSWORD`를 읽으면 `undefined`가
됩니다. Next.js가 접두사 없는 변수를 브라우저 번들에서 제외하기
때문입니다. 덕분에 비밀 값이 실수로 노출되는 것을 막습니다.

`/server` 페이지에서 안내한 대로 DevTools → Sources에서 번들 파일을 열고
`base-password`를 검색해 보세요. 없습니다. 반대로 `NEXT_PUBLIC_API_URL`의
값(`https://api.example.com`)은 번들 안에서 그대로 발견됩니다.

### 런타임 변수가 필요한 이유 (컨테이너 주입)

빌드 시 인라인의 반대편에 런타임 변수가 있습니다. 서버에서는 동적
렌더링 중에 환경 변수를 **요청 시점**에 안전하게 읽을 수 있습니다.

```tsx
// app/runtime/page.tsx
export const dynamic = "force-dynamic";
// ...
const runtimeValue = process.env.DEPLOY_REGION ?? "(주입 안 됨)";
```

이 페이지가 `export const dynamic = "force-dynamic"`를 붙인 이유가 바로
이것입니다. 정적으로 미리 렌더링되면 값이 빌드 시점에 고정되므로, 매 요청
읽으려면 동적 렌더링이어야 합니다. (`cookies()`, `headers()` 같은
요청 시점 API를 호출하는 것도 자동으로 동적 렌더링으로 전환시킵니다.)

이 패턴이 빛나는 곳은 컨테이너 배포입니다. **같은 Docker 이미지를
환경(dev/staging/prod)별로 다른 변수를 주입해서 띄울 수 있습니다.**

```bash
DEPLOY_REGION=ap-northeast-2 pnpm dev
```

서버를 이렇게 띄우면 `/runtime` 페이지에 값이 나타납니다. 이미지를 한 번만
빌드하고 환경별로 주입 값만 바꾸면 되므로, 배포 파이프라인이 단순해집니다.

### next.config의 env와 serverExternalPackages

환경 변수와 관련된 `next.config.ts` 설정 두 가지를 짚고 넘어갑니다.
이 예시의 `next.config.ts`는 비어 있지만, 실제 프로젝트에서 자주
만나기 때문입니다.

- **`env`**: 빌드 시점에 값을 번들에 인라인하는 **레거시 API**입니다.
  공식 문서가 "더 이상 권장하지 않는다"고 명시합니다. 중요한 차이는,
  이 방식으로 정의한 값은 **무조건** 번들에 포함됩니다 — `NEXT_PUBLIC_`
  접두사는 환경이나 `.env` 파일로 지정할 때만 의미가 있습니다. 즉,
  비밀 값을 `env`에 넣으면 실수로 클라이언트에 노출됩니다. 새 코드에서는
  `.env` 파일 + 접두사 규칙을 쓰는 것이 좋습니다.
- **`serverExternalPackages`**: 환경 변수 자체와는 직접 관련이 없지만
  함께 알아둘 설정입니다. 서버 컴포넌트와 Route Handler에서 쓰는 의존성은
  기본적으로 Next.js가 번들링하는데, Node.js 고유 기능(네이티브 모듈 등)을
  쓰는 패키지는 번들링에서 제외하고 네이티브 `require`로 로드하도록
  지정하는 옵션입니다. DB 클라이언트나 암호화 라이브러리처럼 서버에서
  비밀 값을 다루는 패키지가 번들링 때문에 깨질 때 사용합니다.

### process.env 접근은 서버/클라이언트에서 어떻게 다른가

| | 서버 (서버 컴포넌트·액션·Route Handler) | 클라이언트 (브라우저) |
| --- | --- | --- |
| 읽는 대상 | 실제 `process.env` 객체 | 빌드 시 치환된 문자열 리터럴 |
| 읽는 시점 | 렌더링/요청 처리 시점 (동적이라면 매 요청) | 빌드 시점에 이미 고정 |
| 접두사 없는 변수 | 읽힘 | `undefined` (번들에 없음) |
| `NEXT_PUBLIC_` 변수 | 읽힘 | 읽힘 (인라인된 값) |
| 값 변경 반영 | 프로세스 재시작으로 반영 | **다시 빌드**해야 반영 |

핵심은 하나입니다. **서버는 "그때그때 읽어오는 것", 클라이언트는 "빌드 때
박아둔 것."** 이 차이를 이해하면 아래 오해들이 전부 풀립니다.

## 코드와 함께 보는 설명

### `.env` 파일 4종

```txt
# .env — 모든 환경의 기본값 (우선순위 가장 낮음)
NEXT_PUBLIC_API_URL=https://api.example.com
DB_PASSWORD=base-password
EXAMPLE_PRIORITY=base(.env)
```

```txt
# .env.development — next dev에서만, .env보다 우선
EXAMPLE_PRIORITY=development(.env.development)
DB_PASSWORD=dev-password
```

```txt
# .env.production — next build / next start에서만
EXAMPLE_PRIORITY=production(.env.production)
```

```txt
# .env.example — .env.local 템플릿. 복사해서 직접 만들어보세요
EXAMPLE_PRIORITY=local(.env.local)
```

같은 키(`EXAMPLE_PRIORITY`)를 네 파일이 서로 다른 값으로 정의합니다. 그래서
현재 떠 있는 서버가 어느 환경인지, `.env.local`이 있는지 여부에 따라 화면에
보이는 값이 달라집니다.

### `app/page.tsx`, `app/priority/page.tsx` — 우선순위 관찰

두 페이지 모두 `force-dynamic`로 매 요청 `process.env.EXAMPLE_PRIORITY`를
읽어 현재 승자가 누구였는지 보여줍니다. `/priority`는 `.env.local`을 만드는
실험 절차와 함께, 셸 변수가 항상 이긴다는 주의사항을 안내합니다.

### `app/server/page.tsx` — 서버 전용 변수

```tsx
const dbPassword = process.env.DB_PASSWORD ?? "(없음)";
```

읽은 값을 일부 마스킹해서 보여줍니다. 주석에 적힌 대로 실제 앱에서는
화면에 찍지 않습니다. 데모라 마스킹해서 표시하는 것입니다. 이 페이지의
본문은 "왜 클라이언트에서 못 읽나요?"와 DevTools에서 번들을 검색해 보는
확인 방법을 설명합니다.

### `components/public-env-display.tsx` — 클라이언트에서 읽기

```tsx
"use client";

export function PublicEnvDisplay() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "(없음)";
  // ...
}
```

`"use client"` 컴포넌트에서 `NEXT_PUBLIC_` 값을 읽습니다. 이 파일이
브라우저에서 동작할 수 있는 유일한 이유는, 이 참조가 빌드 시 문자열로
치환되기 때문입니다. 런타임에 브라우저가 서버의 `process.env`를 보는
것이 아닙니다.

## 좋은 활용 사례

- 비밀 키/DB 접속: 서버 전용 + `.env.local` 또는 시크릿 매니저
- 브라우저에 필요한 공개 값만 `NEXT_PUBLIC_`
- 같은 이미지를 환경별로 띄우는 Docker 배포는 런타임 변수로
- 팀이 공유하는 기본값은 `.env`에 커밋, 개인/비밀 값은 `.env.local`

## DX 개선

- `.env*` 자동 로드 — dotenv 설정 불필요
- 접두사 하나로 서버/클라이언트 노출 경계가 명확
- 셸 → `.env.local` → 환경 파일 → `.env`의 예측 가능한 우선순위

## 흔한 오해와 주의점

1. **`NEXT_PUBLIC_` 값을 배포 후에 바꾸면 반영될 것이라 기대하기.**
   인라인된 값은 빌드 때 얼어붙습니다. 단계별로 값이 다르면 단계별로 다시
   빌드해야 합니다.
2. **클라이언트에서 서버 전용 변수를 읽으려고 하기.** 접두사 없는 변수는
   브라우저 번들에 없어 `undefined`입니다. 막히려 하지 말고, 필요한 값을
   서버 API로 내려주는 구조로 바꾸세요.
3. **`.env.local`을 git에 커밋하기.** `.env*.local`은 무시하도록 의도된
   파일입니다. 공식 문서도 "이 파일들을 저장소에 커밋하는 일은 거의
   없다"고 못박습니다.
4. **동적 참조가 인라인될 것이라 기대하기.** `process.env[varName]`처럼
   변수로 접근하면 치환되지 않아 `undefined`가 됩니다.
5. **값이 안 바뀔 때 .env 파일만 의심하기.** 셸에서 이미 export된 값이
   가장 우선합니다. `.env`를 아무리 고쳐도 셸 변수를 이길 수 없습니다.

## 관련 문서

- [Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
- [next.config.js: env](https://nextjs.org/docs/app/api-reference/config/next-config-js/env)
- [next.config.js: serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)
