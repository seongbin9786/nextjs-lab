"use server";

import { updateTag } from "next/cache";
import { addPost } from "@/lib/db";

export type ActionResult = {
  ok: boolean;
  message: string;
};

// Server Action: 폼 제출이나 useTransition에서 호출되는 서버 함수.
// useActionState와 쓸 때는 (이전 상태, FormData)를 받습니다.
export async function createPost(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, message: "제목을 입력해주세요." };
  }

  addPost(title);

  // updateTag: 캐시를 무효화하고 "같은 요청 안에서" 새 값을 다시 읽습니다.
  // (read-your-writes) 서버 렌더링 결과를 사용자에게 바로 돌려주기 때문에
  // 사용자는 자기가 쓴 글을 즉시 봅니다.
  updateTag("posts");

  return { ok: true, message: `"${title}" 추가 완료` };
}
