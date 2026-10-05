/**
 * 랜딩 슬라이드 사이 이동.
 *
 * 랜딩은 window가 아니라 [data-snap-root] 요소가 스크롤 컨테이너다. 그래서
 * 앵커(#id)나 scrollIntoView로는 스냅이 어긋나고, 컨테이너를 직접 움직여야 한다.
 * 하단 내비와 트랙 목록이 같은 함수를 쓴다.
 */
export function scrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-snap-root]");
}

export function scrollToSlide(selector: string) {
  const root = scrollRoot();
  const target = root?.querySelector<HTMLElement>(selector);
  if (!root || !target) return;
  root.scrollTo({ top: target.offsetTop, behavior: "smooth" });
}
