"use client";

import { useEffect, useState } from "react";
import { scrollRoot, scrollToSlide } from "@/lib/landing-scroll";
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
  { key: "prize", label: "PRIZE" },
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

  const go = (key: string) => scrollToSlide(`[data-nav="${key}"]`);

  return (
    // 화면 폭과 무관하게 가운데에 두고, 알약은 내용만큼만 넓어진다.
    // 예전에는 좁은 화면에서 좌우로 늘어나 글자가 양 끝에 흩어져 깨져 보였다.
    <nav
      aria-label="섹션 이동"
      // 아래 여백은 기기가 알려 주는 안전 영역(홈 바, 인앱 브라우저 하단 막대)보다
      // 항상 크게 둔다. 그냥 16px로 두면 그 막대에 깔려 아랫부분이 잘린다.
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 bottom-[max(1rem,env(safe-area-inset-bottom))] md:bottom-[max(1.75rem,env(safe-area-inset-bottom))]"
    >
      <ul
        className={cx(
          "pointer-events-auto flex max-w-full items-center rounded-full",
          // 유리 느낌 — 뒤에 깔린 슬라이드를 흐리게 비친다
          "backdrop-blur-[14px] backdrop-saturate-150",
          "h-10 gap-0.5 px-2 md:h-11 md:gap-[8px] md:px-[18px]",
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
                  "h-8 px-1.5 text-[clamp(8px,2.4vw,11px)] md:h-9 md:px-2 md:text-[15px]",
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
