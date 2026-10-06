"use client";

import { AuthGate } from "@/components/auth-gate";
import { EvaluationBoard } from "@/components/evaluation-board";
import { PeriodGate } from "@/components/period-gate";
import { Spinner } from "@/components/ui";
import { publicApi } from "@/lib/api";
import { useApiQuery, useAuth } from "@/lib/use-auth";

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
  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);

  if (isLoading || eventQuery.loading) return <Spinner />;

  const votingOpen = eventQuery.data?.votingOpen;
  const anyOpen = votingOpen
    ? votingOpen.SPARK || votingOpen.SPRINT || votingOpen.SUMMIT
    : false;

  return (
    <PeriodGate
      open={anyOpen}
      title="평가"
      description="평가는 발표가 끝난 트랙부터 운영진이 순서대로 엽니다. 그때 이 화면에서 투표할 수 있습니다."
    >
      <EvaluationBoard evaluatorType={role === "PROFESSOR" ? "PROFESSOR" : "STUDENT"} />
    </PeriodGate>
  );
}
