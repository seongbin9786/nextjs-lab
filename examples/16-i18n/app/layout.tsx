import type { Metadata } from "next";
import "./globals.css";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "다국어 라우팅 | nextjs-lab",
    template: "%s | 다국어 라우팅",
  },
  description: "URL 기반 다국어(i18n) 라우팅 예시",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  // [locale] 세그먼트가 있을 때만 locale이 params로 넘어옵니다.
  const { locale } = await params;

  return (
    // 언어에 맞춰 <html lang>을 설정합니다. 접근성/SEO에 중요합니다.
    <html lang={locale && isLocale(locale) ? locale : "ko"}>
      <body>{children}</body>
    </html>
  );
}
