import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: {
    default: "App Router 기본기 | nextjs-lab",
    template: "%s | App Router 기본기",
  },
  description:
    "파일 시스템 라우팅, layout, route group, template까지 App Router의 기본기를 배우는 예시",
};

// 루트 레이아웃: 모든 페이지가 이 <html>, <body>를 공유합니다.
// 서버 컴포넌트이므로 여기서 데이터를 가져와 자식에게 흘려보낼 수도 있습니다.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <TopNav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
