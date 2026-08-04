import { NextResponse } from "next/server";

// 이 API는 호출될 때마다 counter를 1씩 증가시킵니다.
// 클라이언트가 받은 counter 값을 보면 "실제로 서버에 몇 번 요청이 갔는지"를
// 알 수 있어서, 캐싱과 메모이제이션을 눈으로 검증하는 데 사용합니다.
let counter = 0;

// 외부 API/DB 왕복 흉내. 이 지연 덕분에 캐시 적중과 미캐시의
// 응답 시간 차이가 scripts/bench.sh 에서 측정될 만큼 커집니다.
const SIMULATED_LATENCY_MS = 150;

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  counter += 1;
  return NextResponse.json({
    counter,
    time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  });
}
