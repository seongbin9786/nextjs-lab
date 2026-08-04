# 04 — 스트리밍과 Suspense

> 페이지를 한 번에 완성해서 보내지 않고, 준비된 부분부터 흘려보냅니다.

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
bash scripts/bench.sh   # TTFB 정량 비교
```

## 이 예시가 보여주는 것

| 페이지 | 내용 |
| --- | --- |
| `/blocking` | 데이터를 전부 기다린 뒤 한 번에 응답 (비교군) |
| `/streaming` | 셸 즉시 전송 + Suspense로 느린 부분 스트리밍 |
| `/progressive` | 0.5초/1.5초/3초 경계 3개가 차례대로 채워짐 |
| `/with-loading` | `loading.tsx` 파일 하나로 로딩 UI |

## 정량 측정 결과 (이 저장소에서 실제 측정, 2026-08)

`scripts/bench.sh` 실행 결과:

| 페이지 | TTFB (첫 바이트) | 전체 응답 |
| --- | --- | --- |
| `/blocking` | **약 2.01초** | 약 2.01초 |
| `/streaming` | **약 0.007초** | 약 2.01초 |

- 첫 바이트 도착이 **약 250배** 빠릅니다.
- 전체 시간은 둘 다 ~2초로 같습니다. 스트리밍은 총량을 줄이는 최적화가
  아니라 **첫 화면을 빨리 보여주는** 최적화입니다.

## 핵심 개념

```tsx
<Suspense fallback={<Skeleton />}>
  <SlowSection />   {/* 서버에서 기다려지고, 준비되면 스트리밍됨 */}
</Suspense>
```

- `loading.tsx`는 같은 폴더 `page.tsx`에 대한 **자동 Suspense 경계**입니다.
  수동으로 감쌀 필요가 없습니다.
- Suspense 경계는 독립적이어서 느린 경계가 빠른 경계를 막지 않습니다
  (`/progressive`).

## 좋은 활용 사례

- 페이지 상단(헤더·본문 틀)은 즉시, 느린 데이터(추천·리뷰)는 스트리밍
- 대시보드처럼 여러 독립 데이터 소스가 있는 페이지 — 소스별 경계
- `loading.tsx`로 내비게이션 즉시 피드백 (흰 화면 제거)

## DX 개선

- 수동 스켈레톤/폴백 배선이 파일 규칙(`loading.tsx`)으로 대체
- "느린 데이터 하나가 페이지 전체를 막는" 문제를 구조적으로 해결
- React Suspense와 동일 API — 별도 스트리밍 라이브러리 불필요

## 관련 문서

- [Streaming](https://nextjs.org/docs/app/guides/streaming)
- [loading.tsx](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
