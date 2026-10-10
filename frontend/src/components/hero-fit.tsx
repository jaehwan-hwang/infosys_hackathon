"use client";

import { useEffect } from "react";

/**
 * 첫 화면 제목이 단 너비를 넘지 않게 하는 안전장치.
 *
 * 제목 크기는 "Inter Display Black에서 HACKATHON의 폭은 글자 크기의 6.22배"라는
 * 실측값으로 단을 꽉 채우게 짜여 있다. 디자인 파일에서 제목이 단 끝까지 가기 때문인데,
 * 그 대가로 여백이 0이다. 조금이라도 넓게 그려지는 순간 마지막 글자가 잘리고, 첫 줄
 * (INFOSYS)이 길어지면서 오른쪽 사자와 겹친다.
 *
 * 실제로 그런 일이 일어난다. 그 글꼴이 도착하기 전까지는 대체 글꼴로 그리는데, 재 보면
 * 6%쯤 넓다. 느린 기기나 인앱 브라우저에서는 그 상태가 눈에 보일 만큼 오래 간다.
 *
 * 그래서 넘칠 때만 비율을 깎는다. 제 글꼴로 그려지면 1이라 디자인 그대로다.
 * 값을 html에 두는 이유는 제목이 두 벌이기 때문이다 — 바탕 한 벌과 원 모양으로 오려낼
 * 덧판 한 벌이 한 픽셀도 어긋나면 안 되므로, 둘이 같은 값을 보게 한다.
 */
const VAR = "--hero-fit";

export function HeroFit() {
  useEffect(() => {
    const html = document.documentElement;

    const fit = () => {
      const lines = document.querySelectorAll<HTMLElement>("[data-headline-line]");
      if (lines.length === 0) return;

      // 재기 전에 1로 되돌린다. 깎은 상태에서 재면 "넘치지 않는다"만 나와,
      // 글꼴이 늦게 도착해 넓어져도 되돌아갈 길이 없다.
      html.style.setProperty(VAR, "1");

      let ratio = 1;
      lines.forEach((line) => {
        const available = line.clientWidth;
        // 한 줄로 고정돼 있어 넘치면 scrollWidth가 글자 전체 폭을 돌려준다
        const needed = line.scrollWidth;
        if (available > 0 && needed > available) {
          ratio = Math.min(ratio, available / needed);
        }
      });

      html.style.setProperty(VAR, String(ratio));
    };

    fit();

    // 글꼴이 늦게 도착하면 폭이 달라진다. 도착한 뒤 한 번 더 잰다.
    document.fonts?.ready.then(fit).catch(() => {});

    const first = document.querySelector("[data-headline-line]");
    const observer = new ResizeObserver(fit);
    if (first) observer.observe(first);
    return () => {
      observer.disconnect();
      html.style.removeProperty(VAR);
    };
  }, []);

  return null;
}
