# 17 — 환경 변수

> `.env` 파일 로딩 우선순위, 서버 전용 vs `NEXT_PUBLIC_`, 빌드 시 인라인 vs 런타임.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` — 우선순위 요약 + 현재 값 표시
- `/server` — 서버 전용 변수 (클라이언트 번들에 없음)
- `/client` — `NEXT_PUBLIC_` 변수 (빌드 시 인라인)
- `/runtime` — 셸에서 주입한 런타임 변수
- `/priority` — `.env.local`을 만들어 우선순위를 직접 실험

## 로딩 우선순위 (높은 순)

1. 셸에서 이미 export된 값
2. `.env.local` (git 커밋 금지)
3. `.env.development` 또는 `.env.production` (NODE_ENV에 따라)
4. `.env` (기본값)

이 예시는 `.env`, `.env.development`, `.env.production`, `.env.example`을
포함합니다. `cp .env.example .env.local` 후 새로고침하면 `EXAMPLE_PRIORITY`
값이 바뀌어 우선순위를 눈으로 확인할 수 있습니다.

## 핵심 개념: 변수의 3가지 성격

| 성격 | 예시 | 읽는 곳 | 변경하려면 |
| --- | --- | --- | --- |
| 서버 전용 | `DB_PASSWORD` | 서버 컴포넌트/액션 | 재시작 |
| `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` | 브라우저 포함 **빌드 시 인라인** | **다시 빌드** |
| 런타임 | `DEPLOY_REGION` | 서버 프로세스 | 재시작 |

### NEXT_PUBLIC_의 함정

```ts
// 빌드 후 번들에는 문자열이 그대로 박힙니다
const apiUrl = "https://api.example.com";
```

- 배포 단계별로 값이 다르면 **단계별로 다시 빌드**해야 합니다.
- `NEXT_PUBLIC_X = 변수` 같은 동적 할당은 인라인되지 않아 동작하지 않습니다.
- 민감한 값은 절대 `NEXT_PUBLIC_`를 붙이지 마세요.

## 정량 비교: 비밀 값 노출 위험

| 방식 | 브라우저 번들에 포함? |
| --- | --- |
| `process.env.DB_PASSWORD` (접두사 없음) | **아니요** — 자동 제외 |
| `NEXT_PUBLIC_DB_PASSWORD` | **예** — 누구나 볼 수 있음 |

`/server` 페이지에서 안내한 대로 DevTools → Sources에서 값을 검색하면
`base-password`가 번들에 없음을 확인할 수 있습니다.

## 좋은 활용 사례

- 비밀 키/DB 접속: 서버 전용 + `.env.local` 또는 시크릿 매니저
- 브라우저에 필요한 공개 값만 `NEXT_PUBLIC_`
- 같은 이미지를 환경별로 띄우는 Docker 배포는 런타임 변수로

## DX 개선

- `.env*` 자동 로드 — dotenv 설정 불필요
- 접두사 하나로 서버/클라이언트 노출 경계가 명확

## 관련 문서

- [Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
