# 20 — 인증 패턴

> 쿠키 + 서명된 토큰의 서버 사이드 세션 인증 골격. 라이브러리 없이 각 계층의 역할을 보여줍니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

데모 계정: `admin@example.com` / `admin123`, `dev@example.com` / `dev123`

## 이 예시가 보여주는 것

| 구성 | 역할 |
| --- | --- |
| `app/login/page.tsx` + `components/login-form.tsx` | 자격 증명 입력 폼, `useActionState`로 결과 표시 |
| `app/actions.ts` | 로그인/로그아웃 Server Action, 쿠키 발급·삭제 |
| `lib/session.ts` | 토큰 생성·검증 (HMAC 서명), 데모 사용자 목록 |
| `proxy.ts` | `/account` 경로 보호 — 쿠키 유무만 빠르게 확인 |
| `app/account/page.tsx` | 보호 페이지 — 토큰 서명까지 검증해 렌더링 |

## 동작 원리

### 세션 쿠키 + 서명 토큰의 전체 흐름

공식 인증 문서는 인증을 세 단계로 나눕니다: **인증**(누구인지 확인),
**세션 관리**(요청 사이에 인증 상태 유지), **인가**(무엇에 접근할 수 있는지).
이 예시는 그중 쿠키 기반 상태 없는(stateless) 세션 방식을 보여줍니다.
토큰 자체가 사용자 정보를 들고 있어서 서버가 별도 저장소를 조회하지 않아도
검증할 수 있는 구조입니다.

```
[로그인]
  폼 제출 → Server Action login()
    1) authenticate(): 이메일/비밀번호 확인 (데모는 목록, 실제로는 DB)
    2) createSessionToken(): payload + HMAC 서명으로 토큰 생성
    3) cookies().set(): httpOnly 쿠키에 저장
    4) redirect(from): 원래 가려던 페이지로

[매 요청 /account/*]
  ① proxy.ts: session 쿠키가 '있는가'만 확인
       없으면 → /login?from=<경로>로 리다이렉트 (페이지 렌더링 0)
  ② app/account/page.tsx: 쿠키의 토큰을 서명·만료까지 검증
       실패하면 → /login으로, 성공하면 → 사용자 정보 렌더링

[로그아웃]
  폼 제출 → Server Action logout() → cookies().delete() → /login
```

서명 토큰의 구조는 이렇습니다:

```
base64url(payload).base64url(HMAC-SHA256(payload, 비밀키))
   └ user, exp(만료 시각)        └ 비밀키가 없으면 위조 불가
```

payload는 인코딩만 될 뿐 암호화되지 않습니다(누구나 디코딩하면 내용 확인
가능). 그래서 토큰에 비밀번호 같은 비밀을 넣으면 안 됩니다. 서명의 역할은
**위조 방지**입니다 — 비밀 키를 모르는 사람은 payload를 수정해도 유효한
서명을 만들 수 없습니다. 구조가 JWT와 비슷하지만, 데모를 위한 최소
구현입니다.

검증 시에는 **상수 시간 비교**(`timingSafeEqual`)를 사용합니다. 문자열을
앞에서부터 순서대로 비교하면 일치한 글자 수에 따라 걸리는 시간이 미세하게
달라지고, 공격자가 이 시간 차이로 서명을 한 글자씩 맞춰볼 수 있습니다
(타이밍 공격). `timingSafeEqual`은 길이가 같을 때 항상 같은 시간이 걸려
이 공격을 막습니다.

### 쿠키 보안 옵션이 각각 막는 공격

```ts
// app/actions.ts
jar.set(SESSION_COOKIE, token, {
  httpOnly: true,                       // JS 읽기 불가 → XSS 탈취 방지
  sameSite: "lax",                      // CSRF 완화
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60,
});
```

| 옵션 | 의미 | 막는 공격/효과 |
| --- | --- | --- |
| `httpOnly: true` | 브라우저 JS가 `document.cookie`로 쿠키를 읽지 못함 | **XSS로 쿠키 훔치기 차단.** 스크립트 삽입 공격이 성공해도 세션 토큰 자체는 탈취 불가. 다만 `fetch` 요청에는 쿠키가 계속 실리므로(서버가 쓰는 것이므로 정상), XSS가 완전히 무력화되는 것은 아님 |
| `sameSite: "lax"` | 크로스 사이트 요청 중 "최상위 탐색 + 안전한 메서드(GET)"에만 쿠키를 보냄 | **CSRF 완화.** 다른 사이트에서 날아오는 POST(폼 제출 등)에는 쿠키가 안 실려서 공격자가 내 세션으로 요청을 위장하기 어려움. 2020년부터 브라우저 기본값도 Lax |
| `secure: true` | HTTPS 연결에서만 쿠키 전송 (localhost는 예외) | 네트워크 도청 시 쿠키 노출 방지. dev에서는 http라 이 예시는 production에서만 켬 |
| `maxAge: 60 * 60` | 쿠키 수명(초). 지나면 브라우저가 삭제 | 세션 영구화 방지. 토큰의 `exp`와 별도로 브라우저 차원의 만료 |
| `path: "/"` | 사이트 전체 경로에서 쿠키 전송 | 경로 제한. 단, 경로 구분은 보안 경계가 아님 |

`sameSite` 값별 차이를 좀 더 정확히 정리하면:

- `strict`: 같은 사이트 요청에서만 쿠키 전송. CSRF 방어는 가장 강하지만,
  외부 링크를 타고 들어올 때도 쿠키가 안 실려서 로그인 상태가 끊기는 등
  UX를 깨뜨릴 수 있습니다.
- `lax`: 같은 사이트 요청 + 크로스 사이트 **최상위 탐색의 안전한
  메서드**(예: GET)에 전송. 크로스 사이트 POST, `<img>`/`<script>` 같은
  하위 자원 로딩, iframe 탐색에는 전송하지 않습니다.
- `none`: 모두 전송. 반드시 `secure`와 함께 써야 하며 CSRF 방어가 없으므로
  별도의 방어 수단이 필요합니다.

이 예시가 `lax`를 고른 이유: CSRF 공격의 주 통로인 크로스 사이트 POST는
막으면서, 로그인 후 리다이렉트 같은 정상 흐름은 깨뜨리지 않기 때문입니다.

### 이중 검증: proxy 낙관적 게이트 + 서버 측 재검증

이 예시의 보안 구조는 **두 겹**입니다.

| 검사 지점 | 확인 내용 | 목적 |
| --- | --- | --- |
| `proxy.ts` | 쿠키 유무 | 빠른 UX 리다이렉트 (낙관적) |
| 페이지 서버 코드 | 서명 + 만료 | **진짜 보안 경계** |

**proxy 검사가 필요한 이유**: 라우트 매칭 전에 실행되므로, 비로그인 사용자의
`/account` 접근을 페이지 코드 실행 없이 돌려보냅니다. 렌더링 비용이 0이고
사용자는 즉시 로그인 화면을 봅니다. prefetch된 라우트를 포함해 모든 요청에
끼어들 수 있는 위치이기 때문에, 여기서는 DB 조회 같은 무거운 검증을 하면
안 되고 쿠키에서 세션을 읽는 수준의 가벼운 검사만 해야 한다는 것이 공식
문서의 안내입니다.

**proxy 검사만으로는 부족한 이유**: proxy는 앱 앞에 놓인 빠른 거름망일 뿐,
최종 권한 체크가 아닙니다. 공식 문서 표현을 빌리면, proxy가 초기 검사에
유용할 수는 있어도 데이터 보호의 유일한 방어선이 되어서는 안 되며, 보안
검사의 대부분은 데이터 소스에 최대한 가까운 곳에서 이루어져야 합니다.
구체적으로 이런 틈이 있습니다.

- 쿠키가 **있기만 하면** 통과이므로, 만료되거나 위조된 토큰도 proxy는
  통과시킵니다.
- proxy의 matcher가 커버하지 못하는 경로(예: Server Function 호출은 해당
  라우트의 POST 요청이라, 경로가 matcher에서 제외되면 액션도 proxy를
  거치지 않음)가 생길 수 있습니다.

그래서 `app/account/page.tsx`가 서명까지 다시 검증하는 것입니다. proxy에서
통과했더라도 서명이 틀렸거나 만료된 토큰이면 여기서 걸러 로그인으로
돌려보냅니다. 같은 원리로, Server Action에서도 데이터를 변경하기 전에
세션·권한을 각각 검증해야 합니다.

### Server Action에서 cookies()로 세션을 읽고 쓰는 흐름

쿠키는 반드시 **서버에서** 설정해야 합니다. 이 예시의 로그인 액션:

```ts
// app/actions.ts
const token = createSessionToken(user);
const jar = await cookies();
jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", /* ... */ });
redirect(from);
```

순서가 중요합니다. Next.js 15부터 `cookies()`는 비동기라 `await`가
필요합니다. `jar.set()`은 Server Action이 반환하는 응답에 `Set-Cookie`
헤더를 실어 보내는 방식이고, `redirect(from)`은 그 응답과 함께 브라우저가
`from` 페이지로 이동하게 합니다. 브라우저는 `Set-Cookie`를 받아 저장하고,
이후 `/account` 요청마다 쿠키를 자동으로 실어 보냅니다.

로그아웃은 반대입니다:

```ts
// app/actions.ts
export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
```

`jar.delete()`가 만료된 쿠키를 내려보내 삭제하고 로그인 페이지로 보냅니다.

### 주의: 이 예시의 데모용 약한 비밀 값

```ts
// lib/session.ts
const SECRET = process.env.SESSION_SECRET ?? "nextjs-lab-demo-secret";
```

`SESSION_SECRET`을 지정하지 않으면 문자 그대로 박힌 기본값을 씁니다.
비밀 키가 코드에 드러나 있는 상태와 같으므로, **프로덕션에서는 절대 이
상태로 쓰면 안 됩니다.** `SESSION_SECRET`을 환경 변수(서버 전용, 17 예시
참고)로 주입하세요. 데모 사용자 목록의 비밀번호(`admin123` 등)도 실제
앱에서는 해시로 저장해야 합니다.

## 코드와 함께 보는 설명

### `lib/session.ts` — 토큰 생성과 검증

```ts
export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    user,
    exp: Date.now() + 1000 * 60 * 60, // 1시간
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}
```

```ts
export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  // ... payload 파싱 후 exp 확인
}
```

마지막 점(`.`)을 기준으로 payload와 서명을 나누고, 같은 비밀 키로 서명을
다시 만들어 비교합니다. 그 후 payload를 파싱해서 만료 시각(`exp`)까지
확인합니다. 서명 불일치, 파싱 실패, 만료 — 어느 하나라도 걸리면 `null`.

`authenticate()`는 데모 사용자 목록에서 이메일/비밀번호를 찾아 일치하면
사용자 객체를 반환합니다. 주석에 적힌 대로 실제로는 DB 조회입니다.

### `proxy.ts` — 낙관적 게이트

```ts
// 20-auth-patterns/proxy.ts
if (pathname.startsWith("/account")) {
  const session = request.cookies.get("session")?.value;
  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
}
```

쿠키의 **값을 검증하지 않습니다.** 유무만 봅니다. `from` 파라미터에 원래
가려던 경로를 담아, 로그인 후 복귀할 수 있게 합니다.

```ts
export const config = {
  matcher: ["/account/:path*"],
};
```

matcher로 `/account` 하위 경로에만 실행되게 좁혔습니다. 공식 문서는 인증
용도라면 proxy를 모든 경로에서 돌리는 것도 권장하지만, 이 데모는 보호
경로가 하나라 명시적으로 좁혔습니다.

### `app/account/page.tsx` — 진짜 검증

```tsx
export const dynamic = "force-dynamic";

const jar = await cookies();
const payload = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
if (!payload) {
  redirect("/login?from=/account");
}
```

`cookies()`로 쿠키를 읽고 `verifySessionToken()`에 통째로 넘깁니다. 서명·
만료 검증이 끝나야 `payload.user`로 이름/이메일/세션 만료 시각을
렌더링합니다. `force-dynamic`이라 이 페이지는 매 요청 서버에서 검증하며,
캐시된 HTML이 비로그인 사용자에게 새지 않습니다.

### `components/login-form.tsx` — useActionState

```tsx
const [state, formAction] = useActionState(login, initial);
```

`useActionState`로 액션 결과를 상태처럼 받습니다. 로그인 액션이
`{ ok, message }`를 반환하면 실패 메시지를 폼 아래에 표시합니다.
`useFormStatus`로 제출 중 버튼을 비활성화합니다. 서버 액션이라 검증
로직(자격 증명 확인, 쿠키 발급)은 전부 서버에서 실행되고, 브라우저에는
결과만 옵니다.

## 좋은 활용 사례

- 인증 상태가 필요한 모든 서버 코드에서 토큰 재검증
- 만료(`exp`)를 토큰에 넣고 검증
- 실제 서비스는 **Auth.js** 등 검증된 라이브러리 + 시크릿 키 관리 사용
- 권한(인가)은 인증과 분리해 페이지/액션에서 각각 검사
- Server Function마다 세션 검증을 넣어 proxy 우회 경로 차단

## DX 개선

- Next.js의 쿠키/세션/액션 API로 미들웨어 스택 없이 인증 구성
- 서버 전용 로직(비밀 키)이 클라이언트에 노출되지 않음
- `useActionState` + 폼으로 로딩/에러 상태가 자연스럽게 처리됨

## 흔한 오해와 주의점

1. **proxy를 통과하면 로그인된 것이라고 믿기.** proxy는 쿠키 유무만
   봅니다. 서명·만료 검증은 페이지/액션에서 반드시 다시 해야 합니다. 이
   예시가 이중 검사를 하는 이유입니다.
2. **httpOnly가 XSS를 완전히 막는다고 생각하기.** httpOnly는 JS가 쿠키를
   **읽는 것**을 막아 토큰 탈취를 차단합니다. 하지만 XSS가 있으면 여전히
   사용자의 브라우저에서 그 세션으로 요청을 보낼 수 있으므로, XSS 자체를
   막는 노력(입력 검증, 출력 이스케이프)은 별도로 필요합니다.
3. **sameSite lax가 모든 CSRF를 막는다고 생각하기.** lax는 크로스 사이트
   POST와 하위 자원 로딩을 막지만, 크로스 사이트 최상위 GET 탐색에는 쿠키가
   실립니다. 상태 변경은 반드시 POST 이상의 메서드로만 해야 lax의 방어가
   성립합니다.
4. **데모 비밀 값을 그대로 배포하기.** `lib/session.ts`의 기본
   `SECRET`과 평문 비밀번호 목록은 학습용입니다. 프로덕션에서는 환경
   변수로 비밀 키를 주입하고, 비밀번호는 해시로 저장하세요.
5. **클라이언트 컴포넌트에서 세션 쿠키를 읽으려고 하기.** httpOnly라
   브라우저 JS에서는 읽을 수 없습니다. 인증 상태가 필요한 UI는 서버
   컴포넌트에서 검증한 결과를 props로 내려주거나, 서버 API를 통하세요.

## 관련 문서

- [Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Data Security](https://nextjs.org/docs/app/guides/data-security)
- [Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [cookies()](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Set-Cookie (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
