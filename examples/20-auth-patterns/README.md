# 20 — 인증 패턴

> 쿠키 + 서명된 토큰의 서버 사이드 세션 인증 골격. 라이브러리 없이 각 계층의 역할을 보여줍니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

데모 계정: `admin@example.com` / `admin123`, `dev@example.com` / `dev123`

## 흐름

1. **로그인** — Server Action에서 자격 증명 검증 → HMAC 서명된 토큰을
   `httpOnly` 쿠키에 저장 → 보호 페이지로 redirect
2. **요청마다** — `proxy.ts`가 쿠키 **유무**만 빠르게 확인 (없으면 로그인으로)
3. **페이지에서** — 서버 컴포넌트가 토큰의 **서명까지 검증**해 사용자 렌더링
4. **로그아웃** — Server Action으로 쿠키 삭제

## 핵심 개념

### 서명된 세션 토큰

```ts
// payload를 base64url 직렬화 + HMAC 서명
const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
const token = `${encoded}.${sign(encoded)}`;

// 검증: 상수 시간 비교로 타이밍 공격 방지
timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
```

### 쿠키 보안 옵션

```ts
jar.set(SESSION_COOKIE, token, {
  httpOnly: true,                       // JS 읽기 불가 → XSS 탈취 방지
  sameSite: "lax",                      // CSRF 완화
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60,
});
```

## 정량 비교: 이중 검사

| 검사 지점 | 확인 내용 | 목적 |
| --- | --- | --- |
| `proxy.ts` | 쿠키 유무 | 빠른 UX 리다이렉트 (낙관적) |
| 페이지 서버 코드 | 서명 + 만료 | **진짜 보안 경계** |

proxy만 믿으면 우회 경로(직접 서버 호출 등)에 무방비입니다. 그래서
`/account` 페이지에서 서명까지 다시 검증합니다.

## 좋은 활용 사례

- 인증 상태가 필요한 모든 서버 코드에서 토큰 재검증
- 만료(`exp`)를 토큰에 넣고 검증
- 실제 서비스는 **Auth.js** 등 검증된 라이브러리 + 시크릿 키 관리 사용
- 권한(인가)은 인증과 분리해 페이지/액션에서 각각 검사

## DX 개선

- Next.js의 쿠키/세션/액션 API로 미들웨어 스택 없이 인증 구성
- 서버 전용 로직(비밀 키)이 클라이언트에 노출되지 않음

## 관련 문서

- [Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Data Security](https://nextjs.org/docs/app/guides/data-security)
