"use client";

import { useMemo, useState } from "react";
import { TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Spinner,
  TrackFilter,
  cx,
} from "@/components/ui";
import type { TrackFilterValue } from "@/components/ui";
import { api } from "@/lib/api";
import { TRACK_LABEL } from "@/lib/track-rules";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import type { Participant } from "@/lib/types";

/**
 * 참가자 명단.
 *
 * 연락할 때 필요한 것(학번·전화번호·이메일)을 한 줄에 모은다. 이 화면은 운영진만
 * 보므로 학번을 가리지 않는다 — 참가자끼리 보는 화면에서는 입학년도까지만 나간다.
 */
export function AdminParticipantsPanel() {
  const { token } = useAuth();
  const participantsQuery = useApiQuery(
    token ? () => api.admin.getParticipants(token) : null,
    [token],
  );

  const [track, setTrack] = useState<TrackFilterValue>("ALL");
  const [query, setQuery] = useState("");

  const participants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (participantsQuery.data ?? [])
      .filter((p) => track === "ALL" || p.track === track)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.studentId.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q),
      );
  }, [participantsQuery.data, track, query]);

  if (participantsQuery.loading) return <Spinner />;
  if (participantsQuery.error) return <Alert tone="error">{participantsQuery.error}</Alert>;

  const all = participantsQuery.data ?? [];
  const missingPhone = all.filter((p) => !p.phone).length;

  return (
    <div>
      <TrackFilter value={track} onChange={setTrack} />

      <div className="mt-3">
        <label htmlFor="participant-search" className="sr-only">
          참가자 검색
        </label>
        <TextInput
          id="participant-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 학번, 전화번호, 이메일, 팀명으로 검색"
          className="rounded-full"
        />
      </div>

      <p className="mt-3 text-sm text-muted">
        {participants.length}명
        {track !== "ALL" && ` · ${TRACK_LABEL[track]} 트랙`}
        {missingPhone > 0 && (
          <span className="ml-2 text-amber-600">
            전화번호 미등록 {missingPhone}명 (아직 로그인 전)
          </span>
        )}
      </p>

      {participants.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="해당하는 참가자가 없습니다" />
        </div>
      ) : (
        <>
          {/* 넓은 화면에서는 표로, 좁은 화면에서는 카드로 읽는다 */}
          <div className="mt-5 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-current/25 text-left">
                  {["팀", "역할", "성명", "학번", "전화번호", "이메일"].map((h) => (
                    <th key={h} scope="col" className="py-2.5 pr-3 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.teamMemberId} className="border-b border-current/10">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{p.teamName}</span>
                      <span className="ml-2 text-xs text-subtle">
                        {TRACK_LABEL[p.track]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {p.leader ? (
                        <Badge tone="info">팀장</Badge>
                      ) : (
                        <span className="text-subtle">팀원</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-medium">{p.name}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{p.studentId}</td>
                    <td
                      className={cx(
                        "py-2.5 pr-3 tabular-nums",
                        !p.phone && "text-amber-600",
                      )}
                    >
                      {p.phone ?? "미등록"}
                    </td>
                    <td className="py-2.5 pr-3 text-muted">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2.5 lg:hidden">
            {participants.map((p) => (
              <li key={p.teamMemberId}>
                <Card className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    {p.leader && <Badge tone="info">팀장</Badge>}
                    <span className="text-xs text-subtle">
                      {p.teamName} · {TRACK_LABEL[p.track]}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    <Row label="학번" value={p.studentId} />
                    <Row label="전화번호" value={p.phone ?? "미등록"} muted={!p.phone} />
                    <Row label="이메일" value={p.email} />
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cx("text-right tabular-nums", muted && "text-amber-600")}>{value}</dd>
    </div>
  );
}
