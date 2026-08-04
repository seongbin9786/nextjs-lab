// 느린 데이터 fetching을 흉내내는 헬퍼.
// 실제 앱에서는 여기가 DB 쿼리나 외부 API 호출입니다.
export async function slowQuery<T>(label: string, ms: number, value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}

export function now(): string {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}
