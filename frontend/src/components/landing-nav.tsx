"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";

/**
 * 랜딩 하단 내비게이션.
 *
 * 모양은 Bottom_bar_design.svg 그대로다 — 반투명 파란 알약 하나에 흰 글씨 다섯,
 * 칸을 나누는 선이나 상자는 없다. SVG로는 표현할 수 없는 유리 느낌(backdrop blur)만
 * CSS로 덧붙였다.
 *
 * 동작은 thehackathon.org를 따른다. 화면 하단에 떠 있고,
 * 지금 보고 있는 슬라이드를 스크롤 위치로 찾아 강조한다.
 */
export const LANDING_NAV = [
  { key: "about", label: "HACKATHON" },
  { key: "tracks", label: "TRACK" },
  { key: "schedule", label: "SCHEDULE" },
  { key: "professor", label: "PROFESSOR" },
  { key: "join", label: "REGISTER" },
] as const;

/**
 * 알약 배경. 모양은 Bottom_bar_design.svg 그대로 두고 색만 새 팔레트로 바꿨다.
 * web design.svg의 큰 원과 같은 그라데이션·같은 투명도라 배경과 한 벌로 보인다.
 */
const BAR_BG = "linear-gradient(180deg, rgba(17,122,175,0.55) 0%, rgba(43,53,186,0.55) 70.19%)";

/**
 * 글자 번짐. 원래 디자인의 흐림 2.5(=반지름 5)를 높이 44px에 맞춰 9px로 환산한 값.
 * 색은 새 팔레트의 가장 짙은 파랑으로 바꿨다.
 */
const LABEL_GLOW = "0 0 9px rgba(16,19,64,0.55)";

function scrollRoot() {
  return document.querySelector<HTMLElement>("[data-snap-root]");
}

export function LandingNav() {
  const [active, setActive] = useState<string>("about");

  useEffect(() => {
    const root = scrollRoot();
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-nav]"));

    let frame = 0;
    const update = () => {
      frame = 0;
      // 화면 가운데가 걸친 슬라이드가 지금 보고 있는 슬라이드다
      const mid = root.scrollTop + root.clientHeight / 2;
      const current = slides.find(
        (s) => s.offsetTop <= mid && mid < s.offsetTop + s.offsetHeight,
      );
      if (current?.dataset.nav) setActive(current.dataset.nav);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = (key: string) => {
    const root = scrollRoot();
    const target = root?.querySelector<HTMLElement>(`[data-nav="${key}"]`);
    if (!root || !target) return;
    root.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="섹션 이동"
      className="fixed inset-x-3 bottom-4 z-50 md:inset-x-auto md:bottom-7 md:left-1/2 md:-translate-x-1/2"
    >
      <ul
        className={cx(
          "flex items-center justify-between rounded-full",
          // 유리 느낌 — 뒤에 깔린 슬라이드를 흐리게 비친다
          "backdrop-blur-[14px] backdrop-saturate-150",
          "h-10 px-3 md:h-11 md:gap-[8px] md:px-[18px]",
        )}
        style={{ background: BAR_BG }}
      >
        {LANDING_NAV.map((item) => {
          const isActive = active === item.key;
          return (
            <li key={item.key} className="flex">
              <a
                href={`#${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.key);
                }}
                aria-current={isActive ? "true" : undefined}
                className={cx(
                  "flex items-center justify-center rounded-full font-bold whitespace-nowrap text-white",
                  "transition-colors",
                  // 좁은 화면에서는 영문 다섯 개가 알약을 넘치므로 폭에 따라 줄인다
                  "h-8 px-1 text-[clamp(9px,2.9vw,11px)] md:h-9 md:px-2 md:text-[15px]",
                  // 디자인 파일에는 선택 표시가 없지만, 지금 보는 위치를 잃지 않도록
                  // 유리 톤을 해치지 않는 선에서 옅게만 띄운다
                  isActive ? "bg-white/20" : "text-white/85 hover:text-white",
                )}
                style={{ textShadow: LABEL_GLOW }}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
