# 05 — 데이터 fetching과 캐싱

> Next.js의 캐시 계층 4개를 눈으로 확인합니다. 같은 API의 counter 값으로 캐시 적중을 검증합니다.

## 실행

```bash
pnpm install
pnpm dev              # http://localhost:3000
bash scripts/bench.sh # 캐시 적중 vs 미캐시 TTFB 측정 (빌드 + prod 서버 자동 실행)
```

> **왜 bench.sh는 prod 서버로 돌까요?** dev 모드에서는 페이지가 항상
> 요청 시(on-demand) 렌더링되어 캐시가 적용되지 않습니다. 캐시 동작은
> 반드시 `pnpm build` + `pnpm start`(prod 서버)에서 관찰해야 합니다.
> `scripts/bench.sh`가 이 과정을 자동으로 수행합니다.

## 이 예시가 보여주는 것

`/api/now`은 호출될 때마다 counter가 1 증가합니다. 화면의 counter로
"실제로 요청이 몇 번 갔는지"를 검증합니다.

| 페이지 | fetch 옵션 | 관찰 포인트 | 렌더링 방식 |
| --- | --- | --- | --- |
| `/fresh` | 옵션 없음 | counter가 매번 +1 (캐시 없음이 기본) | 매 요청 렌더링 |
| `/cached` | `cache: "force-cache"` + 태그 | counter 고정 → 버튼으로 무효화 | 매 요청 렌더링 + 데이터 캐시 |
| `/time-based` | `next: { revalidate: 10 }` | 10초 단위로 갱신 | 매 요청 렌더링 + 데이터 캐시 |
| `/isr` | `export const revalidate = 10` | HTML 자체가 10초마다 재생성 | 정적 prerender + ISR |
| `/dedupe` | 같은 fetch 2회 | counter가 1씩만 증가 (메모이제이션) | 매 요청 렌더링 |

## 동작 원리

### 큰 그림: 캐시 계층 4개

이 예시는 **이전 모델**(`cacheComponents` 미사용) 기준입니다. Next.js는
데이터와 렌더링 결과를 서로 다른 4개의 계층에 저장하는데, 각 계층은
저장 대상·위치·수명·무효화 방법이 모두 다릅니다.

계층 번호 ①~④는 개념 순서이고, **실제 요청이 통과하는 순서는
④ → ③ → ① → ②**입니다. 브라우저에서 네트워크 방향으로 그리면:

```
브라우저의 요청
     │
     ▼
┌─────────────────────────────────────────────┐
│ ④ 라우터 캐시 (브라우저 메모리)                │
│    내비게이션으로 받은 RSC 페이로드를 보관      │
│    적중 → 서버에 요청조차 가지 않음            │
│    stale 기본: 정적 세그먼트 5분 / 동적 0초    │
└──────────────────┬──────────────────────────┘
                   │ 미스 → 서버로 요청
                   ▼
┌─────────────────────────────────────────────┐
│ ③ 풀 라우트 캐시 (서버)                        │
│    렌더링 결과(HTML + RSC 페이로드)를 저장      │
│    적중 → 저장된 HTML 즉시 전송 (/isr가 여기)  │
│    무효화: revalidatePath / revalidateTag     │
└──────────────────┬──────────────────────────┘
                   │ 미스 → 렌더링 시작
                   ▼
┌─────────────────────────────────────────────┐
│ ① 요청 메모이제이션 (서버 메모리)               │
│    이번 렌더 안에서 같은 URL+옵션 GET fetch는   │
│    첫 호출 결과를 재사용 (네트워크 1회만)       │
│    수명: 렌더 패스 한 번 — 끝나면 자동 폐기     │
└──────────────────┬──────────────────────────┘
                   │ 중복이 아닌 fetch마다
                   ▼
┌─────────────────────────────────────────────┐
│ ② 데이터 캐시 (서버 파일시스템/메모리)          │
│    force-cache 응답을 요청 "사이"에 보관        │
│    적중 → API 왕복 없음 (/cached가 여기)       │
│    수명: next.revalidate / 태그 무효화 전까지   │
└──────────────────┬──────────────────────────┘
                   │ 미스
                   ▼
              네트워크 (외부 API, DB)
```

①과 ②의 차이가 핵심입니다. ①은 **한 렌더 안**의 중복을 제거하고 렌더가
끝나면 사라지며, ②는 **요청과 요청 사이**에 남습니다. ③은 데이터가 아니라
"완성된 페이지"를 저장하는 계층입니다. ④는 클라이언트에 있어서 내비게이션
경험을 좌우합니다.

| 계층 | 무엇을 저장 | 어디에 | 언제 사라지나 |
| --- | --- | --- | --- |
| ① 요청 메모이제이션 | 한 렌더 안의 fetch 결과 | 서버 메모리 | 렌더 패스가 끝나면 자동 폐기 |
| ② 데이터 캐시 | fetch 응답 | 서버 저장소 | 옵션(no-store), 시간(revalidate), 태그/경로 무효화 |
| ③ 풀 라우트 캐시 | 페이지의 HTML + RSC 페이로드 | 서버 저장소 | revalidatePath, 태그 무효화의 연쇄 효과 |
| ④ 라우터 캐시 | 내비게이션으로 받은 RSC 페이로드 | 브라우저 메모리 | stale 시간 경과, router.refresh() |

이 예시는 ①②③을 다룹니다. ④는 클라이언트 내비게이션과 얽혀 있어
19예시(Link, View Transitions)에서 함께 다룹니다.

### 대전제: 기본은 "캐시 없음" (Next.js 15+의 대변화)

Next 13/14에서 fetch는 기본이 `force-cache`였습니다. 15부터 **기본이
no-store**(정확히는 "auto no cache")로 바뀌었고, 캐싱은 명시적으로
선택해야 합니다. 옵션을 안 준 fetch는 매 요청 원본을 다시 가져갑니다.
`/fresh`에서 counter가 계속 올라가는 것이 바로 이 기본 동작입니다.

### fetch 옵션이 각 계층에 미치는 영향

| 옵션 | 닿는 계층 | 동작 |
| --- | --- | --- |
| 옵션 없음 (기본) | 어디에도 저장 안 됨 | 매 요청 원본에서 fetch (dev에서는 항상, 빌드 시 정적 prerender면 1회) |
| `cache: "no-store"` | ② 우회 + ③ 제외 | 매 요청 fetch. 이 fetch가 있는 라우트는 동적 렌더링이 되어 풀 라우트 캐시에서도 빠짐 |
| `cache: "force-cache"` | ② 데이터 캐시 | URL+메서드+헤더+본문으로 매칭해 저장/재사용 (200 응답만 저장) |
| `next: { revalidate: N }` | ② 수명 + ③ ISR 주기 | force-cache가 자동으로 켜지고 N초 수명. 라우트 기본값보다 낮으면 라우트 전체 ISR 주기도 낮아짐 |
| `next: { tags: [...] }` | ② 항목에 태그 부착 | `revalidateTag`로 골라 무효화할 손잡이 (최대 128개, 각 256자) |
| `export const revalidate = N` | ③ 풀 라우트 캐시 | 라우트의 HTML 재생성 주기 (라우트 세그먼트 설정) |

충돌 조합 주의: `{ revalidate: 3600, cache: "no-store" }`처럼 서로 싸우는
옵션은 **둘 다 무시**되고 dev 터미널에 경고가 찍힙니다.

### `/cached` 요청 타임라인: 데이터 캐시

```
첫 요청 (캐시 MISS)
  브라우저 ─GET /cached─▶ 서버
    서버: 페이지 렌더링 시작
      └ fetch(url, {cache:"force-cache", next:{tags:["now-data"]}})
          └ 데이터 캐시 검색 → 없음
              └ 실제로 /api/now 호출 (150ms) → counter: 42
                  └ 응답을 데이터 캐시에 저장 (태그: now-data)
    서버: HTML 생성 → 브라우저
  이후 요청 (캐시 HIT)
    서버: 페이지는 다시 렌더링되지만
      └ fetch가 데이터 캐시에서 counter: 42를 그대로 반환
          → /api/now에는 요청이 가지 않음
```

여기서 중요한 미묘함이 있습니다. **페이지 렌더링과 데이터 캐시는
독립적입니다.** `/fresh`, `/cached`, `/time-based`, `/dedupe`는 전부
`apiUrl()` 안에서 `headers()`(요청 시점 API)를 읽기 때문에 **페이지
자체는 매 요청 다시 렌더링**됩니다(빌드 산출물인 prerender 매니페스트에
이 라우트들이 없는 것으로 확인 가능). 하지만 렌더링 도중 만나는
`force-cache` fetch는 데이터 캐시에 적중하므로, 페이지는 새로 만들어도
**데이터는 그대로**입니다. "페이지가 동적 렌더링이다"와 "데이터가
캐시된다"는 별개의 축입니다.

무효화 흐름(`/cached` 화면의 버튼):

```
버튼 클릭 ─POST /api/revalidate─▶ revalidateTag("now-data", "max")
                                    + revalidatePath("/isr")
         ◀───────── 200 ─────────
router.refresh() → 서버가 /cached를 다시 렌더링
  └ 태그가 무효화됐으니 fetch는 MISS → /api/now 재호출 → counter 증가
```

Next.js 16부터 `revalidateTag`는 두 번째 인자로 `cacheLife` 프로필을
필수로 받습니다. `"max"`는 stale-while-revalidate 방식 — 캐시를
무효화하되 다음 요청에서 오래된 값을 먼저 보여주고 백그라운드로
새 값을 만들 수 있게 허용합니다. Server Action 안에서 "사용자가 방금
쓴 값을 즉시 봐야 하는" 상황이라면 `updateTag()`가 담당입니다
(06예시에서 다룸).

### 무효화하면 어떤 캐시가 날아가는가

| API | 무효화되는 계층 | 방식 |
| --- | --- | --- |
| `revalidateTag(tag, "max")` | ② 그 태그가 붙은 데이터 캐시 항목 + 그 데이터를 사용한 페이지의 ③ | stale 표시 → 다음 방문 때 오래된 것을 먼저 주고 백그라운드 갱신 |
| `revalidatePath(path)` | ③ 그 경로의 풀 라우트 캐시 (페이지/라우트 핸들러) | 다음 방문 시 재생성 |
| `revalidatePath(path, "layout")` | ③ 해당 레이아웃 + 그 아래 모든 중첩 레이아웃과 페이지 | 다음 방문 시 재생성 |
| `revalidatePath("/", "layout")` | ③ 전부 + ④ 클라이언트 캐시 | 사이트 전체 초기화 |
| `updateTag(tag)` | ② 태그 항목 즉시 expire (Server Action 전용) | 다음 요청은 stale 없이 새 데이터를 **기다림** |

세 가지 함정이 있습니다.

1. **`revalidateTag`는 즉시 재생성하지 않습니다.** 태그를 stale로 표시만
   하고, 실제 재fetch는 그 태그를 쓰는 페이지에 다음 방문이 있을 때
   일어납니다. 호출 한 번으로 재생성이 폭주하지 않는 이유입니다.
2. **`revalidatePath`는 다른 페이지의 태그까지 지우지 않습니다.** `/blog`와
   `/dashboard`가 같은 태그의 fetch를 쓸 때 `revalidatePath("/blog")`만
   호출하면 `/dashboard`은 캐시된 데이터를 계속 보여줍니다. 경로 기준과
   태그 기준 무효화를 함께 써야 완전한 일관성이 잡힙니다.
3. **Server Action 안에서 무효화 함수를 호출하면 ④ 라우터 캐시도 통째로
   비워집니다.** 이 예시의 버튼은 Route Handler를 거쳐 호출하기 때문에
   클라이언트 캐시가 자동으로 비워지지 않아 `router.refresh()`를 직접
   호출하는 것입니다.

### `/time-based` 타임라인: 시간 기반 재검증 (stale-while-revalidate)

`fetch(url, { next: { revalidate: 10 } })`는
`fetch(url, { cache: "force-cache", next: { revalidate: 10 } })`와
같습니다. revalidate를 주면 캐시가 자동으로 켜집니다.

```
t=0s     첫 렌더: fetch → 캐시 저장 (수명 10초)
t=0~10s  렌더: 캐시의 기존 값 재사용 (API 호출 없음)
t=10s    만료. 하지만 다음 요청이 오면
         → 기존(조금 오래된) 값을 즉시 반환 (사용자 대기 없음)
         → 동시에 백그라운드에서 새 값 생성
t=10s+α  그 다음 렌더부터 새 값 반영
```

이 "오래된 값을 즉시 주고 뒤에서 갱신"하는 방식이
**stale-while-revalidate**입니다. 사용자 응답 속도가 데이터 신선도보다
우선하는 트레이드오프입니다.

### `/isr` 타임라인: 풀 라우트 캐시

`/isr`은 `headers()`를 쓰지 않아 빌드 시 prerender됩니다. 빌드 출력:

```
Route (app)          Revalidate  Expire
├ ○ /isr                    10s      1y
```

`export const revalidate = 10`은 **페이지 단위** 설정이라 데이터 캐시가
아니라 **풀 라우트 캐시**(렌더링 결과인 HTML 자체)에 적용됩니다.
prerender 매니페스트에서도 `/isr`의 `initialRevalidateSeconds: 10`으로
확인됩니다.

| 시점 | 서버가 하는 일 |
| --- | --- |
| 빌드 시 | `/isr`의 HTML을 미리 생성해 저장 |
| 0~10초의 모든 요청 | 저장된 HTML 전송 — **렌더링 0회** |
| 10초 후 첫 요청 | 기존 HTML 즉시 전송 + 백그라운드에서 새 HTML 생성 |
| 그 다음 요청 | 새로 생성된 HTML 전송 + 다시 10초 타이머 |
| `POST /api/revalidate` | `revalidatePath("/isr")` → 다음 요청 시 즉시 재생성 |

타임라인으로 보면:

```
0s          10s         12s
│── HTML A ──│── HTML A ──│── HTML B ──▶
  (빌드 산출물)  (즉시 주고,    (백그라운드
                뒤에서 B 생성)   재생성 완료)
```

트래픽이 100배가 돼도 서버 계산은 10초에 한 번입니다. 재생성 중
오류가 나면 마지막으로 성공한 HTML을 계속 서빙하고 다음 요청에서
재시도합니다. 관찰 팁: 응답 헤더 `x-nextjs-cache`가 `HIT`(캐시 서빙),
`STALE`(캐시 서빙 + 백그라운드 재생성 중), `MISS`(신규 렌더링)를
알려줍니다.

### `/dedupe` 타임라인: 요청 메모이제이션

```
한 번의 렌더 패스 안에서:
  페이지가 fetch(url)      ─┐
                             ├─ 같은 URL + 같은 옵션(GET)
  DedupeCard가 fetch(url)  ─┘
  → Next.js가 첫 호출 결과를 메모이제이션해 재사용
  → 네트워크 요청은 1회, counter는 1만 증가
```

메모이제이션 적용 조건:

- GET 요청 + 같은 URL + 같은 옵션
- 같은 렌더 패스(한 요청의 렌더) 안에서만 — 사용자 간, 요청 간 공유가 아님
- 렌더 패스가 끝나면 폐기 — 데이터 캐시(요청 간 지속)와 다른 계층
- `cache: "no-store"`여도 메모이제이션은 적용됩니다. 캐시 계층과 별개입니다
- opt-out은 `AbortController`의 `signal` 전달
- Route Handler(`route.ts`) 안에서는 적용되지 않음 — React 컴포넌트 트리의
  렌더 패스에 속하지 않기 때문

`fetch`가 아닌 ORM/DB 직접 호출은 자동 메모이제이션이 없으므로,
React의 `cache()` 함수로 감싸거나 `unstable_cache`를 써야 같은 효과를
냅니다.

### 라우트 세그먼트 설정 (`/isr`에서 사용한 것)

페이지/레이아웃/라우트 핸들러에서 export로 설정하는 옵션입니다.

- `export const revalidate = 10` — 라우트 기본 재검증 주기(초). 값은
  정적으로 분석 가능해야 합니다(`revalidate = 60`은 가능,
  `revalidate = 60 * 10`은 불가).
- 한 라우트 안에서 여러 fetch의 revalidate가 다르면 **가장 낮은 값**이
  라우트 전체의 재검증 주기가 됩니다.
- 이 밖에 `dynamic` / `fetchCache` 옵션도 있지만(기본 `auto`), 15+
  기본값 변화 이후에는 직접 쓸 일이 크게 줄었습니다. 참고: 같은
  라우트의 세그먼트끼리 `fetchCache` 옵션이 충돌하면 `force-*`가
  `only-*`보다 우선합니다.

## 코드와 함께 보는 설명

### `app/api/now/route.ts` — 검증용 API

```ts
let counter = 0;
const SIMULATED_LATENCY_MS = 150;

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  counter += 1;
  return NextResponse.json({ counter, time: ... });
}
```

counter는 호출 횟수 그 자체라, 화면의 counter 값이 곧 "API가 실제로
몇 번 호출됐는지"입니다. 150ms 지연은 외부 API 왕복을 흉내 내서
bench.sh에서 캐시 적중의 속도 차이가 분명히 드러나게 합니다.

### `lib/api-url.ts` — 절대 URL 생성 (부작용 주의)

```ts
export async function apiUrl(path: string): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}${path}`;
}
```

서버 컴포넌트에서는 상대 경로 fetch가 안 돼서 절대 URL이 필요합니다.
그런데 `headers()`는 요청 시점 데이터를 읽으므로, **이 함수를 쓰는
페이지는 자동으로 동적 렌더링**이 됩니다. 의도된 설계로, "페이지는
동적이지만 데이터는 캐시되는" 상태를 만들어 데이터 캐시를 분리해서
관찰하게 합니다.

### `app/fresh/page.tsx` — 기본 동작 확인

옵션 없는 fetch. Next 13/14의 "기본 캐시" 경험과 대비되는 지점입니다.

### `app/cached/page.tsx` — force-cache + 태그

```ts
const res = await fetch(url, {
  cache: "force-cache",
  next: { tags: ["now-data"] },
});
```

태그는 무효화의 손잡이입니다. `revalidateTag("now-data", "max")`가 이
fetch의 캐시만 골라서 지웁니다.

### `components/revalidate-button.tsx` — 무효화 + 갱신

`POST /api/revalidate` 호출 후 `router.refresh()`를 부릅니다.
`refresh()`는 현재 라우트를 서버에서 다시 렌더링해 라우터 캐시를
갱신합니다 — 서버 캐시만 무효화하고 브라우저 캐시를 그대로 두면
사용자에게 새 데이터가 안 보이기 때문입니다.

### `app/api/revalidate/route.ts` — 무효화 두 방식 동시 시연

```ts
revalidateTag("now-data", "max"); // 태그 기준 → /cached의 데이터
revalidatePath("/isr");           // 경로 기준 → /isr의 HTML
```

### `app/isr/page.tsx` + `lib/stats.ts` — 풀 라우트 캐시

`getStats()`는 서버 프로세스 메모리의 "DB" 흉내로, 호출될 때마다
방문자 수가 조금씩 늘어납니다. HTML이 재생성될 때만 값이 바뀌므로
"생성 시각 고정"과 함께 캐시 여부를 판별하는 신호가 됩니다.

### `app/dedupe/page.tsx` + `components/dedupe-card.tsx`

페이지와 자식 컴포넌트가 같은 URL을 fetch합니다. 두 카드의 counter가
다르면 메모이제이션이 깨진 것(2회 요청)입니다.

## 정량 측정: 캐시 적중의 응답 속도 (2026-08 실측)

`/api/now`에 150ms의 왕복 지연(외부 API 흉내)을 넣고 `scripts/bench.sh`로 잰 값:

| 페이지 | 시나리오 | TTFB |
| --- | --- | --- |
| `/fresh` | 매 요청 API 호출 | **167~228ms** |
| `/cached` | `force-cache` 적중 | **7~10ms** |

캐시 적중 시 API 왕복 자체가 사라져 **약 20~25배** 빨라집니다.
데이터가 아무리 느려져도(외부 API 지연 증가) 캐시된 페이지는 영향을 받지
않습니다.

bench.sh의 재현 순서: `pnpm build` → 포트 3125로 prod 서버 시작 →
`/fresh` 3회 측정 → `/cached`를 한 번 호출해 캐시를 채운 뒤 3회 측정.
측정은 curl의 `time_starttransfer`(TTFB)입니다.

## 정량 비교: `/isr` (풀 라우트 캐시)

빌드 출력:

```
Route (app)          Revalidate  Expire
├ ○ /isr                    10s      1y
```

| 시점 | 서버가 하는 일 |
| --- | --- |
| 0~10초의 모든 요청 | 저장된 HTML 전송 — **렌더링 0회** |
| 10초 후 첫 요청 | 기존 HTML 즉시 전송 + 백그라운드 재생성 |

트래픽이 100배가 돼도 서버 계산은 10초에 한 번입니다.

## 좋은 활용 사례

- 개인화 없는 콘텐츠: `force-cache` + 태그
- 갱신 주기가 있는 콘텐츠: `revalidate` (시간 기반)
- 쓰기 직후 사용자가 자기 변경을 봐야 하면: Server Action + `updateTag`(06예시)
- CMS 웹훅: Route Handler에서 `revalidateTag(tag, "max")`
- `fetch`가 아닌 DB 직접 호출: React `cache()`(렌더 내 중복 제거) 또는
  `unstable_cache`(태그/revalidate 지원)
- 같은 데이터를 여러 컴포넌트가 쓴다면: 각자 fetch해도 메모이제이션이
  중복을 막아줌 — "데이터는 필요한 곳에서 직접 가져오기"가 성립

## 흔한 오해와 주의점

1. **"fetch는 기본적으로 캐시된다"** — Next 13/14 시대의 기억입니다.
   15+ 기본은 캐시 없음. 캐싱은 항상 명시적 선택입니다.
2. **데이터 캐시와 풀 라우트 캐시 혼동** — "데이터를 캐시했다"와
   "페이지 HTML을 캐시했다"는 다른 계층입니다. `/cached`는 데이터만
   캐시되고 페이지는 매 요청 렌더링됩니다. HTML 자체를 고정하려면
   `/isr`처럼 라우트 단위 설정이 필요합니다.
3. **dev에서 캐시가 안 보여서 당황** — dev는 페이지를 항상 on-demand로
   렌더링하고, HMR 구간에서 fetch 응답을 따로 캐시하기도 합니다. 캐시
   동작 검증은 `build` + `start`로 해야 합니다.
4. **`revalidateTag(tag)`만 쓰기** — Next.js 16부터는 두 번째 인자
   (프로필)가 필요합니다. 이 예시는 `"max"`(stale-while-revalidate)를
   사용합니다.
5. **메모이제이션을 캐시로 착각** — 요청 메모이제이션은 렌더 패스
   안에서만 살고 사라집니다. 요청 간 재사용은 데이터 캐시의 역할입니다.
6. **여러 인스턴스 배포** — 기본 파일시스템 캐시는 인스턴스별입니다.
   on-demand 무효화 호출은 그 요청을 받은 인스턴스만 무효화합니다.
   인스턴스 간 공유가 필요하면 커스텀 캐시 핸들러 구성이 필요합니다.

## DX 개선

- 캐싱이 fetch 옵션 한 줄 — 별도 캐시 서버/키 관리 없음
- 무효화가 "태그" 단위 — 관련 페이지만 선택적으로 갱신
- 15+의 명시적 기본값으로 "왜 캐시되는지/안 되는지" 추적이 사라짐

## 관련 문서

- [Caching and Revalidating (Previous Model)](https://nextjs.org/docs/app/guides/caching-without-cache-components)
- [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [fetch API 레퍼런스 (메모이제이션, 옵션)](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Caching (Cache Components 모델 — 06예시)](https://nextjs.org/docs/app/getting-started/caching)
