import { NextResponse } from "next/server";

// 이 API는 호출될 때마다 counter를 1씩 증가시킵니다.
// 클라이언트가 받은 counter 값을 보면 "실제로 서버에 몇 번 요청이 갔는지"를
// 알 수 있어서, 캐싱과 메모이제이션을 눈으로 검증하는 데 사용합니다.
let counter = 0;

export async function GET() {
  counter += 1;
  return NextResponse.json({
    counter,
    time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  });
}
