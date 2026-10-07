"use client";

import { useState } from "react";
import { Button, Field, TextArea } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Spinner,
  TrackBadge,
  cx,
} from "@/components/ui";
import { TeamMemberList } from "@/components/team-member-list";
import { api } from "@/lib/api";
import { LIMITS, remainingHint } from "@/lib/limits";
import { formatDateTime } from "@/lib/format";
import { RECRUIT_LABEL, RECRUIT_OPTIONS, counterpart } from "@/lib/recruit";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { JoinRequest, RecruitStatus, Team } from "@/lib/types";

/**
 * 팀 합치기.
 *
 * 인원이 모자란 팀끼리 이어 주는 화면이다. 세 가지를 한곳에 둔다.
 *   1. 우리 팀의 모집 상태 — 팀원을 찾는지, 팀장을 찾는지
 *   2. 우리와 반대인 팀 목록 — 마음에 드는 팀을 골라 신청
 *   3. 고를 팀이 없을 때를 위한 "아무 팀이나" 신청
 *
 * 어느 쪽이든 그 자리에서 합쳐지지 않는다. 운영진이 양쪽에 연락해 확인한 뒤 합친다.
 */
export function TeamMergePanel({
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
  const { token } = useAuth();

  const requestsQuery = useApiQuery(
    token ? (signal) => api.getMyJoinRequests(token, signal) : null,
    [token],
  );
  const recruitingQuery = useApiQuery(
    token ? (signal) => api.getRecruitingTeams(token, undefined, signal) : null,
    [token, team.recruiting],
  );

  const pendingOpen = (requestsQuery.data ?? []).some(
    (r) => r.outgoing && r.toTeamId === null && r.status === "PENDING",
  );

  return (
    <div className="space-y-8">
      <RecruitForm
        team={team}
        disabled={!registrationOpen}
        onUpdated={() => {
          onTeamChanged();
          recruitingQuery.reload();
        }}
      />

      {!registrationOpen ? (
        <Alert tone="warning" title="신청 기간이 아닙니다">
          신청 기간에만 팀을 합칠 수 있습니다.
        </Alert>
      ) : (
        <>
          <MatchList
            team={team}
            maxTeamSize={maxTeamSize}
            teams={recruitingQuery.data ?? []}
            loading={recruitingQuery.loading}
            error={recruitingQuery.error ?? null}
            alreadyRequested={(teamId) =>
              (requestsQuery.data ?? []).some(
                (r) => r.outgoing && r.toTeamId === teamId && r.status === "PENDING",
              )
            }
            onRequested={requestsQuery.reload}
          />

          <OpenRequestCard
            pending={pendingOpen}
            onRequested={requestsQuery.reload}
          />
        </>
      )}

      <RequestList
        requests={requestsQuery.data ?? []}
        loading={requestsQuery.loading}
        onChanged={requestsQuery.reload}
      />
    </div>
  );
}

/** 우리 팀이 무엇을 찾는지 정한다. 이 값이 반대쪽 목록을 결정한다. */
function RecruitForm({
  team,
  disabled,
  onUpdated,
}: {
  team: Team;
  disabled: boolean;
  onUpdated: () => void;
}) {
  const { token } = useAuth();
  const [recruiting, setRecruiting] = useState<RecruitStatus>(team.recruiting);
  const [note, setNote] = useState(team.recruitNote ?? "");
  const [saved, setSaved] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.updateRecruiting(token, team.teamId, {
      recruiting,
      recruitNote: note.trim() || undefined,
    });
  });

  const dirty = recruiting !== team.recruiting || note.trim() !== (team.recruitNote ?? "");

  return (
    <Card>
      <h3 className="text-base font-bold">우리 팀은 무엇을 찾고 있나요</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        고른 것과 반대인 팀이 아래에 보입니다. 팀원을 찾으면 팀장을 찾는 쪽이, 팀장을 찾으면
        팀원을 찾는 팀이 나옵니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {RECRUIT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              setRecruiting(option.value);
              setSaved(false);
            }}
            aria-pressed={recruiting === option.value}
            className={cx(
              "rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-50",
              recruiting === option.value
                ? "border-brand-600 bg-brand-600/5"
                : "border-current/15 hover:bg-current/5",
            )}
          >
            <p className="font-bold">{option.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{option.description}</p>
          </button>
        ))}
      </div>

      {recruiting !== "NONE" && (
        <div className="mt-4">
          <Field
            label="모집 글 한마디"
            hint={remainingHint(note, LIMITS.recruitNote)}
          >
            {(id) => (
              <TextArea
                id={id}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setSaved(false);
                }}
                maxLength={LIMITS.recruitNote}
                disabled={disabled}
                placeholder="예: 프론트엔드 1명 더 구합니다. 2일차 Sprint로 참가 예정입니다."
              />
            )}
          </Field>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button
          loading={pending}
          disabled={disabled || !dirty}
          onClick={async () => {
            const updated = await run();
            if (updated) {
              setSaved(true);
              onUpdated();
            }
          }}
        >
          모집 상태 저장
        </Button>
        {saved && !dirty && <span className="text-sm text-emerald-600">저장했습니다</span>}
      </div>
    </Card>
  );
}

/** 우리와 반대인 팀 목록. 여기서 원하는 팀을 골라 신청한다. */
function MatchList({
  team,
  maxTeamSize,
  teams,
  loading,
  error,
  alreadyRequested,
  onRequested,
}: {
  team: Team;
  maxTeamSize: number;
  teams: Team[];
  loading: boolean;
  error: string | null;
  alreadyRequested: (teamId: number) => boolean;
  onRequested: () => void;
}) {
  const want = counterpart(team.recruiting);

  if (team.recruiting === "NONE") {
    return (
      <EmptyState
        title="모집 상태를 먼저 골라 주세요"
        description="팀원을 찾는지 팀장을 찾는지 고르면, 반대인 팀이 여기에 나옵니다."
      />
    );
  }

  if (loading) return <Spinner label="모집 중인 팀 불러오는 중" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div>
      <h3 className="text-base font-bold">
        {RECRUIT_LABEL[want]} 중인 팀 {teams.length}곳
      </h3>
      <p className="mt-1.5 text-sm text-muted">
        합쳤을 때 {maxTeamSize}명을 넘는 팀에는 신청할 수 없습니다.
      </p>

      {teams.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="아직 맞는 팀이 없습니다"
            description="아래에서 '어느 팀이든 좋습니다'로 신청해 두면 운영진이 자리를 찾아 연결해 드립니다."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {teams.map((t) => (
            <li key={t.teamId}>
              <MatchCard
                team={t}
                myMemberCount={team.memberCount}
                maxTeamSize={maxTeamSize}
                requested={alreadyRequested(t.teamId)}
                onRequested={onRequested}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MatchCard({
  team,
  myMemberCount,
  maxTeamSize,
  requested,
  onRequested,
}: {
  team: Team;
  myMemberCount: number;
  maxTeamSize: number;
  requested: boolean;
  onRequested: () => void;
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.requestJoin(token, {
      toTeamId: team.teamId,
      message: message.trim() || undefined,
    });
  });

  const merged = myMemberCount + team.memberCount;
  const tooBig = merged > maxTeamSize;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display mr-1 max-w-full break-all text-lg tracking-tight">
              {team.name}
            </span>
            <TrackBadge track={team.track} />
            <Badge tone="info">{RECRUIT_LABEL[team.recruiting]}</Badge>
          </div>
          {team.recruitNote && (
            <p className="mt-2 break-words text-sm leading-relaxed text-muted">
              {team.recruitNote}
            </p>
          )}
          <div className="mt-3">
            <TeamMemberList members={team.members} />
          </div>
        </div>

        {requested ? (
          <Badge tone="success">신청함</Badge>
        ) : (
          <Button
            variant="secondary"
            disabled={tooBig}
            onClick={() => setOpen((v) => !v)}
          >
            {tooBig ? `${maxTeamSize}명 초과` : "합치기 신청"}
          </Button>
        )}
      </div>

      {open && !requested && (
        <div className="mt-4 border-t-2 border-current/10 pt-4">
          <Field label="운영진에게 남길 한마디">
            {(id) => (
              <TextArea
                id={id}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={LIMITS.joinMessage}
                placeholder="예: 저희는 2명이고 Sprint 트랙입니다. 백엔드를 맡을 수 있습니다."
              />
            )}
          </Field>

          {error && (
            <div className="mt-3">
              <Alert tone="error">{error.message}</Alert>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              loading={pending}
              onClick={async () => {
                const created = await run();
                if (created) {
                  setOpen(false);
                  onRequested();
                }
              }}
            >
              신청 보내기
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              취소
            </Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-subtle">
            신청하면 바로 합쳐지지 않습니다. 운영진이 양쪽에 연락해 확인한 뒤 합칩니다.
          </p>
        </div>
      )}
    </Card>
  );
}

/** 고를 팀이 없을 때. 운영진이 자리를 찾아 붙여 준다. */
function OpenRequestCard({
  pending: alreadySent,
  onRequested,
}: {
  pending: boolean;
  onRequested: () => void;
}) {
  const { token } = useAuth();
  const [message, setMessage] = useState("");

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.requestJoin(token, { message: message.trim() || undefined });
  });

  if (alreadySent) {
    return (
      <Alert tone="success" title="팀 합치기를 신청해 두었습니다">
        운영진이 자리를 찾아 연락드립니다. 아래 목록에서 취소할 수 있습니다.
      </Alert>
    );
  }

  return (
    <Card>
      <h3 className="text-base font-bold">마음에 드는 팀이 없나요</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        특정 팀을 고르지 않고 &ldquo;어느 팀이든 좋습니다&rdquo;로 신청해 두면, 운영진이
        남은 인원을 보고 자리를 찾아 연결해 드립니다. 다만 남은 인원이 맞아떨어져야
        합칠 수 있어, 신청해도 짝을 찾지 못할 수 있습니다.
      </p>

      <div className="mt-4">
        <Field label="운영진에게 남길 한마디">
          {(id) => (
            <TextArea
              id={id}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={LIMITS.joinMessage}
              placeholder="예: 혼자 신청했습니다. 어느 트랙이든 괜찮습니다."
            />
          )}
        </Field>
      </div>

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}

      <Button
        className="mt-4"
        loading={pending}
        onClick={async () => {
          const created = await run();
          if (created) onRequested();
        }}
      >
        어느 팀이든 좋습니다
      </Button>
    </Card>
  );
}

/** 보낸 신청과 받은 신청 */
function RequestList({
  requests,
  loading,
  onChanged,
}: {
  requests: JoinRequest[];
  loading: boolean;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const cancelMutation = useApiMutation(async (requestId: number) => {
    if (!token) throw new Error("no token");
    return api.cancelJoinRequest(token, requestId);
  });

  if (loading) return <Spinner label="신청 내역 불러오는 중" />;
  if (requests.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold">합치기 신청 내역</h3>
      <ul className="mt-4 space-y-2.5">
        {requests.map((r) => (
          <li key={r.joinRequestId}>
            <Card className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all text-sm font-bold">
                    {r.outgoing
                      ? r.toTeamName
                        ? `${r.toTeamName} 팀에 신청`
                        : "어느 팀이든 좋습니다"
                      : `${r.fromTeamName} 팀이 우리 팀에 신청`}
                  </p>
                  {r.message && (
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted">
                      {r.message}
                    </p>
                  )}
                  {r.handledNote && (
                    <p className="mt-1 text-xs text-subtle">{r.handledNote}</p>
                  )}
                  <p className="mt-1 text-xs text-subtle">{formatDateTime(r.createdAt)}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    tone={
                      r.status === "PENDING"
                        ? "warning"
                        : r.status === "MERGED"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {r.statusLabel}
                  </Badge>
                  {r.outgoing && r.status === "PENDING" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={cancelMutation.pending}
                      onClick={async () => {
                        await cancelMutation.run(r.joinRequestId);
                        onChanged();
                      }}
                    >
                      취소
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-subtle">
        받은 신청은 운영진이 처리합니다. 바로 수락되지 않으니 운영진 연락을 기다려 주세요.
      </p>
    </div>
  );
}
