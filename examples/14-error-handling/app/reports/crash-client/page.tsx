import { CrashButton } from "@/components/crash-button";

export default function CrashClientPage() {
  return (
    <>
      <h1>클라이언트 에러 만들기</h1>
      <p>
        아래 버튼을 누르면 클라이언트 컴포넌트가 렌더링 중에{" "}
        <code>throw</code>합니다. React 에러 경계가 잡아{" "}
        <code>app/reports/error.tsx</code>를 보여줍니다.
      </p>
      <CrashButton />
    </>
  );
}
