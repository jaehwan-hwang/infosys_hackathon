"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./ui";

/**
 * 슬라이드 내용이 화면 높이를 넘지 않게 하는 안전장치.
 *
 * 스냅 슬라이드는 한 장이 화면보다 높으면 그 안에서 스냅이 풀려 자유 스크롤이 되고,
 * "다음 장으로 넘어가다 중간에 멈추는" 증상이 생긴다. 글자 크기와 간격은 이미
 * 화면 높이(dvh)에 맞춰 줄어들지만, 아주 낮은 화면에서도 넘치지 않도록
 * 넘칠 때만 내용 전체를 비율 그대로 줄인다. 넘치지 않으면 아무것도 하지 않는다.
 */
export function SlideFit({ children, className }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;

    const fit = () => {
      const available = o.clientHeight;
      // transform은 레이아웃 높이를 바꾸지 않으므로 scrollHeight는 늘 원래 높이다
      const needed = i.scrollHeight;
      setScale(needed > available ? Math.max(0.6, available / needed) : 1);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className={cx("flex min-h-0 flex-1 items-center", className)}>
      <div
        ref={inner}
        data-slide-content
        className="w-full"
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "0 50%" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
