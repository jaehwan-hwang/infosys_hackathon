"use client";

import { useMemo, useState } from "react";
import { Button, TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Spinner,
  TrackBadge,
  cx,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { RECRUIT_LABEL } from "@/lib/recruit";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { JoinRequest, TeamAdmin } from "@/lib/types";

/**
 * 운영진 팀 합치기.
 *
 * 참가자가 보낸 신청은 자동으로 처리되지 않는다. 운영진이 양쪽에 연락해 확인한 뒤
 * 여기서 직접 합친다. 특정 팀을 고르지 않은 신청("어느 팀이든 좋습니다")은 받을 팀을
 * 골라 주어야 한다.
 */
export function AdminMergePanel() {
  const { token } = useAuth();

  const requestsQuery = useApiQuery(
    token ? () => api.admin.getJoinRequests(token) : null,
    [token],
  );
  const teamsQuery = useApiQuery(token ? () => api.admin.getTeams(token) : null, [token]);

  const reloadAll = () => {
    requestsQuery.reload();
    teamsQuery.reload();
  };

  if (requestsQuery.loading || teamsQuery.loading) return <Spinner />;
  if (requestsQuery.error) return <Alert tone="error">{requestsQuery.error}</Alert>;

  const requests = requestsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const pending = requests.filter((r) => r.status === "PENDING");
  const handled = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-8">
      <Alert tone="info">
        신청은 자동으로 처리되지 않습니다. 양쪽에 연락해 확인한 뒤 합쳐 주세요. 합치면
        넘어온 팀은 사라지고 팀원은 모두 받는 팀의 <strong>팀원</strong>이 됩니다.
      </Alert>

      <section>
        <h2 className="text-base font-bold">대기 중인 신청 {pending.length}건</h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="대기 중인 신청이 없습니다" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((r) => (
              <li key={r.joinRequestId}>
                <RequestCard request={r} teams={teams} onHandled={reloadAll} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ManualMerge teams={teams} onMerged={reloadAll} />

      {handled.length > 0 && (
        <section>
          <h2 className="text-base font-bold">처리한 신청 {handled.length}건</h2>
          <ul className="mt-4 space-y-2">
            {handled.map((r) => (
              <li key={r.joinRequestId}>
                <Card className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span>
                      <strong>{r.fromTeamName}</strong>
                      <span className="text-muted">
                        {" → "}
                        {r.toTeamName ?? "(지정 없음)"}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {r.handledNote && (
                        <span className="text-xs text-subtle">{r.handledNote}</span>
                      )}
                      <Badge tone={r.status === "MERGED" ? "success" : "neutral"}>
                        {r.statusLabel}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RequestCard({
  request,
  teams,
  onHandled,
}: {
  request: JoinRequest;
  teams: TeamAdmin[];
  onHandled: () => void;
}) {
  const { token } = useAuth();
  // 받을 팀. 참가자가 고른 팀이 있으면 그 팀, 없으면 운영진이 고른다.
  const [targetId, setTargetId] = useState<number | "">(request.toTeamId ?? "");

  const mergeMutation = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    if (targetId === "" || request.fromTeamId === null) {
      throw new Error("받을 팀을 골라 주세요");
    }
    return api.admin.mergeTeams(token, request.fromTeamId, Number(targetId));
  });

  const rejectMutation = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.admin.rejectJoinRequest(token, request.joinRequestId);
  });

  const target = teams.find((t) => t.teamId === targetId);
  const merged = target ? target.memberCount + request.fromTeamMemberCount : null;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display mr-1 text-lg tracking-tight">
              {request.fromTeamName}
            </span>
            {request.fromTeamTrack && <TrackBadge track={request.fromTeamTrack} />}
            <Badge tone="neutral">{request.fromTeamMemberCount}명</Badge>
            {request.toTeamName ? (
              <span className="text-sm text-muted">→ {request.toTeamName} 팀에 신청</span>
            ) : (
              <Badge tone="warning">받을 팀 지정 필요</Badge>
            )}
          </div>
          {request.message && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{request.message}</p>
          )}
          <p className="mt-1 text-xs text-subtle">{formatDateTime(request.createdAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t-2 border-current/10 pt-4">
        <div>
          <label
            htmlFor={`target-${request.joinRequestId}`}
            className="block text-xs font-bold text-subtle"
          >
            받을 팀
          </label>
          <select
            id={`target-${request.joinRequestId}`}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1.5 h-11 rounded-xl border-2 border-current/15 bg-[var(--bg)] px-3 text-sm"
          >
            <option value="">팀 고르기</option>
            {teams
              .filter((t) => t.teamId !== request.fromTeamId)
              .map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.teamName} ({t.memberCount}명 · {RECRUIT_LABEL[t.recruiting]})
                </option>
              ))}
          </select>
        </div>

        {merged !== null && (
          <p className="pb-3 text-sm text-muted">합치면 {merged}명</p>
        )}

        <Button
          loading={mergeMutation.pending}
          disabled={targetId === ""}
          onClick={async () => {
            const result = await mergeMutation.run();
            if (result) onHandled();
          }}
        >
          합치기
        </Button>

        <Button
          variant="secondary"
          loading={rejectMutation.pending}
          onClick={async () => {
            await rejectMutation.run();
            onHandled();
          }}
        >
          반려
        </Button>
      </div>

      {(mergeMutation.error || rejectMutation.error) && (
        <div className="mt-3">
          <Alert tone="error">
            {mergeMutation.error?.message ?? rejectMutation.error?.message}
          </Alert>
        </div>
      )}
    </Card>
  );
}

/** 신청 없이 운영진이 직접 두 팀을 합친다. */
function ManualMerge({
  teams,
  onMerged,
}: {
  teams: TeamAdmin[];
  onMerged: () => void;
}) {
  const { token } = useAuth();
  const [fromId, setFromId] = useState<number | "">("");
  const [toId, setToId] = useState<number | "">("");
  const [query, setQuery] = useState("");

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.admin.mergeTeams(token, Number(fromId), Number(toId), "운영진 직접 합침");
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.teamName.toLowerCase().includes(q) ||
        t.members.some((m) => m.name.toLowerCase().includes(q)),
    );
  }, [teams, query]);

  const from = teams.find((t) => t.teamId === fromId);
  const to = teams.find((t) => t.teamId === toId);

  return (
    <Card>
      <h2 className="text-base font-bold">직접 합치기</h2>
      <p className="mt-1.5 text-sm text-muted">
        신청 없이 운영진이 두 팀을 붙입니다. 왼쪽 팀이 사라지고 팀원이 오른쪽 팀으로
        들어갑니다.
      </p>

      <div className="mt-4">
        <label htmlFor="merge-search" className="sr-only">
          팀 검색
        </label>
        <TextInput
          id="merge-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="팀 이름 또는 팀원 이름으로 좁히기"
          className="rounded-full"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TeamSelect
          id="merge-from"
          label="없어질 팀"
          value={fromId}
          onChange={setFromId}
          teams={filtered.filter((t) => t.teamId !== toId)}
        />
        <TeamSelect
          id="merge-to"
          label="남을 팀"
          value={toId}
          onChange={setToId}
          teams={filtered.filter((t) => t.teamId !== fromId)}
        />
      </div>

      {from && to && (
        <p className="mt-3 text-sm text-muted">
          <strong>{from.teamName}</strong>({from.memberCount}명)이 사라지고{" "}
          <strong>{to.teamName}</strong>이(가) {from.memberCount + to.memberCount}명이 됩니다.
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}

      <Button
        className="mt-4"
        loading={pending}
        disabled={fromId === "" || toId === ""}
        onClick={async () => {
          const result = await run();
          if (result) {
            setFromId("");
            setToId("");
            onMerged();
          }
        }}
      >
        두 팀 합치기
      </Button>
    </Card>
  );
}

function TeamSelect({
  id,
  label,
  value,
  onChange,
  teams,
}: {
  id: string;
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  teams: TeamAdmin[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={cx(
          "mt-1.5 h-11 w-full rounded-xl border-2 border-current/15 bg-[var(--bg)] px-3 text-sm",
        )}
      >
        <option value="">팀 고르기</option>
        {teams.map((t) => (
          <option key={t.teamId} value={t.teamId}>
            {t.teamName} ({t.memberCount}명)
          </option>
        ))}
      </select>
    </div>
  );
}
