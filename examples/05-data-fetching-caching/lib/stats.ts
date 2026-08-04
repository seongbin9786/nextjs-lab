// 서버 프로세스 안에 사는 "데이터베이스" 흉내.
// 실제로는 이 자리에 DB 클라이언트가 들어갑니다.
type Stats = {
  visitors: number;
  generatedAt: string;
};

const state = {
  visitors: 12000,
};

export function getStats(): Stats {
  state.visitors += Math.floor(Math.random() * 20) + 1;
  return {
    visitors: state.visitors,
    generatedAt: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  };
}
