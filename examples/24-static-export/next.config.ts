import type { NextConfig } from "next";

// output: "export" 는 빌드 결과물을 순수 정적 파일(HTML/CSS/JS)로
// 내보냅니다. Node.js 서버 없이 아무 정적 호스팅(GitHub Pages, S3,
// Netlify 정적 사이트 등)에 올릴 수 있습니다.
const nextConfig: NextConfig = {
  output: "export",
  // 정적 export는 next/image의 서버 사이드 최적화 API를 쓸 수 없어서
  // unoptimized 로 두거나 커스텀 로더를 써야 합니다.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
