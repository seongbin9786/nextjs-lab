// 서버 프로세스 메모리에 사는 "데이터베이스" 흉내입니다.
// 실제 앱에서는 이 자리에 DB 클라이언트나 외부 API 호출이 들어갑니다.
type Post = {
  id: number;
  title: string;
};

const state = {
  posts: [
    { id: 1, title: "Cache Components가 뭐길래" },
    { id: 2, title: "use cache 지시어 파헤치기" },
    { id: 3, title: "즉시 내비게이션 검증" },
  ] as Post[],
  nextId: 4,
};

export function listPosts(): Post[] {
  return state.posts;
}

export function addPost(title: string): Post {
  const post = { id: state.nextId, title };
  state.nextId += 1;
  state.posts = [...state.posts, post];
  return post;
}
