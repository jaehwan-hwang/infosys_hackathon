"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  // 랜딩은 마지막 Join 슬라이드가 푸터 역할을 한다
  if (pathname === "/") return null;

  return (
    <footer className="border-t-2 border-current/15">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl tracking-tight">정보시스템학과 해커톤</p>
            <p className="mt-1 text-sm text-muted">
              한양대학교 정보시스템학과 학생회 주최
            </p>
          </div>

          <nav aria-label="푸터 메뉴" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/team" className="text-muted hover:underline">
              팀
            </Link>
            <Link href="/submit" className="text-muted hover:underline">
              결과물
            </Link>
            <Link href="/evaluate" className="text-muted hover:underline">
              평가
            </Link>
            <Link href="/results" className="text-muted hover:underline">
              리더보드
            </Link>
            <Link href="/privacy" className="text-muted hover:underline">
              개인정보 처리방침
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-subtle">
          © {new Date().getFullYear()} 한양대학교 정보시스템학과 학생회
        </p>
      </div>
    </footer>
  );
}
