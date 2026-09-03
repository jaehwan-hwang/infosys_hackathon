"use client";

import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Button, Field, TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  Section,
  Spinner,
  TrackBadge,
  cx,
} from "@/components/ui";
import { api, downloadCsv } from "@/lib/api";
import { formatDateTime, formatScore, rankLabel } from "@/lib/format";
import { TRACK_LABEL } from "@/lib/track-rules";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { Track } from "@/lib/types";

const TRACKS: Track[] = ["SPARK", "SPRINT", "SUMMIT"];

type Tab = "overview" | "teams" | "results" | "staff";

export default function AdminPage() {
  return (
    <AuthGate requireRole={["ADMIN"]}>
      <AdminDashboard />
    </AuthGate>
  );
}

function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  const dashboardQuery = useApiQuery(
    token ? () => api.admin.getDashboard(token) : null,
    [token],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "현황" },
    { id: "teams", label: "팀 관리" },
    { id: "results", label: "집계" },
    { id: "staff", label: "권한" },
  ];

  return (
    <Section eyebrow="Admin" title="운영진 대시보드">
      <div
        role="tablist"
        aria-label="관리 메뉴"
        className="mb-8 flex gap-1 border-b border-[var(--border)]"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === t.id
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-muted hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Overview dashboard={dashboardQuery} />
      )}
      {tab === "teams" && <TeamsPanel />}
      {tab === "results" && <ResultsPanel />}
      {tab === "staff" && <StaffPanel />}
    </Section>
  );
}

function Overview({
  dashboard,
}: {
  dashboard: ReturnType<typeof useApiQuery<Awaited<ReturnType<typeof api.admin.getDashboard>>>>;
}) {
  const { token } = useAuth();

  const votingMutation = useApiMutation(async (track: Track, open: boolean) => {
    if (!token) throw new Error("no token");
    return api.admin.toggleVoting(token, track, open);
  });

  const publishMutation = useApiMutation(async (published: boolean) => {
    if (!token) throw new Error("no token");
    return api.admin.publishResults(token, published);
  });

  if (dashboard.loading) return <Spinner />;
  if (dashboard.error) return <Alert tone="error">{dashboard.error}</Alert>;
  const data = dashboard.data;
  if (!data) return null;

  const stats = [
    { label: "등록 팀", value: data.totalTeams },
    { label: "참가자", value: data.totalParticipants },
    { label: "제출물", value: data.totalSubmissions },
    { label: "교수 평가", value: data.professorVoteCount },
  ];

  return (
    <div className="space-y-8">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
              {stat.label}
            </dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums">{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <div>
        <h2 className="text-base font-bold">트랙별 현황</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRACKS.map((track) => (
            <Card key={track}>
              <TrackBadge track={track} />
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">등록 팀</dt>
                  <dd className="font-semibold tabular-nums">
                    {data.teamsByTrack[track] ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">제출 완료</dt>
                  <dd className="font-semibold tabular-nums">
                    {data.submissionsByTrack[track] ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">학생 투표</dt>
                  <dd className="font-semibold tabular-nums">
                    {data.studentVotesByTrack[track] ?? 0}건
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted">평가</span>
                  <Button
                    size="sm"
                    variant={data.votingOpen[track] ? "danger" : "primary"}
                    loading={votingMutation.pending}
                    onClick={async () => {
                      await votingMutation.run(track, !data.votingOpen[track]);
                      dashboard.reload();
                    }}
                  >
                    {data.votingOpen[track] ? "평가 닫기" : "평가 열기"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">결과 공개</h2>
            <p className="mt-1 text-sm text-muted">
              공개하면 참가자들이 <code>/results</code>에서 순위를 볼 수 있습니다. 시상식
              발표 직전에 켜주세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={data.resultsPublished ? "success" : "neutral"}>
              {data.resultsPublished ? "공개됨" : "비공개"}
            </Badge>
            <Button
              variant={data.resultsPublished ? "danger" : "primary"}
              loading={publishMutation.pending}
              onClick={async () => {
                await publishMutation.run(!data.resultsPublished);
                dashboard.reload();
              }}
            >
              {data.resultsPublished ? "다시 비공개로" : "결과 공개하기"}
            </Button>
          </div>
        </div>
      </Card>

      <ExportPanel />
    </div>
  );
}

function ExportPanel() {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const exports = [
    { kind: "participants" as const, label: "참가자 명단", description: "팀원 한 명이 한 행" },
    { kind: "submissions" as const, label: "제출 현황", description: "미제출 팀 포함" },
    { kind: "results" as const, label: "최종 순위표", description: "학생·교수 평균 포함" },
  ];

  const handleDownload = async (kind: "participants" | "submissions" | "results") => {
    if (!token) return;
    setBusy(kind);
    setError(null);
    try {
      await downloadCsv(token, kind);
    } catch {
      setError("내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <h2 className="text-base font-bold">데이터 내보내기</h2>
      <p className="mt-1 text-sm text-muted">
        Excel에서 바로 열 수 있는 UTF-8 CSV로 저장됩니다.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {exports.map((item) => (
          <Button
            key={item.kind}
            variant="secondary"
            loading={busy === item.kind}
            onClick={() => handleDownload(item.kind)}
            className="h-auto flex-col items-start py-3"
          >
            <span className="font-semibold">{item.label}</span>
            <span className="text-xs font-normal text-muted">{item.description}</span>
          </Button>
        ))}
      </div>

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

function TeamsPanel() {
  const { token } = useAuth();
  const teamsQuery = useApiQuery(token ? () => api.admin.getTeams(token) : null, [token]);
  const [filter, setFilter] = useState<Track | "ALL">("ALL");

  const trackMutation = useApiMutation(async (teamId: number, track: Track) => {
    if (!token) throw new Error("no token");
    return api.admin.overrideTrack(token, teamId, track, "운영진 수동 배정");
  });

  if (teamsQuery.loading) return <Spinner />;
  if (teamsQuery.error) return <Alert tone="error">{teamsQuery.error}</Alert>;

  const teams = (teamsQuery.data ?? []).filter(
    (t) => filter === "ALL" || t.track === filter,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", ...TRACKS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cx(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === t
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                : "border-[var(--border)] hover:bg-[var(--bg-muted)]",
            )}
          >
            {t === "ALL" ? "전체" : TRACK_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {teams.map((team) => (
          <Card key={team.teamId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <TrackBadge track={team.track} />
                  <span className="font-bold">{team.teamName}</span>
                  {team.submitted ? (
                    <Badge tone={team.submissionComplete ? "success" : "warning"}>
                      {team.submissionComplete ? "제출 완료" : "필수 항목 미충족"}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">미제출</Badge>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted">
                  조장 {team.leaderName} · {team.leaderEmail} · {team.memberCount}명
                </p>

                {team.trackReason && (
                  <p className="mt-1 text-xs text-subtle">배정 근거 — {team.trackReason}</p>
                )}

                {team.missingRequirements.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    누락 — {team.missingRequirements.join(", ")}
                  </p>
                )}

                {team.submittedAt && (
                  <p className="mt-1 text-xs text-subtle">
                    제출 {formatDateTime(team.submittedAt)}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <label className="sr-only" htmlFor={`track-${team.teamId}`}>
                  {team.teamName} 트랙 변경
                </label>
                <select
                  id={`track-${team.teamId}`}
                  value={team.track}
                  onChange={async (e) => {
                    await trackMutation.run(team.teamId, e.target.value as Track);
                    teamsQuery.reload();
                  }}
                  className="h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 text-sm"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {TRACK_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">해당하는 팀이 없습니다.</p>
      )}
    </div>
  );
}

function ResultsPanel() {
  const { token } = useAuth();
  const resultsQuery = useApiQuery(
    token ? () => api.admin.getResults(token) : null,
    [token],
  );

  if (resultsQuery.loading) return <Spinner />;
  if (resultsQuery.error) return <Alert tone="error">{resultsQuery.error}</Alert>;

  return (
    <div className="space-y-8">
      <Alert tone="info">
        이 집계는 운영진에게만 보입니다. 참가자 공개 여부는 &ldquo;현황&rdquo; 탭에서
        조절합니다.
      </Alert>

      {(resultsQuery.data ?? []).map((track) => (
        <div key={track.track}>
          <div className="flex flex-wrap items-center gap-3">
            <TrackBadge track={track.track} />
            <h2 className="font-bold">{TRACK_LABEL[track.track]} 순위</h2>
            <span className="text-xs text-subtle">{track.formula}</span>
          </div>

          {track.results.length === 0 ? (
            <p className="mt-3 text-sm text-muted">아직 집계할 팀이 없습니다.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-left">
                    <th scope="col" className="py-2.5 pr-3 font-semibold">순위</th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">팀</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">학생 평균</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">교수 평균</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">최종</th>
                  </tr>
                </thead>
                <tbody>
                  {track.results.map((r) => (
                    <tr key={r.teamId} className="border-b border-[var(--border)]">
                      <td className="py-2.5 pr-3 font-bold tabular-nums">
                        {rankLabel(r.rank)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{r.teamName}</span>
                        {r.projectName && (
                          <span className="ml-2 text-xs text-muted">{r.projectName}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted">
                        {formatScore(r.studentAverage)}
                        <span className="ml-1 text-xs">({r.studentVoterCount})</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted">
                        {track.track === "SUMMIT" ? (
                          <>
                            {formatScore(r.professorAverage)}
                            <span className="ml-1 text-xs">({r.professorVoterCount})</span>
                          </>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-bold tabular-nums">
                        {formatScore(r.finalScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StaffPanel() {
  const { token } = useAuth();
  const staffQuery = useApiQuery(token ? () => api.admin.getStaff(token) : null, [token]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"PROFESSOR" | "ADMIN">("PROFESSOR");

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.admin.updateStaffRole(token, email.trim().toLowerCase(), role);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run();
    if (result) {
      setEmail("");
      staffQuery.reload();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-bold">권한 부여</h2>
        <p className="mt-1 text-sm text-muted">
          아직 로그인하지 않은 이메일도 미리 등록할 수 있습니다. 해당 계정이 처음 로그인할 때
          권한이 적용됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="이메일" required>
              {(id) => (
                <TextInput
                  id={id}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professor@hanyang.ac.kr"
                  required
                />
              )}
            </Field>
          </div>

          <div>
            <label htmlFor="role-select" className="block text-sm font-medium">
              권한
            </label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as "PROFESSOR" | "ADMIN")}
              className="mt-1.5 h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 text-sm"
            >
              <option value="PROFESSOR">교수 (심사위원)</option>
              <option value="ADMIN">운영진</option>
            </select>
          </div>

          <Button type="submit" loading={pending}>
            부여하기
          </Button>
        </form>

        {error && (
          <div className="mt-3">
            <Alert tone="error">{error.message}</Alert>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-base font-bold">등록된 교수·운영진</h2>
        {staffQuery.loading ? (
          <Spinner />
        ) : (
          <ul className="mt-3 space-y-2">
            {(staffQuery.data ?? []).map((user) => (
              <li key={user.userId}>
                <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="ml-2 text-sm text-muted">{user.email}</span>
                  </div>
                  <Badge tone={user.role === "ADMIN" ? "danger" : "info"}>
                    {user.role === "ADMIN" ? "운영진" : "교수"}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
