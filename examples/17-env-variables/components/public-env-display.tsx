"use client";

// 클라이언트 컴포넌트에서 NEXT_PUBLIC_ 변수를 읽습니다.
// 이 값은 빌드 시점에 문자열 그대로 "인라인"됩니다.
export function PublicEnvDisplay() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "(없음)";

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        클라이언트에서 읽은 값 <span className="badge client">use client</span>
      </h3>
      <p className="metric" style={{ margin: 0 }}>
        NEXT_PUBLIC_API_URL = {apiUrl}
      </p>
    </div>
  );
}
