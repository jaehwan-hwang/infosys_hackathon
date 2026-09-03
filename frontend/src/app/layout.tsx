import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

/**
 * 로컬 웹폰트. 원본 TTF/OTF는 한 벌에 2.6MB라 한글 음절 범위로 서브셋한 woff2를 쓴다.
 * 서브셋 생성은 저장소 루트의 RiaSans/ · Freesentation/ 원본에서 뽑았다.
 */
const riaSans = localFont({
  src: "./fonts/RiaSans-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-riasans",
  display: "swap",
});

const freesentation = localFont({
  src: [
    { path: "./fonts/Freesentation-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Freesentation-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-freesentation",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "정보시스템학과 해커톤",
    template: "%s | 정보시스템학과 해커톤",
  },
  description:
    "한양대학교 정보시스템학과 학생회가 주최하는 2일간의 해커톤. Spark·Sprint·Summit 세 트랙으로 진행됩니다.",
  openGraph: {
    title: "정보시스템학과 해커톤",
    description: "Spark · Sprint · Summit — 세 트랙으로 진행되는 2일간의 해커톤",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="ko" className={`${riaSans.variable} ${freesentation.variable}`}>
      <body className="flex min-h-screen flex-col">
        {/* 키보드 사용자가 내비게이션을 건너뛸 수 있게 한다 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        <SessionProvider session={session}>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
