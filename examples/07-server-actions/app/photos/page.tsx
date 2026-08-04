import Link from "next/link";
import { getLikes } from "@/lib/db";
import { LikeButton } from "@/components/like-button";

export const dynamic = "force-dynamic";

export default function PhotosPage() {
  const likes = getLikes();

  return (
    <div className="container">
      <h1>낙관적 업데이트 (useOptimistic)</h1>
      <p>
        사용자의 동작 결과를 <strong>서버 응답 전에</strong> 미리 보여주는
        패턴입니다. 실패하면 롤백하는 전제 아래, 대부분의 좋아요/즐겨찾기
        같은 동작은 성공하므로 체감 속도가 크게 좋아집니다.
      </p>
      <LikeButton initial={likes} />
      <div className="note">
        <p style={{ margin: 0 }}>
          <code>useOptimistic(initial, reducer)</code>는 트랜지션 동안만
          임시 값을 보여줍니다. 트랜지션이 끝나면(서버 액션 완료) 실제
          리렌더 값으로 되돌아옵니다. 롤백 코드를 직접 짤 필요가 없습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
