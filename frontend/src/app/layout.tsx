import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

/**
 * 로컬 웹폰트.
 *
 * Inter는 첫 화면(히어로)에서만 쓴다. web design.svg의 조판을 그대로 옮기려고
 * static/의 Google Fonts 배포본을 라틴 범위로 서브셋해 woff2로 바꾼 것이다(한 벌 19KB).
 * Three Tracks 슬라이드부터 아래 페이지 전부는 원래대로 RiaSans Bold(큰 제목)와
 * Freesentation(본문)을 쓴다.
 *
 * 한글 글리프가 없는 Inter를 폰트 스택 앞에 두면 한글은 자동으로 Freesentation이 받는다.
 */
const riaSans = localFont({
  src: "./fonts/RiaSans-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-riasans",
  display: "swap",
});

const interDisplay = localFont({
  src: "./fonts/Inter-Display-Black.woff2",
  weight: "900",
  style: "normal",
  variable: "--font-inter-display",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "./fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
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
    { media: "(prefers-color-scheme: dark)", color: "#0a0d1c" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html
      lang="ko"
      className={`${riaSans.variable} ${inter.variable} ${interDisplay.variable} ${freesentation.variable}`}
    >
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
