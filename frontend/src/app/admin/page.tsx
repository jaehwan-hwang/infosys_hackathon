"use client";

import { useState } from "react";
import { AdminEventForm } from "@/components/admin-event-form";
import { AdminMergePanel } from "@/components/admin-merge-panel";
import { AdminParticipantsPanel } from "@/components/admin-participants-panel";
import { AdminSubmissionsPanel } from "@/components/admin-submissions-panel";
import { AuthGate } from "@/components/auth-gate";
import { Button, Field, TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  PillTabs,
  Section,
  Spinner,
  TrackBadge,
  TrackFilter,
  cx,
} from "@/components/ui";
import type { TrackFilterValue } from "@/components/ui";
import { api, downloadCsv } from "@/lib/api";
import { formatDateTime, formatScore, rankLabel } from "@/lib/format";
import { TRACK_LABEL } from "@/lib/track-rules";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { Track } from "@/lib/types";

const TRACKS: Track[] = ["SPARK", "SPRINT", "SUMMIT"];

type Tab =
  | "overview"
  | "teams"
  | "participants"
  | "submissions"
  | "merge"
  | "results"
  | "settings"
  | "staff";

export default function AdminPage() {
  return (
    <AuthGate requireRole={["ADMIN"]}>
      <AdminDashboard />
    </AuthGate>
  );
}

/**
 * 되돌리기 어려운 조작을 가리는 안내.
 *
 * 권한 부여, 평가 열기·닫기, 시상 공개, 팀 삭제는 한 번 누르면 수습이 어렵다.
 * 운영진 여럿이 같은 화면을 보므로 이 네 가지는 최고 관리자에게만 보인다.
 */
function SuperAdminOnly({ what }: { what: string }) {
  return (
    <p className="text-sm text-subtle">{what}는 최고 관리자만 할 수 있습니다.</p>
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
    { id: "participants", label: "참가자" },
    { id: "submissions", label: "제출물" },
    { id: "merge", label: "팀 합치기" },
    { id: "results", label: "집계" },
    { id: "settings", label: "행사 설정" },
    { id: "staff", label: "권한" },
  ];

  return (
    <Section eyebrow="Admin" title="운영진 대시보드">
      <div className="mb-8">
        <PillTabs<Tab>
          label="관리 메뉴"
          value={tab}
          onChange={setTab}
          items={tabs.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>

      {tab === "overview" && <Overview dashboard={dashboardQuery} onGoTo={setTab} />}
      {tab === "teams" && <TeamsPanel />}
      {tab === "participants" && <AdminParticipantsPanel />}
      {tab === "submissions" && <AdminSubmissionsPanel />}
      {tab === "merge" && <AdminMergePanel />}
      {tab === "results" && <ResultsPanel />}
      {tab === "settings" && <AdminEventForm />}
      {tab === "staff" && <StaffPanel />}
    </Section>
  );
}

function Overview({
  dashboard,
  onGoTo,
}: {
  dashboard: ReturnType<typeof useApiQuery<Awaited<ReturnType<typeof api.admin.getDashboard>>>>;
  /** 숫자를 누르면 그 내용이 있는 탭으로 보낸다 */
  onGoTo: (tab: Tab) => void;
}) {
  const { token, isSuperAdmin } = useAuth();

  const votingMutation = useApiMutation(async (track: Track, open: boolean) => {
    if (!token) throw new Error("no token");
    return api.admin.toggleVoting(token, track, open);
  });

  const dayMutation = useApiMutation(async (day: 1 | 2) => {
    if (!token) throw new Error("no token");
    return api.admin.openVotingForDay(token, day);
  });

  const publishMutation = useApiMutation(async (track: Track, published: boolean) => {
    if (!token) throw new Error("no token");
    return api.admin.publishResults(token, track, published);
  });

  if (dashboard.loading) return <Spinner />;
  if (dashboard.error) return <Alert tone="error">{dashboard.error}</Alert>;
  const data = dashboard.data;
  if (!data) return null;

  // 숫자만 보고 끝나는 일이 없다. 누르면 그 명단이 있는 탭으로 간다.
  const stats: { label: string; value: number; tab?: Tab }[] = [
    { label: "등록 팀", value: data.totalTeams, tab: "teams" },
    { label: "참가자", value: data.totalParticipants, tab: "participants" },
    { label: "제출물", value: data.totalSubmissions, tab: "submissions" },
    { label: "교수 평가", value: data.professorVoteCount, tab: "results" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => stat.tab && onGoTo(stat.tab)}
            disabled={!stat.tab}
            className={cx(
              "rounded-2xl border-2 border-current/15 bg-[var(--bg)] p-5 text-left transition-colors sm:p-6",
              stat.tab && "hover:border-brand-600 hover:bg-brand-600/5",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                {stat.label}
              </span>
              {stat.tab && (
                <span aria-hidden="true" className="text-subtle">
                  →
                </span>
              )}
            </span>
            <span className="font-display mt-1 block text-3xl tabular-nums">
              {stat.value}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <h2 className="text-base font-bold">일차별 평가 전환</h2>
        <p className="mt-1 text-sm text-muted">
          1일차에는 Spark만, 2일차에는 Sprint와 Summit만 열립니다. 2일차를 누르면 Spark
          평가는 자동으로 닫힙니다 — 1일차 발표를 보지 않은 사람이 Spark에 투표하는 일을
          막기 위한 것입니다. 발표가 끝난 뒤 눌러주세요.
        </p>
        {isSuperAdmin ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {([1, 2] as const).map((day) => (
              <Button
                key={day}
                variant="secondary"
                loading={dayMutation.pending}
                onClick={async () => {
                  await dayMutation.run(day);
                  dashboard.reload();
                }}
              >
                {day}일차 평가 열기
              </Button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <SuperAdminOnly what="평가 열기" />
          </div>
        )}
        {dayMutation.error && (
          <div className="mt-3">
            <Alert tone="error">{dayMutation.error.message}</Alert>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-base font-bold">트랙별 현황</h2>
        <p className="mt-1 text-sm text-muted">
          트랙 하나만 따로 열고 닫아야 할 때 씁니다.
        </p>
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

              <div className="mt-4 space-y-2 border-t-2 border-current/10 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted">평가</span>
                  {isSuperAdmin ? (
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
                  ) : (
                    <Badge tone={data.votingOpen[track] ? "success" : "neutral"}>
                      {data.votingOpen[track] ? "열림" : "닫힘"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted">리더보드</span>
                  {isSuperAdmin ? (
                    <Button
                      size="sm"
                      variant={data.resultsPublished[track] ? "danger" : "primary"}
                      loading={publishMutation.pending}
                      onClick={async () => {
                        await publishMutation.run(track, !data.resultsPublished[track]);
                        dashboard.reload();
                      }}
                    >
                      {data.resultsPublished[track] ? "다시 비공개" : "시상 공개"}
                    </Button>
                  ) : (
                    <Badge tone={data.resultsPublished[track] ? "success" : "neutral"}>
                      {data.resultsPublished[track] ? "공개됨" : "비공개"}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <h2 className="text-base font-bold">리더보드 공개</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          트랙별 <strong>시상 공개</strong>를 누르면 그 트랙의 수상 팀이{" "}
          <code>/results</code>에 올라갑니다. 시상 순서대로 하나씩 눌러 주세요 — Spark는
          1일차, Sprint와 Summit은 2일차입니다. 참가자에게는 <strong>등수와 팀 이름만</strong>{" "}
          보이고 점수는 공개되지 않습니다. 수상 등수는 Spark 1등, Sprint·Summit 3등까지입니다.
        </p>
        <p className="mt-2 text-sm text-muted">
          팀에 &ldquo;대상&rdquo; 같은 수상명을 붙이려면 집계 탭에서 확인한 뒤 등록하세요.
        </p>
        {publishMutation.error && (
          <div className="mt-3">
            <Alert tone="error">{publishMutation.error.message}</Alert>
          </div>
        )}
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
    { kind: "goods" as const, label: "굿즈 신청", description: "품목별 수량과 예상 금액" },
  ];

  const handleDownload = async (
    kind: "participants" | "submissions" | "results" | "goods",
  ) => {
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
        Excel에서 바로 열 수 있는 UTF-8 CSV로 저장됩니다. 참가자 명단에는 전화번호와
        학생회비·참가비가 함께 들어갑니다.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
  const { token, isSuperAdmin } = useAuth();
  const teamsQuery = useApiQuery(token ? () => api.admin.getTeams(token) : null, [token]);
  const [filter, setFilter] = useState<TrackFilterValue>("ALL");

  const trackMutation = useApiMutation(async (teamId: number, track: Track) => {
    if (!token) throw new Error("no token");
    return api.admin.overrideTrack(token, teamId, track, "운영진 수동 배정");
  });

  // 되돌릴 수 없는 작업이라 한 번 더 누르게 한다
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const deleteMutation = useApiMutation(async (teamId: number) => {
    if (!token) throw new Error("no token");
    return api.admin.deleteTeam(token, teamId);
  });

  if (teamsQuery.loading) return <Spinner />;
  if (teamsQuery.error) return <Alert tone="error">{teamsQuery.error}</Alert>;

  const teams = (teamsQuery.data ?? []).filter(
    (t) => filter === "ALL" || t.track === filter,
  );

  return (
    <div>
      <div className="mb-5">
        <TrackFilter value={filter} onChange={setFilter} />
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
                  className="h-9 rounded-full border-2 border-current/15 bg-[var(--bg)] px-3 text-sm font-bold"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {TRACK_LABEL[t]}
                    </option>
                  ))}
                </select>

                {isSuperAdmin &&
                  (confirmingId === team.teamId ? (
                    <>
                      <Button
                        variant="secondary"
                        className="h-9 px-3 text-sm"
                        onClick={() => setConfirmingId(null)}
                      >
                        취소
                      </Button>
                      <Button
                        className="h-9 bg-red-600 px-3 text-sm hover:bg-red-700"
                        loading={deleteMutation.pending}
                        onClick={async () => {
                          await deleteMutation.run(team.teamId);
                          setConfirmingId(null);
                          teamsQuery.reload();
                        }}
                      >
                        정말 삭제
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      className="h-9 px-3 text-sm text-red-600"
                      onClick={() => setConfirmingId(team.teamId)}
                    >
                      삭제
                    </Button>
                  ))}
              </div>
            </div>

            {confirmingId === team.teamId && (
              <p className="mt-3 text-xs text-amber-600">
                {team.teamName} 팀과 이 팀의 제출물·받은 평가·수상 기록이 모두 지워집니다.
                되돌릴 수 없습니다. 팀원 계정 자체는 남습니다.
              </p>
            )}

            {deleteMutation.error && confirmingId === team.teamId && (
              <p className="mt-2 text-xs text-red-600">{deleteMutation.error.message}</p>
            )}
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
                  <tr className="border-b-2 border-current/25 text-left">
                    <th scope="col" className="py-2.5 pr-3 font-bold">순위</th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">팀</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">학생 평균</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">교수 평균</th>
                    <th scope="col" className="py-2.5 pr-3 text-right font-semibold">최종</th>
                  </tr>
                </thead>
                <tbody>
                  {track.results.map((r) => (
                    <tr key={r.teamId} className="border-b border-current/10">
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
  const { token, isSuperAdmin } = useAuth();
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
        {!isSuperAdmin && (
          <div className="mt-3">
            <SuperAdminOnly what="권한 부여" />
          </div>
        )}

        {isSuperAdmin && (
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
              className="mt-1.5 h-11 rounded-xl border-2 border-current/15 bg-[var(--bg)] px-3 text-sm"
            >
              <option value="PROFESSOR">교수 (심사위원)</option>
              <option value="ADMIN">운영진</option>
            </select>
          </div>

          <Button type="submit" loading={pending}>
            부여하기
          </Button>
        </form>
        )}

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
                  <Badge
                    tone={
                      user.superAdmin ? "danger" : user.role === "ADMIN" ? "warning" : "info"
                    }
                  >
                    {user.roleLabel}
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
