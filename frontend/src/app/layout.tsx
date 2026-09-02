import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

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
    <html lang="ko">
      <body className="flex min-h-screen flex-col">
        {/* 키보드 사용자가 내비게이션을 건너뛸 수 있게 한다 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-crimson-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
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
