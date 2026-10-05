"use client";

import { scrollToSlide } from "@/lib/landing-scroll";

/**
 * 홈 "Three Tracks" 슬라이드의 세 칸.
 *
 * 목록을 읽고 궁금한 트랙을 눌러 바로 그 슬라이드로 넘어갈 수 있게 한다.
 * 스크롤 컨테이너를 직접 움직여야 하므로 클라이언트 컴포넌트다.
 */
export interface TrackJumpItem {
  num: string;
  name: string;
  sub: string;
}

export function TrackJumpList({ items }: { items: readonly TrackJumpItem[] }) {
  return (
    <div className="mt-[min(36px,4dvh)] grid gap-5 sm:grid-cols-3 sm:gap-8 lg:gap-14">
      {items.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => scrollToSlide(`[data-slide="${t.name}"]`)}
          aria-label={`${t.name} 트랙 자세히 보기`}
          className="group -m-2 rounded-2xl p-2 text-left transition-opacity hover:opacity-70 focus-visible:opacity-70"
        >
          <p className="text-[12px] font-bold tracking-[0.2em] opacity-45 lg:text-[15px]">
            {t.num}
          </p>
          {/* sm 3단 칸 폭에서 6글자(SPRINT)가 넘치지 않는 크기. RiaSans 6글자 폭 = 5.747 × 글자크기 */}
          <p className="font-display mt-1 text-[34px] tracking-tight sm:mt-2 sm:text-[clamp(1.5rem,min(3.4vw,6dvh),2.875rem)]">
            {t.name}
          </p>
          <p className="mt-0.5 text-[15px] opacity-65 sm:mt-1 lg:text-[17px]">{t.sub}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold opacity-55 lg:text-[14px]">
            자세히 보기
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </p>
        </button>
      ))}
    </div>
  );
}
