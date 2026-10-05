"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { TeamMergePanel } from "@/components/team-merge-panel";
import { TeamRegisterForm } from "@/components/team-register-form";
import { TeamEditForm } from "@/components/team-edit-form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PillTabs,
  Section,
  Spinner,
  TrackBadge,
  TrackFilter,
  trackStyle,
} from "@/components/ui";
import type { TrackFilterValue } from "@/components/ui";
import { FeeNotice } from "@/components/fee-notice";
import { TextInput } from "@/components/form";
import { api, publicApi } from "@/lib/api";
import { RECRUIT_LABEL } from "@/lib/recruit";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import type { Team, Track } from "@/lib/types";

/**
 * "팀" 화면.
 *
 * 팀이 없으면 등록 폼, 있으면 우리 팀 / 팀 합치기 / 다른 팀을 탭으로 보여준다.
 * 결과물 제출은 행사 당일에만 쓰는 화면이라 여기서 빼고 따로 두었다(/submit).
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
      maxTeamSize={event?.maxTeamSize ?? 5}
      onTeamChanged={teamQuery.reload}
    />
  );
}

type Tab = "mine" | "merge" | "others";

function RegisteredView({
  team,
  registrationOpen,
  maxTeamSize,
  onTeamChanged,
}: {
  team: Team;
  registrationOpen: boolean;
  maxTeamSize: number;
  onTeamChanged: () => void;
}) {
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <Section eyebrow="Team" title="팀">
      <div className="mb-8">
        <PillTabs<Tab>
          label="팀 보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: "mine", label: "우리 팀" },
            { value: "merge", label: "팀 합치기" },
            { value: "others", label: "다른 팀" },
          ]}
        />
      </div>

      {tab === "mine" && (
        <MyTeamTab
          team={team}
          registrationOpen={registrationOpen}
          onTeamChanged={onTeamChanged}
        />
      )}
      {tab === "merge" && (
        <TeamMergePanel
          team={team}
          registrationOpen={registrationOpen}
          maxTeamSize={maxTeamSize}
          onTeamChanged={onTeamChanged}
        />
      )}
      {tab === "others" && <OtherTeamsTab myTeamId={team.teamId} />}
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
  const { user } = useAuth();
  const canManage =
    String(team.leaderId) === user?.id ||
    team.members.some(
      (m) => m.role === "LEADER" && m.userId !== null && String(m.userId) === user?.id,
    );

  const style = trackStyle(team.track);
  const feeNames = team.members.filter((m) => m.duesPaid === false).map((m) => m.name);

  return (
    <div className="space-y-8">
      <Card className={style.ring}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TrackBadge track={team.track} />
              <h2 className="font-display text-2xl tracking-tight">{team.name}</h2>
              {team.recruiting !== "NONE" && (
                <Badge tone="info">{RECRUIT_LABEL[team.recruiting]}</Badge>
              )}
            </div>
            {team.recruitNote && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{team.recruitNote}</p>
            )}
          </div>
          <span className="text-sm text-muted">{team.memberCount}명</span>
        </div>

        <div className="mt-6 border-t-2 border-current/10 pt-5">
          <h3 className="text-sm font-bold">팀원</h3>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li
                key={member.teamMemberId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                {member.role === "LEADER" && (
                  <span className="rounded-full bg-grad-brand px-2 py-0.5 text-[10px] font-bold text-white">
                    팀장
                  </span>
                )}
                <span className="font-bold">{member.name}</span>
                {member.studentId && <span className="text-subtle">{member.studentId}</span>}
                {member.email && <span className="text-subtle">{member.email}</span>}
                {member.duesPaid === false && (
                  <span className="text-xs font-bold text-brand-600">참가비 대상</span>
                )}
                {!member.linked && <span className="text-xs text-amber-600">로그인 대기</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-subtle">
            이메일과 학생회비 납부 여부는 우리 팀에게만 보입니다. 다른 참가자에게는 성명과
            학번만 공개됩니다.
          </p>
        </div>
      </Card>

      {feeNames.length > 0 && <FeeNotice names={feeNames} />}

      {canManage ? (
        <TeamEditForm
          team={team}
          disabled={!registrationOpen}
          onUpdated={onTeamChanged}
        />
      ) : (
        <Alert tone="info" title="팀 정보 수정은 팀장이 합니다">
          {team.members.find((m) => m.role === "LEADER")?.name ?? "팀장"}님 또는 팀을 등록한
          분이 수정할 수 있습니다.
        </Alert>
      )}
    </div>
  );
}

/**
 * 다른 팀 목록.
 *
 * 팀을 합치려면 누가 있는 팀인지 알아볼 수 있어야 해서 성명과 학번까지 보여준다.
 * 이메일과 학생회비 납부 여부는 서버가 빼고 내려준다.
 */
function OtherTeamsTab({ myTeamId }: { myTeamId: number }) {
  const { token } = useAuth();
  const teamsQuery = useApiQuery(
    token ? (signal) => api.getTeams(token, signal) : null,
    [token],
  );
  const [track, setTrack] = useState<TrackFilterValue>("ALL");
  const [query, setQuery] = useState("");

  const teams = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (teamsQuery.data ?? [])
      .filter((t) => t.teamId !== myTeamId)
      .filter((t) => track === "ALL" || t.track === track)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.members.some(
            (m) => m.name.toLowerCase().includes(q) || (m.studentId ?? "").includes(q),
          ),
      );
  }, [teamsQuery.data, myTeamId, track, query]);

  if (teamsQuery.loading) return <Spinner label="팀 목록 불러오는 중" />;
  if (teamsQuery.error) return <Alert tone="error">{teamsQuery.error}</Alert>;

  const filtered = track !== "ALL" || query.trim().length > 0;

  return (
    <div>
      <TrackFilter value={track} onChange={setTrack} />

      <div className="mt-3">
        <label htmlFor="team-search" className="sr-only">
          팀 검색
        </label>
        <TextInput
          id="team-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="팀 이름, 팀원 이름, 학번으로 검색"
          className="rounded-full"
        />
      </div>

      <p className="mt-3 text-sm text-muted">
        {filtered ? `${teams.length}개 팀` : `전체 ${teams.length}개 팀`}
        {track !== "ALL" && ` · ${TRACK_LABEL[track]} 트랙`}
      </p>

      {teams.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={filtered ? "해당하는 팀이 없습니다" : "아직 등록된 다른 팀이 없습니다"}
            description={
              filtered
                ? "트랙을 전체로 바꾸거나 다른 말로 검색해 보세요."
                : "첫 번째 팀이 등록되면 여기에 보입니다."
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
            <span className="font-display text-lg tracking-tight">{team.name}</span>
            <span className="text-xs text-subtle">{TRACK_TAGLINE[team.track]}</span>
            {team.recruiting !== "NONE" && (
              <Badge tone="info">{RECRUIT_LABEL[team.recruiting]}</Badge>
            )}
          </div>
          {team.recruitNote && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{team.recruitNote}</p>
          )}
        </div>
        <Badge tone="neutral">{team.memberCount}명</Badge>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t-2 border-current/10 pt-3 text-sm">
        {team.members.map((m) => (
          <li key={m.teamMemberId} className="flex items-center gap-1.5">
            {m.role === "LEADER" && (
              <span className="text-[10px] font-bold text-brand-600">팀장</span>
            )}
            <span className="font-bold">{m.name}</span>
            {m.studentId && <span className="text-subtle">{m.studentId}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
