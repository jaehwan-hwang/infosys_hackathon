import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { EvaluationBoard } from "@/components/evaluation-board";

export const metadata: Metadata = { title: "교수 평가" };

/**
 * Summit 트랙 교수 평가.
 * 화면 접근은 AuthGate가, 실제 차단은 백엔드의 ROLE_PROFESSOR 검사가 담당한다.
 */
export default function ProfessorEvaluatePage() {
  return (
    <AuthGate requireRole={["PROFESSOR", "ADMIN"]}>
      <EvaluationBoard evaluatorType="PROFESSOR" />
    </AuthGate>
  );
}
