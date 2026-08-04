"use server";

// 이 파일 전체가 서버 액션입니다.
// "use server"가 파일 맨 위에 있으면, 이 파일의 모든 export가
// 각각 독립적인 서버 액션(HTTP POST 엔드포인트)이 됩니다.
import { addTodo, addLike, wait } from "@/lib/db";

export type TodoActionResult = {
  ok: boolean;
  message: string;
};

export async function createTodo(
  _prev: TodoActionResult,
  formData: FormData,
): Promise<TodoActionResult> {
  const text = String(formData.get("text") ?? "").trim();

  // 서버에서 검증합니다. 클라이언트 검증은 편의용일 뿐,
  // 서버 검증이 진짜 검증입니다.
  if (!text) {
    return { ok: false, message: "내용을 입력해주세요." };
  }
  if (text.length > 50) {
    return { ok: false, message: "50자를 넘길 수 없습니다." };
  }

  // 네트워크/DB 지연 흉내. 제출 중 상태가 UI에 어떻게 반영되는지
  // 눈으로 볼 수 있게 800ms를 기다립니다.
  await wait(800);

  addTodo(text);
  return { ok: true, message: "추가했습니다." };
}

export async function likePhoto(): Promise<number> {
  await wait(600);
  return addLike();
}
