"use client";

import { useState } from "react";

export function CrashButton() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // 렌더링 중에 던져야 에러 경계가 잡습니다.
  // (이벤트 핸들러 안의 throw는 경계가 잡지 못합니다.)
  if (shouldThrow) {
    throw new Error("클라이언트 렌더링 중 발생한 데모 오류");
  }

  return (
    <button type="button" onClick={() => setShouldThrow(true)}>
      렌더링 중 오류 던지기
    </button>
  );
}
