# 22 — Turbopack DX

> Next.js 16의 기본 번들러. 빌드/개발 속도가 실제로 얼마나 달라지는지 직접 잽니다.

## 실행

```bash
pnpm install
bash scripts/bench.sh   # Turbopack vs webpack 빌드/dev 비교 (수 분 소요)
pnpm dev                # Turbopack dev 체험
```

## 이 저장소에서 직접 잰 값 (2026-08, 아주 작은 앱)

| 측정 | Turbopack | webpack | 배율 |
| --- | --- | --- | --- |
| 프로덕션 빌드 (3회 중 최소) | **2.14s** | 7.06s | 3.3배 |
| dev 서버 첫 응답 | **1.42s** | 3.26s | 2.3배 |

작은 앱이라 격차가 보수적으로 나왔습니다. 공식 발표 기준:

| 항목 | webpack 대비 |
| --- | --- |
| 프로덕션 빌드 | **2~5배** |
| Fast Refresh | **최대 10배** |
| dev 시작 (대형 앱) | 파일 시스템 캐시로 재시작 가속 |

## 핵심 개념

### 기본이 Turbopack, webpack은 opt-out

```bash
next build               # Turbopack (기본)
next build --webpack     # 기존 webpack 커스텀 설정이 있을 때
```

### 터미널 출력의 DX 개선

빌드 단계별 소요 시간이 표시됩니다:

```
✓ Compiled successfully in 615ms
✓ Finished TypeScript in 1114ms
✓ Collecting page data in 208ms
✓ Generating static pages in 239ms
```

dev 요청 로그도 Compile/Render 시간이 분리되어 느린 지점을 찾기 쉬워졌습니다.

### 파일 시스템 캐시 (beta)

```ts
// next.config.ts
experimental: { turbopackFileSystemCacheForDev: true }
```

컴파일 산출물을 디스크에 저장해 재시작 컴파일을 가속합니다. 대형 앱에서
효과가 큽니다.

## 함께 온 DX 개선들

- 같은 프로젝트 `next dev` 두 개 실행을 막는 락파일
- dev/build 출력 디렉터리 분리 (동시 실행 가능)
- Babel 설정이 있으면 자동 감지 (이전엔 하드 에러)

## 정량 측정 시 주의

- 앱이 클수록 격차가 벌어집니다
- 측정 환경(CPU, 디스크, 캐시 상태)에 따라 절대값은 달라질 수 있습니다
- `scripts/bench.sh`는 매번 `.next`를 지우고 dev를 재시작해 측정합니다

## 관련 문서

- [Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [Next.js 16 릴리스 노트](https://nextjs.org/blog/next-16)
