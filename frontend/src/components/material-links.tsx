import type { SubmissionLinks } from "@/lib/types";
import { cx } from "./ui";

/**
 * 팀이 낸 자료를 버튼으로 늘어놓는다. 낸 것만 — 비어 있는 항목은 버튼을 띄우지 않는다.
 *
 * 트랙마다 필수 제출물이 달라 팀마다 낸 것이 다르다. 평가 화면과 리더보드가 같이 쓴다.
 * 순서는 먼저 열어 볼 만한 것부터. 소스코드가 GitHub 주소면 "GitHub"이라고 적어,
 * 저장소로 간다는 걸 바로 알게 한다.
 */
export function materialsOf(t: SubmissionLinks): { label: string; url: string }[] {
  const items: { label: string; url: string | null }[] = [
    { label: "서비스 바로가기", url: t.deployUrl },
    { label: "시연 영상", url: t.demoUrl },
    { label: "프로토타입", url: t.prototypeUrl },
    {
      label: t.sourceCodeUrl && /github\.com/i.test(t.sourceCodeUrl) ? "GitHub" : "소스코드",
      url: t.sourceCodeUrl,
    },
    { label: "발표 자료", url: t.deckFileUrl },
    { label: "서비스 기획서", url: t.planFileUrl },
    { label: "시스템 아키텍처", url: t.architectureFileUrl },
    { label: "기술 명세서", url: t.techSpecFileUrl },
  ];
  return items.filter((m): m is { label: string; url: string } => Boolean(m.url?.trim()));
}

export function MaterialLinks({
  links,
  className,
  compact = false,
}: {
  links: SubmissionLinks;
  className?: string;
  /**
   * 리더보드처럼 좁은 칸에 담을 때. 버튼을 작게, 같은 폭으로 두고 한 줄에 넷까지 —
   * 가장 많이 내는 Summit(여덟 개)도 네 개씩 두 줄로 반듯하게 들어간다.
   */
  compact?: boolean;
}) {
  const items = materialsOf(links);
  if (items.length === 0) return null;
  return (
    <div
      className={cx(
        "flex flex-wrap",
        compact ? "mx-auto max-w-[30.25rem] gap-1.5" : "gap-2",
        className,
      )}
    >
      {items.map((m) => (
        <a
          key={m.label}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-current/15 font-bold hover:bg-current/5",
            compact ? "h-8 w-[7.25rem] justify-center px-2 text-[11px]" : "h-9 gap-1.5 px-4 text-xs",
          )}
        >
          {m.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
