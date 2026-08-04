# 15 — 병렬 라우트와 인터셉팅 라우트

> 한 화면에 여러 슬롯을 동시에 렌더링하고(병렬), 내비게이션을 가로채 모달로 보여줍니다(인터셉팅).

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 데모: 갤러리 + 사진 모달

- 갤러리(`/`)에서 썸네일 클릭 → 주소는 `/photo/1`로 바뀌지만 **모달**이 뜸
- `/photo/1`을 주소창에 직접 입력하거나 새로고침 → **전체 페이지**가 열림
- Esc/배경 클릭/닫기 → `router.back()`으로 갤러리 복귀

## 파일 구조

```
app/
  layout.tsx                     # children + @modal 두 슬롯 렌더링
  page.tsx                       # 갤러리
  default.tsx                    # children 슬롯 기본값 (page 재사용)
  photo/[id]/page.tsx            # 전체 페이지 (직접 접속용)
  @modal/
    default.tsx                  # null (Next 16: 슬롯마다 default 필수)
    (.)photo/[id]/page.tsx       # 인터셉팅 라우트 → 모달
```

## 핵심 개념

### 병렬 라우트 = 슬롯

```tsx
// layout.tsx가 여러 슬롯을 동시에 렌더링
export default function RootLayout({ children, modal }) {
  return (<body>{children}{modal}</body>);
}
```

`@modal` 폴더가 하나의 슬롯입니다. 레이아웃 props로 받아 원하는 위치에 배치.

### 인터셉팅 라우트 `(.)`

`(.)photo`는 "같은 수준에서 `/photo`로 가는 **클라이언트 내비게이션**"을
가로챕니다. 직접 접속/새로고침은 가로채지 않아 자연스럽게 전체 페이지가 열립니다.

| 접두사 | 의미 |
| --- | --- |
| `(.)` | 같은 수준의 세그먼트 매칭 |
| `(..)` / `(..)(..)` | 한/두 단계 위 |
| `(...)` | 루트부터 전부 |

> **Next.js 16 변경점**: 병렬 라우트 슬롯마다 `default.tsx`가 **필수**가
> 되었습니다. 없으면 빌드가 실패합니다. 이 예시의 `@modal/default.tsx`는
> `null`을 반환합니다.

## 정량 비교: 모달 구현 방식

| 방식 | 상세 전환 시 전송/렌더링 |
| --- | --- |
| 별도 모달 라이브러리 + 수동 상태 | URL 미변경 — 새로고침 시 상태 소실, 공유 불가 |
| 전체 페이지 이동 | 페이지 전체 재렌더 + 레이아웃 재전송 |
| 인터셉팅 라우트 | **모달 부분만** 렌더 + URL 유지(공유/새로고침 안전) |

## 좋은 활용 사례

- 목록 → 상세 모달 (사진, 상품 미리보기)
- 로그인 모달, 설정 패널 등 "맥락을 유지하는" 보조 화면
- 전체 페이지 버전도 반드시 함께 만들기 (직접 접속 대비)

## DX 개선

- 모달 + 라우팅을 선언적 파일 구조로 해결 — 모달 상태 관리 코드 없음
- 브라우저 뒤로가기/URL 공유가 무료로 동작

## 관련 문서

- [Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
