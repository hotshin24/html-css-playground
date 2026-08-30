import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTML/CSS 학습 플레이그라운드",
  description:
    "시안을 보고 직접 HTML/CSS를 작성하며 시맨틱 마크업과 레이아웃 구현을 훈련하는 학습 도구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex h-full flex-col overflow-hidden">{children}</body>
    </html>
  );
}
