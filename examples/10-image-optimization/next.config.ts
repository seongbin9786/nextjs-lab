import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js가 서빙할 포맷. 순서대로 협상하며, 브라우저가 지원하는
    // 첫 포맷을 줍니다. AVIF는 WebP보다 압축률이 좋지만 인코딩이 느립니다.
    formats: ["image/avif", "image/webp"],
    // Next 16 기본값 변화 참고:
    // - minimumCacheTTL: 60초 → 4시간(14400초)
    // - qualities: [1..100] → [75] (quality prop이 75로 보정됨)
  },
};

export default nextConfig;
