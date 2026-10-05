/**
 * 페이지 전환 효과.
 *
 * layout과 달리 template은 이동할 때마다 다시 마운트되므로, 여기에 등장 애니메이션을
 * 걸면 모든 화면 이동에 똑같이 적용된다. 로고를 눌러 홈으로 갈 때처럼 생김새가 크게
 * 달라지는 이동이 "뚝" 끊겨 보이던 문제를 없애기 위한 것이다.
 *
 * 움직임을 줄이도록 설정한 사용자에게는 globals.css의 reduced-motion 규칙이
 * 지속 시간을 0으로 만들어 바로 나타난다.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
