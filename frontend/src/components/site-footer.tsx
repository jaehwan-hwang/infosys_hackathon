"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  // 랜딩은 마지막 Join 슬라이드가 푸터 역할을 한다
  if (pathname === "/") return null;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold">정보시스템학과 해커톤</p>
            <p className="mt-1 text-sm text-muted">
              한양대학교 정보시스템학과 학생회 주최
            </p>
          </div>

          <nav aria-label="푸터 메뉴" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/self-check" className="text-muted hover:underline">
              트랙 자가진단
            </Link>
            <Link href="/register" className="text-muted hover:underline">
              팀 등록
            </Link>
            <Link href="/results" className="text-muted hover:underline">
              결과
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
