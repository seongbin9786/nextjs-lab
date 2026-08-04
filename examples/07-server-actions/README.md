# 07 — Server Actions와 폼

> `"use server"` 함수로 API 라우트 없이 폼 제출·데이터 변경을 처리합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 페이지 | 내용 |
| --- | --- |
| `/todos` | 폼 + `useActionState`(결과) + `useFormStatus`(제출 중) |
| `/photos` | `useOptimistic` 낙관적 업데이트 (좋아요) |
| `/manual` | 폼 없이 `useTransition`으로 액션 호출 |

## 핵심 개념

### Server Action 정의

```ts
// app/actions.ts
"use server";
export async function createTodo(_prev, formData: FormData) {
  const text = String(formData.get("text") ?? "");
  if (!text) return { ok: false, message: "내용을 입력해주세요." };
  await db.todos.create({ text });
  return { ok: true, message: "추가했습니다." };
}
```

### 폼과 상태 훅

```tsx
const [state, formAction, isPending] = useActionState(createTodo, initial);
// useFormStatus는 폼 '안의' 자식 컴포넌트에서 호출해야 함
<form action={formAction}>...</form>
```

### 낙관적 업데이트

```tsx
const [optimistic, addOptimistic] = useOptimistic(likes, (s, d) => s + d);
startTransition(async () => {
  addOptimistic(1);      // 즉시 +1 표시
  await likePhoto();     // 서버 액션 (느려도 체감 지연 없음)
});
```

## 정량 비교: API 라우트 방식 vs Server Action

| 항목 | API 라우트 | Server Action |
| --- | --- | --- |
| 작성 파일 | `route.ts` + 클라이언트 fetch 코드 | 함수 1개 |
| 폼 직렬화 | 수동 (`JSON.stringify`/파싱) | FormData 자동 |
| JS 비활성 환경 | 제출 불가 | **네이티브 폼 제출로 동작** |
| 제출 후 갱신 | 수동 refetch | 자동 re-render |
| 왕복 (Next 16) | 요청 → 응답 → refetch 요청 | **단일 왕복** (액션 + 갱신이 한 응답) |

`/todos`에서 800ms 지연을 넣었지만 "추가하는 중…" 상태와 결과 표시가
추가 코드 없이 처리됩니다.

## 좋은 활용 사례

- 생성/수정/삭제 폼은 Server Action (읽기 전용 API만 Route Handler로)
- 서버 검증은 필수 — 클라이언트 검증은 편의용일 뿐
- 좋아요/즐겨찾기는 `useOptimistic`으로 체감 지연 제거
- 실패 시나리오는 `useActionState`의 반환 값으로 전달

## DX 개선

- "엔드포인트 작성 → fetch 함수 작성 → 에러 처리" 3단계가 함수 1개로 축소
- 점진적 향상: JS 로딩 전에도 폼이 동작
- Next 16 단일 왕복 모델로 제출 후 화면 갱신까지 한 번의 응답으로 처리

## 관련 문서

- [Server Actions](https://nextjs.org/docs/app/guides/server-actions)
- [Forms](https://nextjs.org/docs/app/guides/forms)
