import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";

const photoIds = [1, 2, 3, 4, 5, 6];

export function generateStaticParams() {
  return photoIds.map((id) => ({ id: String(id) }));
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photoId = Number(id);
  if (!photoIds.includes(photoId)) notFound();

  return (
    <div className="container">
      <ViewTransition
        enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        default="none"
      >
        {/* 갤러리의 썸네일과 같은 name → 두 요소가 이어져 모프됩니다 */}
        <ViewTransition name={`photo-${photoId}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/photos/${photoId}.svg`}
            alt={`사진 ${photoId}`}
            style={{ width: "100%", borderRadius: 14, display: "block" }}
          />
        </ViewTransition>

        <h1>사진 #{photoId}</h1>
        <p>
          갤러리에서 클릭해서 왔다면 이미지가 <strong>모프하며</strong>{" "}
          커졌을 겁니다. 이제 돌아가기 링크는{" "}
          <code>nav-back</code> 타입이라 반대 방향으로 슬라이드합니다.
        </p>
        <p>
          <Link href="/" transitionTypes={["nav-back"]}>
            ← 갤러리로 돌아가기 (nav-back)
          </Link>
        </p>

        <h2>핵심 정리</h2>
        <ul>
          <li>
            <code>{"<ViewTransition name=\"photo-1\">"}</code> — 두 페이지에서{" "}
            <strong>같은 name</strong>이면 브라우저가 두 요소를 하나의
            대상으로 이어줍니다.
          </li>
          <li>
            <code>share=&quot;morph&quot;</code> + <code>default=&quot;none&quot;</code>{" "}
            — 모프 애니메이션만 켜고 다른 전환에는 반응하지 않게 합니다.
          </li>
          <li>
            <code>{"<Link transitionTypes={[\"nav-forward\"]}>"}</code> —
            내비게이션에 "방향" 태그를 달아 CSS가 방향별 슬라이드를
            적용하게 합니다.
          </li>
        </ul>
      </ViewTransition>
    </div>
  );
}
