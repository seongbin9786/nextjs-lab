// 스트리밍 응답: ReadableStream으로 필요한 만큼 나누어 보냅니다.
// Server-Sent Events(SSE) 형식으로 1초마다 이벤트를 pushing니다.
export const dynamic = "force-dynamic";

export async function GET() {
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let tick = 0;

      timer = setInterval(() => {
        tick += 1;
        const event = `data: {"tick":${tick},"time":"${new Date().toLocaleTimeString("ko-KR", { hour12: false })}"}\n\n`;
        controller.enqueue(encoder.encode(event));
        if (tick >= 10) {
          controller.close();
        }
      }, 1000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
