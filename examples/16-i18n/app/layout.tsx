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
  // 주의: 레이아웃은 자기 세그먼트까지의 params만 받습니다. 루트 레이아웃은
  // [locale]보다 위에 있으므로 locale은 항상 undefined이고, lang은 언제나
  // "ko"가 됩니다. 이 한계를 보여주기 위한 코드입니다. (README 동작 원리 4)
  const { locale } = await params;

  return (
    // 언어에 맞춰 <html lang>을 설정합니다. 접근성/SEO에 중요합니다.
    <html lang={locale && isLocale(locale) ? locale : "ko"}>
      <body>{children}</body>
    </html>
  );
}
