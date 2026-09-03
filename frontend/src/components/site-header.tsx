"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "./form";
import { cx } from "./ui";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/self-check", label: "트랙 자가진단" },
  { href: "/register", label: "팀 등록" },
  { href: "/submit", label: "산출물 제출" },
  { href: "/evaluate", label: "평가" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "PROFESSOR";

  // 교수·운영진 전용 링크는 해당 권한일 때만 노출한다.
  // (실제 접근 차단은 각 페이지와 백엔드가 담당한다)
  const navItems = [
    ...NAV_ITEMS,
    ...(role === "PROFESSOR" || role === "ADMIN"
      ? [{ href: "/evaluate/professor", label: "교수 평가" }]
      : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "운영진" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
        <Link href="/" className="font-display text-base tracking-tight text-brand-600">
          IS HACKATHON
        </Link>

        <nav aria-label="주요 메뉴" className="ml-auto hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                    : "text-muted hover:bg-[var(--bg-muted)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {status === "loading" ? (
            <span className="size-8 animate-pulse rounded-full bg-[var(--bg-muted)]" />
          ) : session?.user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">
                {session.user.name}
                {isStaff && (
                  <span className="ml-1.5 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {role === "ADMIN" ? "운영진" : "교수"}
                  </span>
                )}
              </span>
              <Button variant="secondary" size="sm" onClick={() => signOut()}>
                로그아웃
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => signIn("google")}>
              로그인
            </Button>
          )}

          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg hover:bg-[var(--bg-muted)] lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M2 4.5h14M2 9h14M2 13.5h14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="모바일 메뉴"
          className="border-t border-[var(--border)] bg-[var(--bg)] px-5 py-3 lg:hidden"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--bg-muted)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
