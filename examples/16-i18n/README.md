# 16 — 다국어 라우팅 (i18n)

> 언어를 URL의 첫 세그먼트(/ko, /en)로 다루는 패턴. App Router에서는 직접 구성합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` → `Accept-Language` 헤더를 보고 `/ko` 또는 `/en`으로 리다이렉트
- `/ko`, `/en` → 각 언어 사전(dictionary)으로 렌더링
- `/ko/about`, `/en/about` → 모든 페이지가 locale 파라미터를 받음
- `/fr` → 지원 안 함 → 404

## 파일 구조

```
app/
  page.tsx                  # / : 언어 감지 후 리다이렉트
  layout.tsx                # <html lang> 동적 설정
  [locale]/
    layout.tsx              # locale 검증 + 공통 내비게이션
    page.tsx                # 홈 (generateStaticParams로 ko/en SSG)
    about/page.tsx
lib/i18n.ts                 # locale 목록 + 사전
components/locale-switcher.tsx
```

## 핵심 개념

### locale 검증과 사전

```tsx
// [locale]/layout.tsx
const { locale } = await params;
if (!isLocale(locale)) notFound();      // /fr 등은 404
const dict = getDictionary(locale);
```

### 언어별 정적 생성

```tsx
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}
```

빌드 출력에 `/ko`, `/en` 두 라우트가 각각 SSG로 생성됩니다.

### `<html lang>`과 hreflang

```tsx
// 루트 layout: lang을 locale에 맞춰 설정 (접근성/SEO)
<html lang={locale}>

// [locale] layout: 검색엔진에 다른 언어 버전 알림
alternates: { languages: { ko: "/ko", en: "/en" } }
```

## 정량 비교: URL 기반 vs 쿠키 기반 언어

| 방식 | SEO | 공유/재현 |
| --- | --- | --- |
| URL 세그먼트 (`/ko/...`) | 언어별 인덱싱, hreflang 가능 | 같은 URL = 같은 언어 |
| 쿠키/헤더만으로 전환 | 검색엔진이 언어를 구분 못 함 | URL로 언어 특정 불가 |

콘텐츠가 공개 대상이라면 **URL 기반이 표준**입니다.

## 좋은 활용 사례

- 사전은 `lib/i18n.ts` → 규모가 커지면 JSON 파일/CMS로
- 날짜/숫자는 `Intl.NumberFormat(locale)`로 포맷
- 언어 전환기는 현재 경로의 locale 세그먼트만 교체
- 루트에서 `Accept-Language`로 초기 언어 추천

## DX 개선

- 프레임워크 내장 라우팅 규칙(`[locale]`)으로 미들웨어 없이 구성
- 언어가 라우트 파라미터라 타입과 빌드 검증이 자동

## 관련 문서

- [Internationalization](https://nextjs.org/docs/app/guides/internationalization)
