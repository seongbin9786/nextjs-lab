import type { Metadata } from "next";
import "./globals.css";

// 루트 레이아웃의 metadata는 "기본값" 역할을 합니다.
export const metadata: Metadata = {
  metadataBase: new URL("https://nextjs-lab.example.com"),
  title: {
    // 하위 페이지가 title만 주면 이 템플릿에 끼워집니다.
    template: "%s | nextjs-lab 상점",
    default: "nextjs-lab 상점 | Metadata와 SEO",
  },
  description:
    "Next.js Metadata API로 SEO 메타태그를 관리하는 예시 상점입니다.",
  openGraph: {
    // 모든 페이지에 적용되는 OG 기본값. 페이지에서 덮어쓸 수 있습니다.
    siteName: "nextjs-lab 상점",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
