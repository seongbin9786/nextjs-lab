# 05 — 데이터 fetching과 캐싱

> Next.js의 캐시 계층 4개를 눈으로 확인합니다. 같은 API의 counter 값으로 캐시 적중을 검증합니다.

## 실행

```bash
pnpm install
pnpm dev              # http://localhost:3000
bash scripts/bench.sh # 캐시 적중 vs 미캐시 TTFB 측정
```

## 이 예시가 보여주는 것

`/api/now`은 호출될 때마다 counter가 1 증가합니다. 화면의 counter로
"실제로 요청이 몇 번 갔는지"를 검증합니다.

| 페이지 | fetch 옵션 | 관찰 포인트 |
| --- | --- | --- |
| `/fresh` | 옵션 없음 | counter가 매번 +1 (캐시 없음이 기본) |
| `/cached` | `cache: "force-cache"` + 태그 | counter 고정 → 버튼으로 무효화 |
| `/time-based` | `next: { revalidate: 10 }` | 10초 단위로 갱신 |
| `/isr` | `export const revalidate = 10` | HTML 자체가 10초마다 재생성 |
| `/dedupe` | 같은 fetch 2회 | counter가 1씩만 증가 (메모이제이션) |

## 핵심 개념

### 기본은 "캐시 없음" (Next.js 15+의 대변화)

Next 13/14에서 fetch는 기본이 `force-cache`였습니다. 15부터 **기본이
no-store**로 바뀌었고, 캐싱은 명시적으로 선택해야 합니다.

### 태그 기반 무효화 (Next.js 16 시그니처)

```ts
fetch(url, { cache: "force-cache", next: { tags: ["now-data"] } });

// Server Action 안: 즉시 반영 (read-your-writes)
updateTag("now-data");

// Route Handler/웹훅: stale-while-revalidate (16부터 프로필 인자 필수)
revalidateTag("now-data", "max");
```

### 요청 메모이제이션
한 렌더 패스 안에서 같은 URL+옵션 fetch는 네트워크에 한 번만 나갑니다.
`/dedupe`에서 페이지와 자식 컴포넌트가 같은 counter 값을 받는 것으로 확인.

## 정량 측정: 캐시 적중의 응답 속도 (2026-08 실측)

`/api/now`에 150ms의 왕복 지연(외부 API 흉내)을 넣고 `scripts/bench.sh`로 잰 값:

| 페이지 | 시나리오 | TTFB |
| --- | --- | --- |
| `/fresh` | 매 요청 API 호출 | **167~228ms** |
| `/cached` | `force-cache` 적중 | **7~10ms** |

캐시 적중 시 API 왕복 자체가 사라져 **약 20~25배** 빨라집니다.
데이터가 아무리 느려져도(외부 API 지연 증가) 캐시된 페이지는 영향을 받지
않습니다.

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
- 쓰기 직후 사용자가 자기 변경을 봐야 하면: Server Action + `updateTag`
- CMS 웹훅: Route Handler에서 `revalidateTag(tag, "max")`

## DX 개선

- 캐싱이 fetch 옵션 한 줄 — 별도 캐시 서버/키 관리 없음
- 무효화가 "태그" 단위 — 관련 페이지만 선택적으로 갱신
- 15+의 명시적 기본값으로 "왜 캐시되는지/안 되는지" 추적이 사라짐

## 관련 문서

- [Caching](https://nextjs.org/docs/app/guides/caching-without-cache-components)
- [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
