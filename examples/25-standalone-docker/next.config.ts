import type { NextConfig } from "next";

// output: "standalone" 은 프로덕션 서버를 실행하는 데 필요한 최소한의
// 파일만 .next/standalone 에 묶어줍니다. node_modules 전체를 복사하지
// 않아도 되어 Docker 이미지가 크게 작아집니다.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
