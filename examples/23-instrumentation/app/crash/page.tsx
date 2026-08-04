// onRequestError 훅을 실제로 발동시키는 페이지입니다.
export default async function CrashPage({
  searchParams,
}: {
  searchParams: Promise<{ boom?: string }>;
}) {
  const { boom } = await searchParams;

  if (boom === "1") {
    throw new Error("instrumentation 데모용 서버 에러");
  }

  return (
    <div className="container">
      <h1>에러 만들기</h1>
      <p>아래 링크를 누르면 서버에서 에러가 던져지고,</p>
      <ol>
        <li>
          화면에는 에러 UI(<code>error.tsx</code>가 없으면 기본 오류 화면)가
          표시됩니다.
        </li>
        <li>
          서버 터미널에는 <code>onRequestError</code>가 기록한 로그가
          남습니다.
        </li>
      </ol>
      <p>
        <a className="button" href="/crash?boom=1">
          서버 에러 던지기 (?boom=1)
        </a>
      </p>
    </div>
  );
}
