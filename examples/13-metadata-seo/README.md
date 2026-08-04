# 13 — Metadata와 SEO

> 코드에서 메타태그를 관리합니다. `metadata` export + 파일 규칙으로 sitemap/robots/OG 이미지를 생성.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 생성하는 것

| 산출물 | 만든 것 | 확인 |
| --- | --- | --- |
| `metadata` export | 루트 기본값 + title 템플릿 | 페이지 소스 보기 |
| `generateMetadata` | 상품별 title/description | `/products/keyboard` 소스 |
| `opengraph-image.tsx` | 상품 OG 이미지를 코드로 렌더링 | `/products/keyboard/opengraph-image` |
| `sitemap.ts` | 사이트맵 | `/sitemap.xml` |
| `robots.ts` | robots.txt | `/robots.txt` |
| `manifest.ts` | PWA 매니페스트 | `/manifest.webmanifest` |
| `icon.svg` | 파비콘 | 브라우저 탭 |
| JSON-LD | 구조화 데이터 | `/jsonld` 소스 |

## 핵심 개념

### 정적 + 동적 메타데이터

```tsx
// 루트: 기본값과 템플릿
export const metadata: Metadata = {
  metadataBase: new URL("https://..."),
  title: { template: "%s | 상점", default: "상점 홈" },
};

// 페이지: params 기반 동적 생성
export async function generateMetadata({ params }) {
  const product = getProduct((await params).id);
  return { title: product.name, description: product.description };
}
```

### OG 이미지를 코드로

```tsx
// app/products/[id]/opengraph-image.tsx
export default async function OgImage({ params }) {
  return new ImageResponse(<div style={...}>{product.name}</div>);
}
```

이미지 파일을 수동으로 만들지 않고, 상품 데이터에서 **빌드/요청 시 생성**합니다.

## 정량 비교: 수동 메타태그 vs Metadata API

| 항목 | 수동 HTML 메타태그 | Metadata API |
| --- | --- | --- |
| 동적 페이지(상품 1만 개) | 별도 템플릿 시스템 필요 | **함수 하나로 자동** |
| 데이터-메타 불일치 | 가능 (따로 관리) | 같은 서버 코드에서 나와 불가능 |
| 사이트맵 갱신 | 수동 | 데이터에서 생성 |

빌드 출력에 메타데이터 라우트가 전부 보입니다:

```
├ ○ /icon.svg
├ ○ /manifest.webmanifest
├ ○ /robots.txt
└ ○ /sitemap.xml
```

## 좋은 활용 사례

- `metadataBase`는 반드시 설정 (OG 이미지 절대 URL 생성에 필요)
- title 템플릿을 루트에, 개별 title은 페이지에서
- 상품/글마다 `generateMetadata` + 폴더별 `opengraph-image.tsx`
- 가격/평점이 있는 콘텐츠는 JSON-LD(`Product`, `Article`) 추가

## DX 개선

- `<head>` 수동 관리가 타입이 있는 객체로 대체 (TypeScript 검증)
- OG 이미지/sitemap/robots가 파일 규칙이라 라우팅과 같은 방식으로 관리

## 관련 문서

- [Metadata](https://nextjs.org/docs/app/getting-started/metadata)
- [JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
