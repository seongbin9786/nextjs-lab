// 서버 컴포넌트에서 던진 오류도 같은 error.tsx 경계가 잡습니다.
export default async function CrashServerPage({
  searchParams,
}: {
  searchParams: Promise<{ crash?: string }>;
}) {
  const { crash } = await searchParams;

  if (crash === "1") {
    // 이 throw는 서버에서 일어나지만, 사용자에게는
    // app/reports/error.tsx가 보입니다.
    throw new Error("서버 렌더링 중 발생한 데모 오류");
  }

  return (
    <>
      <h1>서버 에러 만들기</h1>
      <p>
        이 페이지는 서버 컴포넌트입니다. 아래 링크는{" "}
        <code>?crash=1</code>을 붙여 서버 렌더링 중에{" "}
        <code>throw</code>하게 만듭니다.
      </p>
      <p>
        <a className="button" href="/reports/crash-server?crash=1">
          서버 오류 던지기 (?crash=1)
        </a>
      </p>
      <p className="muted">
        searchParams를 읽기 때문에 이 라우트는 매 요청 렌더링됩니다.
        빌드 중에는 throw가 실행되지 않아 빌드가 깨지지 않습니다.
      </p>
    </>
  );
}
