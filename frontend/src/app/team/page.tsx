"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { SubmissionPanel } from "@/components/submission-panel";
import { TeamRegisterForm } from "@/components/team-register-form";
import { TeamEditForm } from "@/components/team-edit-form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Section,
  Spinner,
  TrackBadge,
  cx,
  trackStyle,
} from "@/components/ui";
import { TextInput } from "@/components/form";
import { api, publicApi } from "@/lib/api";
import { TRACK_TAGLINE } from "@/lib/track-rules";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import type { Team, Track } from "@/lib/types";

/**
 * "팀" 화면.
 *
 * 팀이 없으면 등록 폼, 있으면 우리 팀과 다른 팀을 탭으로 보여준다.
 * 우리 팀 탭 안에서 팀 정보 수정과 결과물 제출까지 끝난다 — 따로 페이지를 두지 않는다.
 */
export default function TeamPage() {
  return (
    <AuthGate>
      <Suspense fallback={<Spinner />}>
        <TeamContent />
      </Suspense>
    </AuthGate>
  );
}

function TeamContent() {
  const { token } = useAuth();
  const params = useSearchParams();

  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);
  const teamQuery = useApiQuery(token ? () => api.getMyTeam(token) : null, [token]);

  if (teamQuery.loading || eventQuery.loading) return <Spinner />;
  if (teamQuery.error) return <Alert tone="error">{teamQuery.error}</Alert>;

  const event = eventQuery.data;

  if (!teamQuery.data) {
    if (event && !event.registrationOpen) {
      return (
        <Section title="팀 등록">
          <Alert tone="warning" title="참가 신청 기간이 아닙니다">
            현재는 팀 등록을 받고 있지 않습니다. 신청 기간은 홈에서 확인할 수 있습니다.
          </Alert>
        </Section>
      );
    }

    // 자가진단에서 넘어왔으면 추천 트랙이 미리 선택된다
    const suggested = params.get("track");
    const initialTrack: Track =
      suggested === "SPARK" || suggested === "SPRINT" || suggested === "SUMMIT"
        ? suggested
        : "SPARK";

    return (
      <TeamRegisterForm
        initialTrack={initialTrack}
        fromSelfCheck={suggested !== null}
        minTeamSize={event?.minTeamSize ?? 1}
        maxTeamSize={event?.maxTeamSize ?? 5}
        onRegistered={teamQuery.reload}
      />
    );
  }

  return (
    <RegisteredView
      team={teamQuery.data}
      registrationOpen={event?.registrationOpen ?? false}
      onTeamChanged={teamQuery.reload}
    />
  );
}

type Tab = "mine" | "others";

function RegisteredView({
  team,
  registrationOpen,
  onTeamChanged,
}: {
  team: Team;
  registrationOpen: boolean;
  onTeamChanged: () => void;
}) {
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <Section eyebrow="Team" title="팀">
      <div
        role="tablist"
        aria-label="팀 보기"
        className="mb-7 inline-flex rounded-xl border border-[var(--border)] p-1"
      >
        {(
          [
            ["mine", "우리 팀"],
            ["others", "다른 팀"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cx(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              tab === key
                ? "bg-brand-600 text-white"
                : "text-muted hover:bg-[var(--bg-muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <MyTeamTab
          team={team}
          registrationOpen={registrationOpen}
          onTeamChanged={onTeamChanged}
        />
      ) : (
        <OtherTeamsTab myTeamId={team.teamId} />
      )}
    </Section>
  );
}

function MyTeamTab({
  team,
  registrationOpen,
  onTeamChanged,
}: {
  team: Team;
  registrationOpen: boolean;
  onTeamChanged: () => void;
}) {
  const { token, user } = useAuth();
  const isLeader = String(team.leaderId) === user?.id;

  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);
  const submissionQuery = useApiQuery(
    token ? () => api.getMySubmission(token) : null,
    [token],
  );

  const style = trackStyle(team.track);

  return (
    <div className="space-y-8">
      <Card className={cx("ring-1", style.ring)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrackBadge track={team.track} />
              <h2 className="text-xl font-bold">{team.name}</h2>
            </div>
            {team.topic && <p className="mt-2 text-sm text-muted">{team.topic}</p>}
          </div>
          <span className="text-sm text-muted">{team.memberCount}명</span>
        </div>

        {team.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
            {team.description}
          </p>
        )}

        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <h3 className="text-sm font-semibold">팀원</h3>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li
                key={member.teamMemberId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                {member.role === "LEADER" && (
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    조장
                  </span>
                )}
                <span className="font-medium">{member.name}</span>
                {member.studentId && <span className="text-subtle">{member.studentId}</span>}
                {member.email && <span className="text-subtle">{member.email}</span>}
                {!member.linked && <span className="text-xs text-amber-600">로그인 대기</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-subtle">
            학번과 이메일은 우리 팀에게만 보입니다. 다른 참가자에게는 이름만 공개됩니다.
          </p>
        </div>
      </Card>

      {isLeader && (
        <TeamEditForm
          team={team}
          disabled={!registrationOpen}
          onUpdated={onTeamChanged}
        />
      )}

      {submissionQuery.loading ? (
        <Spinner label="제출 현황 불러오는 중" />
      ) : isLeader ? (
        <SubmissionPanel
          team={team}
          event={eventQuery.data}
          existing={submissionQuery.data ?? null}
          onSaved={submissionQuery.reload}
        />
      ) : (
        <Alert tone="info" title="결과물 제출은 조장만 할 수 있습니다">
          {team.members.find((m) => m.role === "LEADER")?.name ?? "조장"}님이 제출합니다.
        </Alert>
      )}
    </div>
  );
}

/** 다른 팀 목록. 개인정보는 서버가 빼고 내려주므로 이름만 보인다. */
function OtherTeamsTab({ myTeamId }: { myTeamId: number }) {
  const { token } = useAuth();
  const teamsQuery = useApiQuery(
    token ? (signal) => api.getTeams(token, signal) : null,
    [token],
  );
  const [query, setQuery] = useState("");

  const teams = useMemo(() => {
    const all = (teamsQuery.data ?? []).filter((t) => t.teamId !== myTeamId);
    const q = query.trim().toLowerCase();
    if (!q) return all;
    // 팀 이름·한 줄 주제·팀 소개를 한꺼번에 훑는다
    return all.filter((t) =>
      [t.name, t.topic, t.description].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [teamsQuery.data, myTeamId, query]);

  if (teamsQuery.loading) return <Spinner label="팀 목록 불러오는 중" />;
  if (teamsQuery.error) return <Alert tone="error">{teamsQuery.error}</Alert>;

  return (
    <div>
      <label htmlFor="team-search" className="sr-only">
        팀 검색
      </label>
      <TextInput
        id="team-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="팀 이름, 주제, 소개로 검색"
      />

      <p className="mt-3 text-sm text-muted">
        {query.trim() ? `${teams.length}개 팀` : `전체 ${teams.length}개 팀`}
      </p>

      {teams.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={query.trim() ? "검색 결과가 없습니다" : "아직 등록된 다른 팀이 없습니다"}
            description={
              query.trim() ? "다른 말로 검색해 보세요." : "첫 번째 팀이 등록되면 여기에 보입니다."
            }
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {teams.map((t) => (
            <li key={t.teamId}>
              <TeamCard team={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TrackBadge track={team.track} />
            <span className="font-bold">{team.name}</span>
            <span className="text-xs text-subtle">{TRACK_TAGLINE[team.track]}</span>
          </div>
          {team.topic && <p className="mt-2 text-sm text-muted">{team.topic}</p>}
          {team.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-subtle">
              {team.description}
            </p>
          )}
        </div>
        <Badge tone="neutral">{team.memberCount}명</Badge>
      </div>

      <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm">
        <span className="text-muted">팀원 </span>
        {team.members.map((m) => m.name).join(", ")}
      </p>
    </Card>
  );
}
