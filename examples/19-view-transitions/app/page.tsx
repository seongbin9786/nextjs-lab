import Link from "next/link";
import { ViewTransition } from "react";

const photos = Array.from({ length: 6 }, (_, i) => i + 1);

export default function GalleryPage() {
  return (
    <div className="container">
      <h1>View Transitions 갤러리</h1>
      <p>
        썸네일을 클릭하면 이미지가 사라졌다 다시 나타나는 것이 아니라,{" "}
        <strong>썸네일이 그대로 커지며 상세 페이지로 이동</strong>합니다.
        React 19.2의 <code>ViewTransition</code> 컴포넌트와 브라우저 View
        Transitions API가 만듭니다.
      </p>

      {/* nav-forward 타입: 상세 페이지에서 슬라이드 방향을 결정합니다 */}
      <ViewTransition
        enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        default="none"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {photos.map((id) => (
            <Link key={id} href={`/photo/${id}`} transitionTypes={["nav-forward"]}>
              {/* 같은 name의 ViewTransition끼리 모프됩니다 */}
              <ViewTransition name={`photo-${id}`} share="morph" default="none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/photos/${id}.svg`}
                  alt={`사진 ${id}`}
                  style={{ width: "100%", borderRadius: 10, display: "block" }}
                />
              </ViewTransition>
            </Link>
          ))}
        </div>
      </ViewTransition>

      <div className="note">
        <p style={{ margin: 0 }}>
          브라우저는 크로미움 계열(크롬, 엣지) 또는 최신 사파리/파이어폭스가
          필요합니다. 미지원 브라우저에서는 애니메이션 없이 정상 동작만
          합니다(우아한 성능 저하).
        </p>
      </div>
    </div>
  );
}
