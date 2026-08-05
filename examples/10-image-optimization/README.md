# 10 — 이미지 최적화 (next/image)

> 자동 리사이징 + 최신 포맷 변환 + 지연 로딩 + CLS 방지. `<img>` 한 줄을
> `<Image>` 한 줄로 바꾸면 이미지 서빙 파이프라인 전체를 프레임워크가 대신합니다.

## 실행

```bash
pnpm install
node scripts/make-images.mjs   # 예시 이미지 생성 (hero.jpg 등)
pnpm dev                        # http://localhost:3000
bash scripts/bench.sh           # 전송 크기 정량 비교
```

페이지 구성:

- `/` — 개요와 각 페이지 링크
- `/plain` — 원본 JPEG을 그대로 받는 `<img>` 비교군
- `/optimized` — 같은 이미지를 `next/image`로 서빙
- `/props` — `fill`, `sizes`, `width/height`, `placeholder` 시연
- `/benchmark` — 실제 측정 바이트 수와 재현 방법

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `app/plain/page.tsx` | `<img>`가 원본(약 1.7MB)을 그대로 내려받는 문제 |
| `app/optimized/page.tsx` | `fill` + `sizes` + `priority` 조합의 최적 서빙 |
| `app/props/page.tsx` | `width/height`, `placeholder="blur"` 등 주요 prop |
| `app/benchmark/page.tsx` | 정량 측정 결과 표 |
| `next.config.ts` | AVIF/WebP 서빙을 위한 `images.formats` |
| `scripts/bench.sh` | 원본 vs 최적화 응답의 바이트 수를 curl로 비교 |
| `scripts/make-images.mjs` | 의존성 없이 결정적 예시 이미지 생성 |

## 동작 원리

`next/image`의 `<Image>`는 단순히 `<img>`를 감싸는 게 아니라, 렌더링 시점과
요청 시점 양쪽에서 최적화를 적용합니다. 크게 네 가지입니다.

1. 렌더링 시점 — 최적화된 `<img>` 마크업 생성 (srcset/sizes/지연 로딩)
2. 요청 시점 — 브라우저의 `Accept` 헤더로 포맷 협상
3. 서버 — `/_next/image` 엔드포인트가 리사이즈·재인코딩·캐시
4. 레이아웃 — `width/height`(또는 `fill`)로 자리 예약해 CLS 차단

### next/image가 만드는 HTML

`<Image>`는 결과적으로 최적화 엔드포인트를 가리키는 `<img>` 요소를 만듭니다.
`width/height`를 준 고정 크기 이미지의 출력은 문서에 이렇게 예시됩니다.

```html
<img
  srcset="
    /_next/image?url=%2Fprofile.jpg&w=640&q=75 1x,
    /_next/image?url=%2Fprofile.jpg&w=828&q=75 2x
  "
  src="/_next/image?url=%2Fprofile.jpg&w=828&q=75"
/>
```

여기서 `src`와 `srcset`이 원본 경로가 아니라 `/_next/image?url=...&w=...&q=...`
형태인 것이 핵심입니다. 실제 다운로드는 항상 최적화 엔드포인트를 거칩니다.

`fill` + `sizes`를 쓰면 `srcset`이 `640w`, `1080w` 같은 너비 후보(w 디스크립터)로
생성되고, `sizes`가 뷰포트별 표시 크기를 선언해 브라우저가 알맞은 후보를 고릅니다.
`sizes`를 생략하면 브라우저는 이미지를 뷰포트 전체 너비(`100vw`)로 가정해서
필요보다 큰 이미지를 내려받을 수 있습니다.

이 `<img>`에는 기본적으로 다음 특성이 붙습니다.

- `loading="lazy"` — 뷰포트에 접근하기 전까지 다운로드 지연 (기본값)
- `decoding="async"` — 다른 콘텐츠 렌더링과 분리해 비동기 디코딩 (기본값)
- `srcset` / `sizes` — 기기 해상도와 레이아웃에 맞는 후보 선택

> 참고: `fill`을 쓰면 `<img>` 자체에 `position: absolute`가 적용되어 부모를 채웁니다.
> 그래서 부모 요소가 `position: relative/fixed/absolute`와 함께 크기(또는
> `aspect-ratio`)를 반드시 갖고 있어야 합니다. 이 예시의
> `app/optimized/page.tsx`는 `aspectRatio: "3 / 2"` 컨테이너를 사용합니다.

### Accept 헤더로 포맷 협상

브라우저는 이미지 요청 시 `Accept` 헤더에 자신이 지원하는 포맷을 담아 보냅니다.
예를 들어 최신 브라우저는 `image/avif,image/webp,image/jpeg` 같은 값을 보냅니다.

`/_next/image`는 이 헤더를 읽고, `next.config.ts`의 `images.formats` 배열에서
**브라우저가 지원하는 첫 포맷**을 골라 그 형식으로 인코딩해 응답합니다.

```ts
// next.config.ts
images: { formats: ["image/avif", "image/webp"] }
```

- 배열 순서가 곧 우선순위입니다. AVIF를 앞에 두면 AVIF 지원 브라우저는 AVIF를,
  그렇지 않은 브라우저는 WebP를, 둘 다 안 되면 원본 포맷을 받습니다.
- AVIF는 WebP보다 압축률이 좋지만(약 20% 작음) 인코딩이 더 느립니다(약 50% 더 소요).
  첫 요청은 느리고, 이후 캐시된 응답은 빠릅니다.
- `formats` 기본값은 `["image/webp"]`입니다. AVIF를 서빙하려면 이 예시처럼 명시해야 합니다.
- 원본이 애니메이션(GIF)이면 포맷 변환 없이 원본 포맷 그대로 서빙됩니다.

이 협상 덕분에 개발자는 "어떤 브라우저에 어떤 포맷을 줄지" 분기문을 짤 필요가
없습니다. `Accept` 헤더만 다르면 같은 URL이 AVIF로도, WebP로도, JPEG로도 응답됩니다.

### /_next/image 엔드포인트의 동작

`/_next/image?url=...&w=...&q=...` 요청이 들어오면 서버는 다음 순서로 일합니다.

1. `url` 파라미터의 원본 이미지를 읽습니다. 로컬(`public/`)이거나, 설정
   (`remotePatterns`)에서 허용한 원격 이미지입니다.
2. `w` 파라미터의 너비로 **리사이즈**합니다. (`srcset`이 고른 후보 너비)
3. `Accept` 협상으로 정해진 포맷으로 **재인코딩**합니다. 품질은 `q` 파라미터.
4. 결과를 디스크 캐시에 저장하고, `Cache-Control` 헤더와 함께 응답합니다.

캐시 유효 시간(TTL)은 `minimumCacheTTL`과 원본 이미지의 `Cache-Control` 중
**더 큰 값**으로 정해집니다. Next 16 기준 `minimumCacheTTL` 기본값은 4시간입니다.
정적 이미지 import(`import hero from "./hero.jpg"`)를 쓰면 파일 내용 해시가 URL에
들어가 `Cache-Control: immutable`로 사실상 영원히 캐시됩니다.

> `q`(quality)는 1~100이며 기본은 75입니다. Next 16부터는 허용 목록
> (`images.qualities`, 기본 `[75]`)에 있는 값만 쓸 수 있고, 목록에 없는 값은
> 가장 가까운 허용 값으로 보정됩니다. 허용되지 않은 값으로 REST API를 직접
> 호출하면 400 응답이 옵니다.

### width/height로 CLS를 막는 원리

이미지가 로드되기 전에는 브라우저가 그 이미지가 차지할 크기를 모릅니다. 크기를
모르면 자리를 예약하지 못하고, 이미지가 도착하는 순간 주변 레이아웃이 밀려납니다.
이것이 **레이아웃 이동(CLS, Cumulative Layout Shift)**입니다.

`next/image`는 이를 원천 차단합니다.

- `width`/`height`를 주면, 이 값으로 **종횡비(aspect-ratio)를 계산**해 `<img>`에
  적용합니다. 브라우저는 이미지 다운로드 전부터 그 비율만큼 자리를 미리
  잡아두므로 로드 후에도 레이아웃이 움직이지 않습니다.
- `width`/`height`는 **원본(intrinsic) 크기**를 의미하며, 화면에 그려지는 크기는
  CSS가 결정합니다. 즉 비율만 알려주는 역할입니다.
- 정적 import 이미지를 쓰면 Next.js가 빌드 시 원본의 실제 `width`/`height`를
  자동으로 읽어 채워줍니다.
- `fill`을 쓰면 부모 컨테이너가 크기를 담당합니다. 부모가 `aspect-ratio`나 고정
  높이로 자리를 잡고, `<img>`는 그 안을 절대 위치로 채웁니다. 그래서 `fill`은
  반드시 크기 있는 부모와 짝지어야 CLS가 생기지 않습니다.

web.dev의 CLS 가이드 역시 "이미지에 항상 `width`/`height`를 넣거나 CSS
`aspect-ratio`로 공간을 예약하라"를 첫 번째 해결책으로 제시합니다. `next/image`는
이 규칙을 컴포넌트 차원에서 강제·자동화하는 셈입니다.

### priority(preload)와 프리로드

기본 `loading="lazy"`는 첫 화면 핵심 이미지에는 오히려 해롭습니다. LCP(Largest
Contentful Paint) 후보는 가능한 한 빨리 로드를 시작해야 합니다.

`priority`를 붙이면 다음이 일어납니다.

- 지연 로딩이 해제되어 즉시(`eager`) 로드를 시작합니다.
- `<head>`에 `<link rel="preload">`가 삽입되어 HTML 파싱 단계에서부터 이미지
  fetch를 시작합니다. (`fetchpriority="high"`로 우선순위도 높음)

> **Next.js 16 변경**: `priority` prop은 16부터 `preload` prop으로 대체되며
> 사용 권장이 끝났습니다(deprecated). 동작을 더 명확히 하려는 목적입니다.
> 이 예시 코드는 기존 `priority`를 그대로 사용하지만, 신규 코드에서는 `preload`
> 또는 `loading="eager"`/`fetchPriority="high"`를 고려하세요.
> LCP 이미지가 아닌 곳에 preload를 남용하면 오히려 대역폭 경쟁이 생기므로,
> 정말 첫 화면 핵심 이미지에만 씁니다.

### blurDataURL 자리 표시자

`placeholder="blur"`와 `blurDataURL`을 주면, 원본이 로드되는 동안 아주 작은
흐릿한 미리보기가 자리를 채웁니다. 체감 로딩 속도가 좋아집니다.

- `blurDataURL`은 자동으로 확대·블러 처리되므로 **10px 이하의 아주 작은 이미지**가
  권장됩니다. 크면 오히려 성능에 해롭습니다.
- `src`가 정적 import인 `jpg`/`png`/`webp`/`avif`(비 애니메이션)면 `blurDataURL`이
  **자동 생성**됩니다. 동적 경로·원격 이미지는 직접 만들어 넘겨야 합니다.
- 이 예시의 `app/props/page.tsx`는 16×10짜리 초소형 PNG를 base64로 직접 넣어
  `blurDataURL`을 시연합니다.

### Next.js 16의 이미지 기본값 변화

| 항목 | 이전 | 16 |
| --- | --- | --- |
| `minimumCacheTTL` | 60초 | **4시간** (14400초) |
| `imageSizes` | 16 포함 | 16 제거 (사용률 4.2%) |
| `qualities` | 1~100 전부 | **[75]** — quality가 75로 보정됨 |
| 로컬 src + 쿼리스트링 | 허용 | `images.localPatterns` 필요 (열거 공격 방지) |

`imageSizes` 기본값은 이제 `[32, 48, 64, 96, 128, 256, 384]`입니다. `localPatterns`는
특정 로컬 경로만 최적화를 허용하고 나머지는 400으로 막아, 의도하지 않은 URL이
최적화되는 것을 방지합니다.

## 코드와 함께 보는 설명

### next.config.ts — 서빙 포맷 선언

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    // 순서대로 협상하며, 브라우저가 지원하는 첫 포맷을 줍니다.
    // AVIF는 WebP보다 압축률이 좋지만 인코딩이 느립니다.
    formats: ["image/avif", "image/webp"],
  },
};
```

`formats`에 AVIF를 추가했기 때문에 `/benchmark`에서 AVIF 응답(7KB)을 측정할 수
있습니다. 기본값(`image/webp`만)이었다면 AVIF 행은 없었을 것입니다.

### app/optimized/page.tsx — fill + sizes + priority

```tsx
// app/optimized/page.tsx
<div style={{ position: "relative", aspectRatio: "3 / 2" }}>
  <Image
    src="/images/hero.jpg"
    alt="next/image로 최적화된 이미지"
    fill
    sizes="(max-width: 780px) 100vw, 780px"
    priority
  />
</div>
```

- `fill` — 부모(`position: relative` + `aspect-ratio`)를 채웁니다.
- `sizes` — 780px 이하 뷰포트에선 전체 너비, 그 이상에선 780px로 표시한다고
  선언해 올바른 `srcset` 후보를 고르게 합니다.
- `priority` — 첫 화면 핵심 이미지라 지연 로딩을 끄고 preload를 겁니다.

### app/props/page.tsx — 고정 크기와 블러 자리 표시자

```tsx
// app/props/page.tsx
<Image
  src="/images/thumb.png"
  alt="고정 크기 이미지"
  width={200}
  height={150}
/>

<Image
  src="/images/hero.jpg"
  alt="블러 플레이스홀더 이미지"
  width={400}
  height={267}
  placeholder="blur"
  blurDataURL={blur}   // 16x10 초소형 PNG base64
/>
```

`width`/`height`는 원본 크기를 알려줘 종횡비 예약에 쓰이고, 실제 표시 크기는
CSS(`max-width: 100%` 등)가 담당합니다.

### app/plain/page.tsx — 비교군

```tsx
// app/plain/page.tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src="/images/hero.jpg"
  alt="원본 그대로 로드되는 이미지"
  style={{ width: "100%", borderRadius: 12 }}
/>
```

`<img>`는 원본 2400×1600 JPEG(약 1.7MB)을 그대로 내려받습니다. 화면이 400px만
필요해도, 브라우저가 AVIF를 지원해도 상관없습니다. `no-img-element` 린트 규칙이
이 용도를 경고하는 이유입니다.

### scripts/bench.sh — 측정 재현

```bash
# scripts/bench.sh (핵심 발췌)
RAW=$(size_of "image/jpeg" "/images/hero.jpg")
AVIF=$(size_of "image/avif,image/webp,image/jpeg" \
  "/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75")
WEBP=$(size_of "image/webp,image/jpeg" \
  "/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75")
```

`size_of`는 `curl -H "Accept: ..."`로 특정 포맷을 요청한 뒤 `%{size_download}`로
실제 전송 바이트를 잽니다. `Accept` 헤더만 바꿔가며 같은 `/_next/image` URL에
요청하는 것이 포인트입니다.

## 정량 비교

### 정량 측정 결과 (이 저장소에서 실제 측정, 2026-08)

원본: `hero.jpg` 2400×1600, **1747KB**

| 요청 | 전송 크기 | 원본 대비 |
| --- | --- | --- |
| 원본 그대로 (`<img>`) | 1747KB | — |
| `/_next/image` → WebP (w=1080) | **11KB** | 약 159배 작음 |
| `/_next/image` → AVIF (w=1080) | **7KB** | 약 245배 작음 |

> 그라데이션 이미지라 압축이 유난히 잘 된 케이스입니다. 실제 사진은
> 수배~수십 배 수준이지만, 그래도 압도적으로 줄어듭니다.

### `<img>` vs `<Image>`가 막는 것

| 문제 | `<img>` | `<Image>` |
| --- | --- | --- |
| 400px 공간에 2400px 원본 전송 | O | 해상도별 srcset으로 방지 |
| 미지원 포맷 강제 | O | Accept 협상으로 AVIF/WebP |
| CLS (이미지 로드 출렁임) | width/height 미지정 시 발생 | 자리 예약으로 방지 |
| 화면 밖 이미지 즉시 로드 | O | 기본 lazy loading |

### bench.sh로 재현하기

```bash
bash scripts/bench.sh
```

스크립트는 (1) `make-images.mjs`로 이미지를 생성하고, (2) `pnpm build`로 빌드한 뒤,
(3) 3110 포트에 서버를 띄우고 `curl`로 원본과 `/_next/image` 응답의 바이트 수를
비교합니다. AVIF/WebP 행이 `Accept` 헤더 협상의 결과입니다.

## 좋은 활용 사례

- 첫 화면 핵심 이미지(LCP)는 `priority`(16부터는 `preload`), 나머지는 기본(지연 로딩)
- `fill`은 반드시 aspect-ratio/고정 높이 부모와 함께
- `sizes`를 실제 레이아웃과 맞게 선언 (srcset 선택 정확도)
- 가능한 한 정적 import를 써서 `width/height`·`blurDataURL` 자동 생성과
  `immutable` 캐시의 이점을 챙기기
- 작은 아이콘·벡터(SVG)·애니메이션(GIF)은 최적화 이득이 적으므로 `unoptimized` 검토

### DX 개선

- 이미지 파이프라인(리사이즈/포맷변환/srcset)을 코드 한 줄로 대체
- `/_next/image`가 CDN 캐시 헤더까지 자동 설정 (16부터 4시간)

## 흔한 오해와 주의점

1. **"`priority`는 많이 붙일수록 좋다"** — 아닙니다. preload는 대역폭 경쟁을
   일으키므로 LCP 후보 한두 장에만 씁니다. 뷰포트 기준 LCP가 달라질 수 있는
   반응형 히어로에는 오히려 주의가 필요합니다.
2. **"`fill`은 부모 없이도 된다"** — `fill`은 `<img>`를 절대 위치로 만듭니다.
   크기 없는 부모에 쓰면 이미지가 0×0으로 사라지거나 레이아웃이 깨집니다.
3. **"Next 16에서도 `priority`를 쓰면 오류가 난다"** — 오류가 나진 않지만 사용
   권장이 끝났습니다(deprecated). 신규 코드는 `preload`로 작성하세요.
4. **"`quality`는 아무 값이나 된다"** — Next 16부터 `images.qualities` 허용
   목록(기본 `[75]`) 밖의 값은 보정되거나 400을 받습니다. 여러 품질이 필요하면
   목록에 직접 추가해야 합니다.
5. **"원격 이미지는 그냥 URL만 주면 된다"** — 원격 이미지는 `remotePatterns`에
   허용 패턴을 등록해야 하며, `width/height`도 직접 지정해야 합니다.

## 관련 문서

- [next/image API](https://nextjs.org/docs/app/api-reference/components/image)
- [Image Optimization — Getting Started](https://nextjs.org/docs/app/getting-started/images)
- [Cumulative Layout Shift (web.dev)](https://web.dev/articles/cls)
- [Optimize CLS (web.dev)](https://web.dev/articles/optimize-cls)
