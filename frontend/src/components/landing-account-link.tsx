"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import { cx } from "./ui";

/**
 * 랜딩 오른쪽 위에 뜨는 내 자리 바로가기.
 *
 * 랜딩에는 상단 메뉴가 없다. 디자인을 그대로 살리려고 감췄는데, 이미 등록을 마친
 * 사람이 사이트를 다시 열면 홈만 보이고 우리 팀으로 갈 길이 맨 아래 슬라이드까지
 * 내려가야 나온다. 로그인한 사람에게만 작은 알약 하나를 띄워 바로 들어가게 한다.
 *
 * 로그인하지 않았으면 아무것도 그리지 않는다 — 처음 온 사람에게는 첫 화면이
 * 디자인 그대로여야 한다.
 */
const BAR_BG = "linear-gradient(180deg, rgba(17,122,175,0.55) 0%, rgba(43,53,186,0.55) 70.19%)";
const LABEL_GLOW = "0 0 9px rgba(16,19,64,0.55)";

export function LandingAccountLink() {
  const { status } = useSession();
  const { token, isStaff, role } = useAuth();

  // 팀이 있으면 "우리 팀", 없으면 "팀 등록"으로 보낸다.
  // 로그인한 사람만 부르므로 처음 온 사람에게는 요청이 나가지 않는다.
  const teamQuery = useApiQuery(
    token ? (signal) => api.getMyTeam(token, signal) : null,
    [token],
  );

  if (status !== "authenticated") return null;

  // 운영진·교수는 팀을 만들 수 없으므로 "등록하기"로 부르면 안 된다
  const staff = isStaff || role === "PROFESSOR";
  const shortcut = staff || Boolean(teamQuery.data);

  return (
    <Link
      href="/team"
      className={cx(
        // 좁은 화면에서는 제목과 겹치지 않도록 작게 줄인다.
        // 오른쪽 여백은 스크롤 막대가 서는 화면에서 붙어 보이지 않을 만큼 띄운다.
        "fixed right-7 top-4 z-50 inline-flex items-center rounded-full",
        "h-8 px-3 text-[11px] font-bold whitespace-nowrap text-white",
        "sm:h-10 sm:px-4 sm:text-[13px] md:right-12 md:top-8 md:h-11 md:px-5 md:text-[15px]",
        "backdrop-blur-[14px] backdrop-saturate-150 transition-opacity hover:opacity-90",
      )}
      style={{ background: BAR_BG, textShadow: LABEL_GLOW }}
    >
      {shortcut ? "팀 바로가기" : "팀 등록하기"}
    </Link>
  );
}
