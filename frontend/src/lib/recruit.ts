import type { RecruitStatus } from "./types";

/**
 * 모집 상태 표시.
 *
 * 서로 찾는 것이 반대인 팀끼리 이어 주기 위한 표식이다 —
 * 팀원을 찾는 팀에게는 팀장을 찾는 쪽이, 팀장을 찾는 쪽에는 팀원을 찾는 팀이 보인다.
 * 서버(RecruitStatus.java)와 같은 뜻을 쓰므로 한쪽만 고치면 안 된다.
 */
export const RECRUIT_LABEL: Record<RecruitStatus, string> = {
  NONE: "모집 안 함",
  MEMBERS: "팀원 모집",
  LEADER: "팀장 모집",
};

export const RECRUIT_OPTIONS: {
  value: RecruitStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "NONE",
    label: "모집 안 함",
    description: "지금 인원 그대로 참가합니다.",
  },
  {
    value: "MEMBERS",
    label: "팀원 모집",
    description: "우리 팀에 들어올 팀원을 찾습니다. 팀장을 찾는 쪽에게 우리 팀이 보입니다.",
  },
  {
    value: "LEADER",
    label: "팀장 모집",
    description: "우리를 이끌어 줄 팀장이나 합류할 팀을 찾습니다. 팀원을 찾는 팀이 보입니다.",
  },
];

/** 이 상태인 팀이 찾아봐야 할 반대쪽 */
export function counterpart(status: RecruitStatus): RecruitStatus {
  if (status === "MEMBERS") return "LEADER";
  if (status === "LEADER") return "MEMBERS";
  return "NONE";
}
