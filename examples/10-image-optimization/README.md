# 10 — 이미지 최적화 (next/image)

> 자동 리사이징 + 최신 포맷 변환 + 지연 로딩 + CLS 방지.

## 실행

```bash
pnpm install
node scripts/make-images.mjs   # 예시 이미지 생성 (hero.jpg 등)
pnpm dev                        # http://localhost:3000
bash scripts/bench.sh           # 전송 크기 정량 비교
```

## 정량 측정 결과 (이 저장소에서 실제 측정, 2026-08)

원본: `hero.jpg` 2400×1600, **1747KB**

| 요청 | 전송 크기 | 원본 대비 |
| --- | --- | --- |
| 원본 그대로 (`<img>`) | 1747KB | — |
| `/_next/image` → WebP (w=1080) | **11KB** | 약 159배 작음 |
| `/_next/image` → AVIF (w=1080) | **7KB** | 약 245배 작음 |

> 그라데이션 이미지라 압축이 유난히 잘 된 케이스입니다. 실제 사진은
> 수배~수십 배 수준이지만, 그래도 압도적으로 줄어듭니다.

## 핵심 개념

```tsx
<Image
  src="/images/hero.jpg"
  alt="..."
  fill                                // 부모 채움 (aspect-ratio 컨테이너 필수)
  sizes="(max-width: 780px) 100vw, 780px"
  priority                            // LCP 이미지일 때만
/>
```

AVIF를 서빙하려면 설정이 필요합니다 (기본은 WebP):

```ts
// next.config.ts
images: { formats: ["image/avif", "image/webp"] }
```

## Next.js 16의 이미지 기본값 변화

| 항목 | 이전 | 16 |
| --- | --- | --- |
| `minimumCacheTTL` | 60초 | **4시간** (14400초) |
| `imageSizes` | 16 포함 | 16 제거 (사용률 4.2%) |
| `qualities` | 1~100 전부 | **[75]** — quality가 75로 보정됨 |
| 로컬 src + 쿼리스트링 | 허용 | `images.localPatterns` 필요 (열거 공격 방지) |

## 정량 비교: `<img>` vs `<Image>`가 막는 것

| 문제 | `<img>` | `<Image>` |
| --- | --- | --- |
| 400px 공간에 2400px 원본 전송 | O | 해상도별 srcset으로 방지 |
| 미지원 포맷 강제 | O | Accept 협상으로 AVIF/WebP |
| CLS (이미지 로드 출렁임) | width/height 미지정 시 발생 | 자리 예약으로 방지 |
| 화면 밖 이미지 즉시 로드 | O | 기본 lazy loading |

## 좋은 활용 사례

- 첫 화면 핵심 이미지(LCP)는 `priority`, 나머지는 기본(지연 로딩)
- `fill`은 반드시 aspect-ratio/고정 높이 부모와 함께
- `sizes`를 실제 레이아웃과 맞게 선언 (srcset 선택 정확도)

## DX 개선

- 이미지 파이프라인(리사이즈/포맷변환/srcset)을 코드 한 줄로 대체
- `/_next/image`가 CDN 캐시 헤더까지 자동 설정 (16부터 4시간)

## 관련 문서

- [Image Optimization](https://nextjs.org/docs/app/guides/images)
- [next/image API](https://nextjs.org/docs/app/api-reference/components/image)
