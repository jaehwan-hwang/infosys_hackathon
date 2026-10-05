"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "./form";
import { cx } from "./ui";

/**
 * 상단 메뉴.
 *
 * 트랙 자가진단은 랜딩 마지막 슬라이드에서만 들어가고, 거기서 팀 등록으로 이어진다.
 * 결과물 제출은 행사 당일에만 쓰는 화면이라 "팀"에서 떼어 따로 두었다.
 * 교수 평가는 "평가" 안에서 권한에 따라 갈리고, 리더보드는 평가 바로 옆에 둔다 —
 * 투표하고 나서 결과를 찾는 흐름이 자연스럽다.
 */
const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/team", label: "팀" },
  { href: "/submit", label: "결과물" },
  { href: "/evaluate", label: "평가" },
  { href: "/results", label: "리더보드" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // 랜딩은 히어로 안에 자체 내비를 갖고 있고, 스냅 컨테이너가 화면 전체를 써야 한다.
  if (pathname === "/") return null;

  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "PROFESSOR";

  // 운영진 메뉴는 운영진에게만 보인다. 주소를 직접 쳐서 들어오면 페이지가 막는다.
  const navItems = [
    ...NAV_ITEMS,
    ...(role === "ADMIN" ? [{ href: "/admin", label: "운영진" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-current/10 bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
        {/* 홈으로 돌아가는 입구. 눌렀을 때 화면이 갑자기 바뀌지 않도록
            app/template.tsx가 새 화면을 부드럽게 띄운다. */}
        <Link
          href="/"
          aria-label="홈으로"
          className="font-display text-lg tracking-[-0.02em] transition-opacity hover:opacity-60"
        >
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
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-grad-brand text-white"
                    : "text-muted hover:text-[var(--text)]",
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
                  <span className="ml-1.5 rounded-full border-2 border-brand-500/40 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-300">
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
            className="grid size-10 place-items-center rounded-full border-2 border-current/15 lg:hidden"
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
          className="border-t-2 border-current/10 bg-[var(--bg)] px-5 py-3 lg:hidden"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-full px-4 py-2.5 text-sm font-bold hover:bg-current/5"
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
