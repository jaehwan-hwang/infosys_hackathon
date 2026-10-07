import { maskStudentId } from "@/lib/format";
import type { TeamMember } from "@/lib/types";
import { cx } from "@/components/ui";

/**
 * 팀원 한 줄 목록.
 *
 * 다른 팀 목록과 합치기 화면이 같은 모양을 쓴다 — 어느 팀과 합칠지 고르려면 누가
 * 있는 팀인지 보여야 하고, 두 화면에서 다르게 보이면 같은 팀인지 헷갈린다.
 *
 * 팀장과 팀원을 둘 다 적는다. 팀장에만 표시가 붙으면 나머지가 무엇인지 애매해 보인다.
 * 학번은 서버가 입학년도까지만 보내 준다.
 */
export function TeamMemberList({ members }: { members: TeamMember[] }) {
  const sorted = [...members].sort((a, b) => Number(b.role === "LEADER") - Number(a.role === "LEADER"));

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {sorted.map((m) => {
        const leader = m.role === "LEADER";
        return (
          <li key={m.teamMemberId} className="flex items-center gap-1.5">
            <span
              className={cx(
                "text-[10px] font-bold",
                leader ? "text-[var(--accent)]" : "text-subtle",
              )}
            >
              {leader ? "팀장" : "팀원"}
            </span>
            <span className="font-bold">{m.name}</span>
            {m.studentId && (
              <span className="text-subtle">{maskStudentId(m.studentId)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
