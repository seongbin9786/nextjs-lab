import type { NextConfig } from "next";

// Cache Components를 켭니다. Next.js 16의 새 캐싱 모델입니다.
// 켜는 순간 기본 동작이 바뀝니다:
//  - 모든 페이지/라우트 핸들러는 "요청 시 실행"이 기본 (dynamic 기본)
//  - 캐싱은 "use cache" 지시어로 명시적으로 선택
//  - 기존 route segment config(dynamic, revalidate, fetchCache)는 사용 불가
const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
