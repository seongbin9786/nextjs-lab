import Link from "next/link";
import { products } from "@/lib/products";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Metadata와 SEO</h1>
      <p>
        Next.js는 <strong>코드에서 메타태그를 관리</strong>합니다.{" "}
        <code>metadata</code> export와 <code>generateMetadata</code>, 파일
        규칙(<code>sitemap.ts</code>, <code>robots.ts</code>,{" "}
        <code>opengraph-image.tsx</code>)으로 검색엔진과 SNS 공유에 필요한
        모든 것을 만듭니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/products/keyboard">동적 메타데이터</Link>
          </h3>
          <p>
            <code>generateMetadata</code>로 상품별 title/description/OG를
            만듭니다. <code>/products/mouse</code>도 있어요.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/jsonld">JSON-LD 구조화 데이터</Link>
          </h3>
          <p>검색엔진이 콘텐츠의 의미를 이해하게 하는 스키마.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/sitemap.xml">sitemap.xml</Link>
          </h3>
          <p>
            <code>app/sitemap.ts</code>가 생성합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/robots.txt">robots.txt</Link>
          </h3>
          <p>
            <code>app/robots.ts</code>가 생성합니다.
          </p>
        </div>
      </div>

      <h2>확인해볼 것</h2>
      <ul>
        <li>
          이 페이지와 상품 페이지의 <strong>페이지 소스 보기</strong>{" "}
          (Ctrl/Cmd+U): <code>&lt;title&gt;</code>,{" "}
          <code>meta[description]</code>, <code>og:*</code> 태그가 서버
          HTML에 들어 있습니다.
        </li>
        <li>
          <code>/products/keyboard</code>의 OG 이미지:{" "}
          <code>opengraph-image.tsx</code>가 <strong>첫 요청 시</strong> 이미지로
          렌더링하고, 이후에는 캐시된 이미지를 재사용합니다.
        </li>
        <li>
          브라우저 탭의 파비콘: <code>app/icon.svg</code>.
        </li>
      </ul>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>왜 정적 메타태그보다 좋을까</strong>: 데이터(상품명, 가격)와
          메타태그가 같은 서버 코드에서 나와서 어긋나지 않고, 동적 페이지마다
          수동으로 HTML을 관리할 필요가 없습니다.
        </p>
      </div>
    </div>
  );
}
