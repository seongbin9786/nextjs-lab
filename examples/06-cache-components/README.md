# 06 — Cache Components (Next.js 16의 새 캐싱 모델)

> `"use cache"` 지시어로 캐싱을 명시적으로 선택하는 모델. PPR이 기본 내장됩니다.

## 실행

```bash
pnpm install
pnpm dev    # http://localhost:3000
pnpm build  # 빌드 출력에서 ○/◐/ƒ 기호와 Revalidate/Expire 열 확인
```

> dev에서 라우트를 돌아다니다 보면 dev 오버레이가 "이 라우트가 정적
> 셸을 못 만든다"는 인사이트(경고)를 띄웁니다. 이 예시의 `/dynamic`은
> 그 경고를 의도적으로 통과하면서 규칙을 배우는 페이지입니다.

## 이 예시가 보여주는 것

| 페이지 | 내용 | 빌드 출력 |
| --- | --- | --- |
| `/` | 이전 모델과 새 모델 비교 표 | ○ |
| `/dynamic` | 기본 동작(매 요청 실행) + `connection()` 규칙 배우기 | ƒ |
| `/cached` | `"use cache"` + `cacheLife` + `cacheTag` | ○ |
| `/posts` | 태그 무효화 + `updateTag`(즉시 반영) | ○ |
| `/mixed` | 정적 셸 + 동적 구멍 (PPR) | ◐ |

## 동작 원리

### 모델의 대전제: 기본값의 역전

```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true };
```

켜는 순간 세상이 반대로 바뀝니다.

| | 이전 모델 (05예시) | Cache Components |
| --- | --- | --- |
| 기본 동작 | fetch 캐시는 옵션 지정 시에만, 정적/동적 판단은 암묵적 | **모든 것이 요청 시 실행** |
| 캐싱 | fetch 옵션·세그먼트 설정으로 암묵적 | `"use cache"` 지시어로 명시적 |
| 정적 셸 | 라우트 전체가 정적이거나 동적이거나 | **PPR 기본**: 셸은 정적, 구멍만 동적 |
| 세그먼트 설정 | `dynamic`/`revalidate`/`fetchCache` | **사용 불가** (`cacheComponents`와 함께 쓸 수 없음) |

Cache Components는 빌드 시 **모든 라우트의 정적 셸(static shell) 생성을
검증**합니다. 셸을 못 만드는 코드가 있으면 dev에서 인사이트/오류로
알려주고, 통째로 동적이어야 하는 라우트는 `export const instant = false`로
검증에서 제외합니다. 목표는 "모든 내비게이션이 즉시 열리는 것"입니다.

### `"use cache"`가 컴파일 타임에 하는 일

`"use cache"`는 런타임 플래그가 아니라 **컴파일러 지시어**입니다.
함수/컴포넌트/파일 맨 앞에 붙으면 그 대상을 캐시 경계로 등록합니다.

- 붙일 수 있는 위치: 파일 최상위(파일의 모든 export가 캐시됨), async
  함수 몸통의 첫 줄, async 컴포넌트 몸통의 첫 줄. 대상은 반드시
  async여야 합니다.
- 캐시되는 것은 **반환값(RSC 페이로드로 직렬화됨)**입니다.
- **캐시 키는 컴파일러가 자동 생성**합니다:
  1. 빌드 ID — 새 배포면 모든 캐시가 리셋 (배포 간 캐시 공유 없음)
  2. 함수 ID — 코드베이스에서 함수의 위치와 시그니처의 해시
  3. 직렬화된 인수 — props나 함수 인수
  4. 클로저에서 참조한 외부 변수도 자동으로 포착되어 키에 포함
- 그래서 `unstable_cache` 시절처럼 키 문자열을 손으로 관리하지
  않습니다. 인수가 다르면 자동으로 별도 캐시 항목이 됩니다.

제약도 여기서 나옵니다. 캐시 함수는 격리된 환경에서 실행되므로
`cookies()`/`headers()`/`searchParams`를 직접 읽을 수 없습니다
(호출 스택을 따라 전파되어 내부에서 호출하는 헬퍼가 읽어도 실패).
인수와 반환값은 직렬화 가능해야 합니다(클래스 인스턴스, 함수, URL
인스턴스 불가 — JSX는 반환은 가능, 인수는 pass-through만).

### 캐시 항목이 저장되는 곳 3군데

캐시 함수의 출력은 RSC 페이로드로 직렬화되어 다음 세 곳에 놓입니다.
`cacheLife`가 각 사본의 수명을 정합니다.

```
"use cache" 함수의 결과 (RSC 페이로드)
   ├─ ① prerender된 HTML  — 빌드 시 셸로 포함. 디스크/CDN에 저장
   │      → 재방문자는 서버 계산 없이 즉시 받음
   ├─ ② 서버 공유 저장소  — 기본은 인스턴스별 in-memory LRU
   │      → serverless에서는 요청 간에 안 남을 수 있음
   │      → 'use cache: remote'으로 Redis/KV 등 외부 저장소 사용 가능
   └─ ③ 브라우저  — 내비게이션/프리페치로 받은 RSC 페이로드
          → stale 시간 동안 클라이언트 라우터가 재사용
          → 최소 30초 보장, x-nextjs-stale-time 헤더로 서버→클라이언트 전달
```

### `cacheLife` 프로필: stale / revalidate / expire

세 개의 시간축이 각자 다른 계층을 제어합니다.

- **stale** (클라이언트): 이 시간 동안 브라우저는 서버 확인 없이
  캐시를 재사용합니다. 즉각 내비게이션의 원천.
- **revalidate** (서버): 이 시간이 지나면 다음 요청은 캐시를 즉시
  돌려주고 **백그라운드에서 새 버전**을 만듭니다 (stale-while-revalidate).
- **expire** (서버): 이 시간이 지나면 캐시 폐기. 다음 요청은 새 값을
  **기다립니다**.

내장 프로필 (공식 문서 기준):

| 프로필 | 용도 | stale | revalidate | expire |
| --- | --- | --- | --- | --- |
| `default` | 일반 콘텐츠 | 5분 | 15분 | 없음 |
| `seconds` | 실시간 데이터 | 30초 | 1초 | 1분 |
| `minutes` | 자주 바뀌는 콘텐츠 | 5분 | 1분 | 1시간 |
| `hours` | 하루 여러 번 갱신 | 5분 | 1시간 | 1일 |
| `days` | 매일 갱신 | 5분 | 1일 | 1주 |
| `weeks` | 매주 갱신 | 5분 | 1주 | 30일 |
| `max` | 거의 안 바뀜 | 5분 | 30일 | 1년 |

이 예시의 `/cached`는 `cacheLife("minutes")` → 빌드 출력
`Revalidate 1m / Expire 1h`. `/posts`는 `cacheLife("max")` →
`Revalidate 30d / Expire 1y`. 프로필 이름이 곧 수명 정책이라, 코드
한 줄로 캐시 의미가 결정됩니다.

> `cacheLife`를 생략하면 `default` 프로필이 암묵 적용됩니다. 공식
> 문서도 모든 `"use cache"` 스코프에 명시적 `cacheLife`를 권장합니다 —
> 중첩 캐시에서 수명이 조용히 전파되는 사고를 막기 위해서입니다.

### 무효화 3형제

| API | 호출 위치 | 의미 |
| --- | --- | --- |
| `updateTag(tag)` | **Server Action 전용** | 무효화 + **같은 요청에서 즉시 재읽기** (read-your-writes). 다음 요청은 새 데이터를 기다림 |
| `revalidateTag(tag, "max")` | Action/Route Handler | stale-while-revalidate: 기존 캐시를 먼저 주고 뒤에서 갱신 (16부터 프로필 필수) |
| `revalidatePath(path)` | 둘 다 | 경로 기준 무효화 (이전 모델과 동일) |

추가로: Server Action에서 이 무효화 함수들을 호출하면 **클라이언트
라우터 캐시도 통째로 비워집니다**. 서버 캐시만 지우면 브라우저가
stale 시간 동안 옛 RSC 페이로드를 재사용할 수 있기 때문입니다.

`updateTag`를 Route Handler에서 부르면 오류입니다(역방향도 성립:
Route Handler에서는 `revalidateTag`). "웹훅은 revalidateTag, 사용자
액션은 updateTag"로 외우면 됩니다.

### `/posts` 흐름: 쓰자마자 보인다

```
사용자가 폼 제출
  └ useActionState(createPost) → Server Action 실행
      1. addPost(title)          — 메모리 "DB"에 추가
      2. updateTag("posts")      — "posts" 태그 캐시 무효화
         (이 요청 안에서 다시 읽을 때는 새 값을 보장)
      3. 액션 응답에 새 렌더링 결과가 함께 옴
  └ 브라우저: 방금 쓴 글이 포함된 새 목록을 즉시 표시
```

`revalidateTag`를 썼다면 "다음 요청"에서나 새 값이 보이지만,
`updateTag`는 같은 왕복 안에서 read-your-writes를 보장합니다. 이것이
05예시의 `revalidateTag("now-data", "max")`와 이 예시의 `updateTag`가
나뉘어 있는 이유입니다.

웹훅처럼 Server Action 밖에서 무효화해야 하면
`POST /api/revalidate-posts`처럼 Route Handler에서
`revalidateTag("posts", "max")`를 부릅니다.

### PPR: `/mixed`는 어떻게 둘로 쪼개지나

Partial Prerendering은 "정적 셸 + 동적 구멍"입니다. Cache Components를
켜면 PPR이 기본이 됩니다.

```
빌드 시 (prerender)
  getReport() ── "use cache" ──▶ 캐시 적중 → 셸에 포함
  <LiveBadge> ── connection() ─▶ 여기서 prerender 정지
      └ <Suspense> 폴백("실시간 계산 중…")만 셸에 포함

요청 시
  서버: 셸 HTML 즉시 전송 (CDN에서 바로 서빙 가능)
        └ LiveBadge 부분을 요청 시 렌더링해 스트리밍
  브라우저: 셸 즉시 표시 → 폴백 자리가 배지로 교체
```

"둘로 쪼개서 전송"이 실제로 동작하려면 빌드 산출물이 두 개 필요합니다.
**정적 HTML 셸**과 **`postponedState`**(렌더링이 어디서 멈췄는지를 담은
직렬화 상태)입니다. 요청이 오면 서버는 셸을 먼저 보내고, postponedState를
이용해 멈췄던 Suspense 경계만 **재개(resume)**해서 렌더링한 뒤 스트리밍
합니다. 셸과 postponedState는 한 쌍이라, 재검증이 일어나면 항상 함께
재생성됩니다(새 셸 + 옛 상태 조합은 허용되지 않음).

이 구조 덕분에 셸은 CDN 엣지에 올려둘 수 있습니다. CDN이 셸을 즉시
보내면서, 동시에 오리진 서버에는 동적 부분만 요청하는 방식입니다 —
오리진 요청은 `next-resume: 1` 헤더를 단 POST에 postponedState를 본문으로
실어 보내고, 서버는 셸을 건너뛰고 동적 구멍만 렌더링해 돌려줍니다.
`next start`는 이 두 단계를 한 프로세스 안에서 자동으로 처리합니다.

prerender 매니페스트로 확인되는 실제 상태:

| 라우트 | compute | response | 의미 |
| --- | --- | --- | --- |
| `/cached` | static | complete | ○ 전체가 셸 |
| `/posts` | static | complete | ○ 전체가 셸 |
| `/mixed` | **resuming** | initial | ◐ 셸만 먼저, 동적 구멍은 요청 시 재개 |
| `/dynamic` | **blocking** | empty (htmlSize 0) | ƒ 셸 없이 통째로 요청 시 렌더링 |

(모든 라우트의 renderingMode는 `PARTIALLY_STATIC`입니다.) 빌드 출력의
○/◐/ƒ 기호가 바로 이 compute 모드입니다: ○ = 정적 셸 완성(static),
◐ = 셸 + 요청 시 재개(resuming), ƒ = 매 요청 렌더링(blocking).

### `connection()`과 즉시 렌더링 검증

`connection()`은 "이 시점부터는 실제 사용자 요청이 올 때까지 기다려라"
는 선언입니다. `new Date()`, `Math.random()`처럼 요청 시점 API는
아니지만 매 요청 다른 값을 만들어야 할 때 사용합니다. await 하는
지점에서 prerender가 정지됩니다.

Cache Components는 모든 페이지가 비어 있지 않은 정적 셸을 만드는지
검증합니다. `connection()`(또는 캐시 안 된 읽기)이 `<Suspense>` 밖에
있으면 셸 생성이 통째로 막혀 오류/인사이트가 납니다. 선택지 둘:

1. 동적 부분을 `<Suspense>`로 감싼다 → 셸은 남고 그 부분만 구멍이 됨
   (`/mixed` 방식, 권장)
2. 라우트 전체가 동적이면 `export const instant = false`로 검증 제외
   (`/dynamic` 방식)

참고로 16.3.0에서 `io()`가 추가됐습니다. `connection()`은 실제 사용자의
내비게이션이 서버에 도달할 때까지 계속 대기하기 때문에 **프리페치까지
막지만**, `io()`는 일반 비동기 함수처럼 서스펜드되기만 해서 그 뒤 코드를
`"use cache"`로 감싸 캐시·프리페치할 수 있습니다. 공식 문서는 셸에서
제외하기만 하면 되는 경우 `io()`를 우선하고, `connection()`은 반드시
실제 사용자 요청을 기다려야 할 때 쓰라고 안내합니다.

### 봇/크롤러는 셸을 받지 않는다

prerender 매니페스트의 `experimentalBypassFor`를 보면 user-agent 기반
봇 감지 규칙이 들어 있습니다. 봇은 완전한 문서를 한 번에 받아야 하므로
셸 재사용을 건너뛰고 **요청 시 전체 페이지를 동적 렌더링**해 완성된
HTML을 보냅니다. 셸이 빌드 시점 데이터에만 의존하면 봇에게 렌더링이
실패할 수 있으니, 셸의 데이터는 요청 시점에도 접근 가능해야 합니다.

## 코드와 함께 보는 설명

### `next.config.ts` — 스위치 한 줄

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
};
```

### `app/cached/page.tsx` — 페이지 단위 캐시

```tsx
export default async function CachedPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("cached-page");
  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  ...
}
```

`new Date()`는 매번 다른 값이지만, `"use cache"` 스코프 안에서는
"캐시가 무효화될 때까지 같은 값"이 됩니다. 새로고침해도 시각이
안 바뀌는 이유입니다.

### `lib/data.ts` — 함수 단위 캐시

```ts
export async function getPosts() {
  "use cache";
  cacheLife("max");
  cacheTag("posts");
  return listPosts();
}
```

컴포넌트가 아니라 데이터 함수만 캐시합니다. 여러 페이지가 같은
함수를 쓰면 캐시도 공유됩니다. `unstable_cache`의 대체 형태입니다.

### `app/actions.ts` — updateTag로 즉시 반영

```ts
export async function createPost(_prev, formData) {
  ...
  addPost(title);
  updateTag("posts"); // 같은 요청에서 새 값을 다시 읽음
  return { ok: true, message: `"${title}" 추가 완료` };
}
```

### `components/add-post-form.tsx` — 클라이언트에서 액션 호출

`useActionState(createPost, initial)`로 액션을 폼에 연결합니다. 제출
후 목록이 즉시 갱신되는 것은 액션 응답에 새 렌더링 결과가 담겨
오기 때문입니다.

### `app/mixed/page.tsx` — 한 페이지에 두 세계

`getReport()`(`"use cache"` + `cacheLife("max")`)는 셸에, `LiveBadge`
(`connection()`)는 `<Suspense>` 뒤의 구멍으로. 새로고침해도 "캐시 생성
시각"은 고정, "접속 시각 배지"만 바뀝니다.

### `app/dynamic/page.tsx` — 통째로 동적

`await connection()`이 페이지 최상위(셸 밖)에 있고
`export const instant = false`로 검증에서 제외했습니다. 매 요청
전체 렌더링이라 빌드 출력이 `ƒ`입니다.

## 정량 증거: 빌드 출력

```
Route (app)                Revalidate  Expire
├ ○ /cached                        1m      1h     ← cacheLife("minutes")
├ ◐ /mixed                        30d      1y     ← ◐ = Partial Prerender
├ ○ /posts                        30d      1y     ← cacheLife("max")
└ ƒ /dynamic                                     ← 매 요청 렌더링
```

`◐`가 바로 PPR입니다. `/mixed`는 정적 셸이 즉시 전송되고 접속 시각 배지
부분만 요청 시 스트리밍됩니다. Revalidate/Expire 값은 각각
`cacheLife` 프로필의 revalidate/expire과 정확히 일치합니다(minutes →
1m/1h, max → 30d/1y).

prerender 매니페스트(.next/prerender-manifest.json)에서도 모든 라우트가
`PARTIALLY_STATIC` + PPR 표시이고, `/cached` 60초, `/posts` 2,592,000초
(30일) 재검증, `/mixed` compute=resuming, `/dynamic` compute=blocking으로
확인됩니다.

## 빌드하며 배우는 규칙 2가지 (의도적으로 포함)

1. **`new Date()`를 프리렌더에서 쓰면 오류** — 렌더링마다 값이 바뀌는
   것을 허용하지 않습니다. `connection()` + `<Suspense>`로 요청 시점에
   미루거나, `"use cache"`로 캐시값으로 만들거나 둘 중 하나를 요구합니다.
2. **`connection()`이 `<Suspense>` 밖에 있어도 오류** — 정적 셸 생성을
   막기 때문입니다. 통째로 동적인 라우트라면 `export const instant = false`.

## 좋은 활용 사례

- 읽기 중심 페이지(문서, 상품 목록)는 `"use cache"` + `cacheLife("max")`
  + `cacheTag` — 웹훅/액션으로만 무효화
- 폼 제출 후 즉시 보여야 하는 값: Server Action에서 `updateTag`
- 한 페이지에 정적 본문 + 실시간 배지: `/mixed` 패턴 (Suspense 구멍)
- 자주 바뀌는 피드: `cacheLife("minutes")` — 수동 무효화 없이 자동 갱신
- 개인화 데이터: 셸 밖에서 `cookies()` 값을 추출해 캐시 함수에 인수로
  전달 (값이 캐시 키에 포함되어 사용자별 캐시가 됨)

## 흔한 오해와 주의점

1. **`updateTag`를 Route Handler에서 호출** — Server Action 전용이라
   오류입니다. Route Handler/웹훅에서는 `revalidateTag(tag, "max")`.
2. **`"use cache"` 안에서 `cookies()`/`headers()` 직접 읽기** —
   금지입니다. 캐시 스코프 밖에서 읽고 값만 인수로 넘기세요.
3. **캐시가 배포 후에도 남을 거라 기대** — 캐시 키에 빌드 ID가
   포함되어 새 배포에서는 모든 캐시가 리셋됩니다. 배포를 건너 살아야
   하는 데이터는 `unstable_cache`/fetch 캐시를 검토하세요.
4. **serverless에서 런타임 캐시 재사용 기대** — 기본 in-memory 캐시는
   인스턴스별이라 요청마다 다른 인스턴스면 적중이 거의 없습니다.
   공유 저장소가 필요하면 `'use cache: remote'`.
5. **`cacheLife` 생략** — `default`(15분 재검증)가 암묵 적용되고,
   중첩된 짧은 수명 캐시가 있으면 prerender 오류가 날 수 있습니다.
   모든 캐시 스코프에 명시적으로 쓰세요.
6. **`cacheLife`를 유틸 함수로 빼서 공용화** — 공식 문서가 말리는
   패턴입니다. 캐시 동작은 호출 지점에서 보이게 두세요.

## DX 개선

- "이 페이지가 캐시되는가?"를 코드 한 줄(`"use cache"` 유무)로 판단 가능
- 캐시 키를 손으로 관리하지 않음 (컴파일러 자동 생성)
- 즉시 내비게이션 검증: 모든 라우트가 즉각 열리는지 dev에서 자동 검사
- 정적/동적의 이분법이 사라짐 — 같은 페이지에 셸(정적)과 구멍(동적)이 공존

## 관련 문서

- [Caching (Cache Components)](https://nextjs.org/docs/app/getting-started/caching)
- [Cache Components 마이그레이션](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [use cache 지시어](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [connection](https://nextjs.org/docs/app/api-reference/functions/connection)
- [io](https://nextjs.org/docs/app/api-reference/functions/io)
- [instant 세그먼트 설정](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant)
- [즉시 내비게이션 가이드](https://nextjs.org/docs/app/guides/instant-navigation)
- [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)
- [PPR 플랫폼 구현 가이드](https://nextjs.org/docs/app/guides/ppr-platform-guide)
- [이전 모델 캐싱 (05예시)](https://nextjs.org/docs/app/guides/caching-without-cache-components)
