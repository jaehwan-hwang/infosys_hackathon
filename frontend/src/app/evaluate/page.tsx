import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { EvaluationBoard } from "@/components/evaluation-board";

export const metadata: Metadata = { title: "팀 평가" };

/**
 * 학생 투표.
 * 평가 개방 여부·자기 팀 제외·트랙 일치는 모두 서버가 판정하며,
 * 여기서는 결과에 따른 안내만 보여준다.
 */
export default function EvaluatePage() {
  return (
    <AuthGate>
      <EvaluationBoard evaluatorType="STUDENT" />
    </AuthGate>
  );
}
