"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth-gate";
import { SubmissionPanel } from "@/components/submission-panel";
import { Alert, EmptyState, Section, Spinner } from "@/components/ui";
import { api, publicApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useApiQuery, useAuth } from "@/lib/use-auth";

/**
 * 결과물 제출.
 *
 * 신청은 한 달 전부터 받지만 제출 폼은 행사 당일에만 열린다. 그 전에 들어오면
 * 언제 열리는지만 알려 준다 — 빈 폼을 띄워 두면 미리 내도 되는 줄 안다.
 */
export default function SubmitPage() {
  return (
    <AuthGate>
      <SubmitContent />
    </AuthGate>
  );
}

function SubmitContent() {
  const { token, user } = useAuth();

  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);
  const teamQuery = useApiQuery(token ? () => api.getMyTeam(token) : null, [token]);
  const submissionQuery = useApiQuery(
    token ? () => api.getMySubmission(token) : null,
    [token],
  );

  if (teamQuery.loading || eventQuery.loading) return <Spinner />;
  if (teamQuery.error) return <Alert tone="error">{teamQuery.error}</Alert>;

  const event = eventQuery.data;
  const team = teamQuery.data;

  if (!team) {
    return (
      <Section eyebrow="Submission" title="결과물 제출">
        <EmptyState
          title="먼저 팀을 등록해 주세요"
          description="결과물은 팀 단위로 제출합니다."
          action={
            <Link
              href="/team"
              className="bg-grad-brand inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              팀 등록하러 가기
            </Link>
          }
        />
      </Section>
    );
  }

  // 아직 제출이 열리지 않았으면 폼 대신 안내만 보여준다
  if (event?.beforeSubmissionOpen) {
    return (
      <Section eyebrow="Submission" title="결과물 제출">
        <EmptyState
          title="결과물 제출은 행사 당일에 열립니다"
          description={
            event.submitOpensAt
              ? `${formatDateTime(event.submitOpensAt)}부터 이 화면에서 제출할 수 있습니다.`
              : "행사 당일 이 화면에서 제출할 수 있습니다."
          }
          action={
            <Link
              href="/team"
              className="inline-flex h-11 items-center justify-center rounded-full border-2 border-current/15 px-6 text-sm font-bold transition-colors hover:bg-current/5"
            >
              우리 팀 보기
            </Link>
          }
        />
      </Section>
    );
  }

  const canManage =
    String(team.leaderId) === user?.id ||
    team.members.some(
      (m) => m.role === "LEADER" && m.userId !== null && String(m.userId) === user?.id,
    );

  if (!canManage) {
    return (
      <Section eyebrow="Submission" title="결과물 제출">
        <Alert tone="info" title="결과물 제출은 팀장이 합니다">
          {team.members.find((m) => m.role === "LEADER")?.name ?? "팀장"}님 또는 팀을 등록한
          분이 제출합니다.
        </Alert>
      </Section>
    );
  }

  if (submissionQuery.loading) return <Spinner label="제출 현황 불러오는 중" />;

  return (
    <SubmissionPanel
      team={team}
      event={event}
      existing={submissionQuery.data ?? null}
      onSaved={submissionQuery.reload}
    />
  );
}
