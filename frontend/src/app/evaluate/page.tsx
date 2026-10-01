"use client";

import { AuthGate } from "@/components/auth-gate";
import { EvaluationBoard } from "@/components/evaluation-board";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/use-auth";

/**
 * 평가 화면 하나로 통합했다.
 *
 * 교수 계정이면 Summit 교수 평가, 그 밖에는 참가자 투표가 열린다.
 * 평가 개방 여부·자기 팀 제외·트랙 일치는 모두 서버가 판정하고,
 * 여기서는 그 결과에 따른 안내만 보여준다.
 */
export default function EvaluatePage() {
  return (
    <AuthGate>
      <EvaluateContent />
    </AuthGate>
  );
}

function EvaluateContent() {
  const { role, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return <EvaluationBoard evaluatorType={role === "PROFESSOR" ? "PROFESSOR" : "STUDENT"} />;
}
