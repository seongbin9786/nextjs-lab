import { cacheLife, cacheTag } from "next/cache";
import { listPosts } from "@/lib/db";

// 함수 단위 캐싱: unstable_cache의 대체 형태입니다.
// 캐시 키는 컴파일러가 함수 위치 + 인수로 자동 생성합니다.
export async function getPosts() {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  // 실제 앱: await db.posts.findMany() 또는 fetch(...)
  return listPosts();
}
