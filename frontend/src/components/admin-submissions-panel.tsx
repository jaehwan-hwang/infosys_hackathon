"use client";

import { useMemo, useState } from "react";
import { TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Spinner,
  TrackBadge,
  TrackFilter,
} from "@/components/ui";
import type { TrackFilterValue } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { TRACK_LABEL } from "@/lib/track-rules";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import type { Submission, TeamAdmin } from "@/lib/types";

/**
 * 제출물 현황.
 *
 * 아직 내지 않은 팀도 함께 보여 준다 — 마감 직전에 알아야 하는 것은 들어온 것보다
 * 비어 있는 쪽이다. 제출한 팀은 링크를 눌러 바로 열어 볼 수 있다.
 */
export function AdminSubmissionsPanel() {
  const { token } = useAuth();
  const submissionsQuery = useApiQuery(
    token ? () => api.admin.getSubmissions(token) : null,
    [token],
  );
  const teamsQuery = useApiQuery(token ? () => api.admin.getTeams(token) : null, [token]);

  const [track, setTrack] = useState<TrackFilterValue>("ALL");
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const rows = useMemo(() => {
    const byTeam = new Map<number, Submission>();
    (submissionsQuery.data ?? []).forEach((s) => byTeam.set(s.teamId, s));

    const q = query.trim().toLowerCase();
    return (teamsQuery.data ?? [])
      .map((team) => ({ team, submission: byTeam.get(team.teamId) ?? null }))
      .filter(({ team }) => track === "ALL" || team.track === track)
      .filter(({ submission }) => !onlyMissing || submission === null)
      .filter(
        ({ team, submission }) =>
          !q ||
          team.teamName.toLowerCase().includes(q) ||
          (submission?.projectName ?? "").toLowerCase().includes(q),
      );
  }, [submissionsQuery.data, teamsQuery.data, track, query, onlyMissing]);

  if (submissionsQuery.loading || teamsQuery.loading) return <Spinner />;
  if (submissionsQuery.error) return <Alert tone="error">{submissionsQuery.error}</Alert>;

  const total = teamsQuery.data?.length ?? 0;
  const submitted = submissionsQuery.data?.length ?? 0;

  return (
    <div>
      <TrackFilter value={track} onChange={setTrack} />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor="submission-search" className="sr-only">
            제출물 검색
          </label>
          <TextInput
            id="submission-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="팀명 또는 프로젝트명으로 검색"
            className="rounded-full"
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          미제출만 보기
        </label>
      </div>

      <p className="mt-3 text-sm text-muted">
        제출 {submitted} / 전체 {total}팀
        {track !== "ALL" && ` · ${TRACK_LABEL[track]} 트랙`}
      </p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="해당하는 팀이 없습니다" />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map(({ team, submission }) => (
            <li key={team.teamId}>
              <SubmissionCard team={team} submission={submission} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubmissionCard({
  team,
  submission,
}: {
  team: TeamAdmin;
  submission: Submission | null;
}) {
  const links: { label: string; url: string | null }[] = submission
    ? [
        { label: "프로덕트", url: submission.deployUrl },
        { label: "소스코드", url: submission.sourceCodeUrl },
        { label: "발표 자료", url: submission.deckFileUrl },
        { label: "프로토타입", url: submission.prototypeUrl },
        { label: "시연", url: submission.demoUrl },
        { label: "기획서", url: submission.planFileUrl },
        { label: "아키텍처", url: submission.architectureFileUrl },
        { label: "기술 명세서", url: submission.techSpecFileUrl },
      ].filter((l) => l.url)
    : [];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display mr-1 text-lg tracking-tight">{team.teamName}</span>
            <TrackBadge track={team.track} />
            {submission ? (
              <Badge tone={submission.complete ? "success" : "warning"}>
                {submission.complete ? "제출 완료" : "필수 항목 미충족"}
              </Badge>
            ) : (
              <Badge tone="neutral">미제출</Badge>
            )}
          </div>

          {submission && (
            <>
              <p className="mt-2 text-sm font-bold">{submission.projectName}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                {submission.summary}
              </p>
              {submission.missingRequirements.length > 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  누락 — {submission.missingRequirements.join(", ")}
                </p>
              )}
            </>
          )}
        </div>

        {submission && (
          <span className="shrink-0 text-xs text-subtle">
            {formatDateTime(submission.submittedAt)}
          </span>
        )}
      </div>

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-current/10 pt-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border-2 border-current/15 px-4 text-xs font-bold hover:bg-current/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
