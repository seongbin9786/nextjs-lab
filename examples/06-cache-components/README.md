# 06 — Cache Components (Next.js 16의 새 캐싱 모델)

> `"use cache"` 지시어로 캐싱을 명시적으로 선택하는 모델. PPR이 기본 내장됩니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 페이지 | 내용 |
| --- | --- |
| `/` | 이전 모델과 새 모델 비교 표 |
| `/dynamic` | 기본 동작(매 요청 실행) + `connection()` 규칙 배우기 |
| `/cached` | `"use cache"` + `cacheLife` + `cacheTag` |
| `/posts` | 태그 무효화 + `updateTag`(즉시 반영) |
| `/mixed` | 정적 셸 + 동적 구멍 (PPR) |

## 핵심 개념

### 모델의 대전제

```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true };
```

켜는 순간:
- **모든 것이 기본적으로 요청 시 실행**됩니다. 캐싱은 `"use cache"`로 선택.
- 기존 `dynamic`, `revalidate`, `fetchCache` 세그먼트 설정은 **빌드 오류**가 됩니다.

### `"use cache"` 함수

```tsx
export default async function Page() {
  "use cache";
  cacheLife("minutes");     // 수명 프로필
  cacheTag("cached-page");  // 무효화 태그
  ...
}
```

### 무효화 3형제

| API | 호출 위치 | 의미 |
| --- | --- | --- |
| `updateTag(tag)` | Server Action 전용 | 무효화 + **같은 요청에서 즉시 재읽기** (read-your-writes) |
| `revalidateTag(tag, "max")` | Action/Route Handler | stale-while-revalidate (16부터 프로필 필수) |
| `revalidatePath(path)` | 둘 다 | 경로 기준 무효화 (이전과 동일) |

## 정량 증거: 빌드 출력

```
Route (app)                Revalidate  Expire
├ ○ /cached                        1m      1h     ← cacheLife("minutes")
├ ◐ /mixed                        30d      1y     ← ◐ = Partial Prerender
├ ○ /posts                        30d      1y     ← cacheLife("max")
└ ƒ /dynamic                                     ← 매 요청 렌더링
```

`◐`가 바로 PPR입니다. `/mixed`는 정적 셸이 즉시 전송되고 접속 시각 배지
부분만 요청 시 스트리밍됩니다.

## 빌드하며 배우는 규칙 2가지 (의도적으로 포함)

1. **`new Date()`를 프리렌더에서 쓰면 빌드 오류** — 렌더링마다 값이 바뀌는
   것을 허용하지 않습니다.
2. **`connection()`이 `<Suspense>` 밖에 있어도 오류** — 정적 셸 생성을
   막기 때문입니다. 통째로 동적인 라우트라면 `export const instant = false`.

## 좋은 활용 사례

- 읽기 중심 페이지(문서, 상품 목록)는 `"use cache"` + `cacheLife("max")`
- 폼 제출 후 즉시 보여야 하는 값: Server Action에서 `updateTag`
- 한 페이지에 정적 본문 + 실시간 배지: `/mixed` 패턴 (Suspense 구멍)

## DX 개선

- "이 페이지가 캐시되는가?"를 코드 한 줄(`"use cache"` 유무)로 판단 가능
- 캐시 키를 손으로 관리하지 않음 (컴파일러 자동 생성)
- 즉시 내비게이션 검증: 모든 라우트가 즉각 열리는지 dev에서 자동 검사

## 관련 문서

- [Cache Components 마이그레이션](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [use cache 지시어](https://nextjs.org/docs/app/api-reference/directives/use-cache)
