import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "병렬 라우트와 인터셉팅 라우트 | nextjs-lab",
    template: "%s | 병렬/인터셉팅 라우트",
  },
  description:
    "인터셉팅 라우트로 갤러리 위에 모달을 겹쳐 렌더링하는 예시",
};

// 병렬 라우트: 레이아웃이 여러 "슬롯"을 동시에 렌더링합니다.
// 여기서 children(갤러리)과 @modal(모달) 두 슬롯을 한 화면에 그립니다.
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
