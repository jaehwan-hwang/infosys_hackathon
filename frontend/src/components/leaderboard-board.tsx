"use client";

import { useState } from "react";
import { formatScore } from "@/lib/format";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import type { PublicTeamResult, PublicTrackResult, Track } from "@/lib/types";
import { cx, trackStyle } from "@/components/ui";

/**
 * 리더보드.
 *
 * 트랙마다 큼직한 둥근 네모를 하나씩 두고, 누르면 그 아래로 수상 팀이 펼쳐진다.
 * 시상 화면이라 트랙 이름 자체가 큼직하게 보여야 하고, 세 트랙을 한꺼번에 늘어놓으면
 * 아직 시상하지 않은 트랙의 빈 칸이 자리만 차지한다.
 *
 * 한 번에 하나만 펼친다. 이미 펼친 것을 다시 누르면 접힌다.
 */
export function LeaderboardBoard({ tracks }: { tracks: PublicTrackResult[] }) {
  // 처음 열 때는 공개된 트랙 중 첫 번째를 펼쳐 둔다
  const firstOpen = tracks.find((t) => t.published)?.track ?? null;
  const [open, setOpen] = useState<Track | null>(firstOpen);

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <TrackPanel
          key={track.track}
          track={track}
          open={open === track.track}
          onToggle={() => setOpen(open === track.track ? null : track.track)}
        />
      ))}
    </div>
  );
}

function TrackPanel({
  track,
  open,
  onToggle,
}: {
  track: PublicTrackResult;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `leaderboard-${track.track}`;

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          "flex w-full items-center gap-4 rounded-3xl border-2 px-6 py-5 text-left transition-colors sm:px-8 sm:py-6",
          open
            ? "border-transparent bg-grad-brand text-white"
            : "border-current/15 hover:bg-current/5",
        )}
      >
        <div className="min-w-0">
          <p className="font-display text-[30px] leading-none tracking-[-0.02em] sm:text-[40px]">
            {TRACK_LABEL[track.track]}
          </p>
          <p className={cx("mt-2 text-[13px] sm:text-sm", open ? "opacity-80" : "text-muted")}>
            {TRACK_TAGLINE[track.track]} · {track.awardCount}등까지 시상
            {!track.published && " · 시상 전"}
          </p>
        </div>

        <Chevron open={open} />
      </button>

      {open && (
        <div id={panelId} className="mt-3 px-1">
          {!track.published ? (
            <p className="rounded-2xl border-2 border-current/15 px-6 py-7 text-center text-sm leading-relaxed text-muted">
              시상 기간이 아닙니다.
              <br />
              {TRACK_LABEL[track.track]} 트랙 시상이 끝나면 여기에 수상 팀이 올라옵니다.
            </p>
          ) : track.teams.length === 0 ? (
            <p className="rounded-2xl border-2 border-current/15 px-6 py-7 text-center text-sm text-muted">
              이 트랙에는 집계된 팀이 없습니다.
            </p>
          ) : (
            <>
              <ul className="space-y-2.5">
                {track.teams.map((team) => (
                  <li key={team.teamId}>
                    {team.awarded ? (
                      <WinnerRow team={team} track={track.track} />
                    ) : (
                      <PlainRow team={team} />
                    )}
                  </li>
                ))}
              </ul>
              {track.formula && (
                <p className="mt-3 text-right text-xs text-subtle">{track.formula}</p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cx(
        "ml-auto size-6 shrink-0 transition-transform",
        open ? "rotate-180" : "opacity-50",
      )}
    >
      <path
        d="M5 8l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WinnerRow({ team: winner, track }: { team: PublicTeamResult; track: Track }) {
  const first = winner.rank === 1;
  // Summit만 교수 평가가 섞이므로, 최종 점수가 어떻게 나왔는지 내역을 함께 보여준다.
  // 교수 평가가 없는 트랙에서는 서버가 이 칸을 아예 빼고 내려보내므로 undefined도 걸러낸다.
  const breakdown = typeof winner.professorAverage === "number";

  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border-2 bg-[var(--bg)] px-5 py-4",
        first ? cx("border-current/15", trackStyle(track).ring) : "border-current/15",
      )}
    >
      <MedalTag rank={winner.rank} />

      <div className="min-w-0">
        <p className={cx("font-display tracking-tight", first ? "text-2xl" : "text-xl")}>
          {winner.teamName}
        </p>
        {winner.projectName && (
          <p className="mt-0.5 text-sm text-muted">{winner.projectName}</p>
        )}
      </div>

      {winner.awardName && (
        <span className="rounded-full border-2 border-current/20 px-3 py-1 text-xs font-bold">
          {winner.awardName}
        </span>
      )}

      <div className="ml-auto text-right">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
          최종 점수
        </p>
        <p
          className={cx(
            "font-display tabular-nums tracking-tight",
            first ? "text-3xl" : "text-2xl",
          )}
        >
          {formatScore(winner.finalScore)}
        </p>
        {breakdown && (
          <p className="mt-0.5 text-xs tabular-nums text-muted">
            교수 {formatScore(winner.professorAverage)} · 참가자{" "}
            {formatScore(winner.studentAverage)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 수상 밖 팀. 등수와 팀 이름만 적는다.
 *
 * 점수는 서버가 내려주지 않는다 — 몇 점 차로 못 받았는지까지 드러낼 이유가 없다.
 * 수상 줄보다 눈에 덜 띄게 두어 시상 결과와 섞이지 않게 한다.
 */
function PlainRow({ team }: { team: PublicTeamResult }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-current/10 px-5 py-3">
      <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-subtle">
        {team.rank}등
      </span>
      <span className="min-w-0 font-bold">{team.teamName}</span>
    </div>
  );
}

/** 등수 메달. 1등만 파란 그라데이션으로 채우고 나머지는 선만 둔다. */
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function MedalTag({ rank }: { rank: number }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
        rank === 1 ? "bg-grad-brand text-white" : "border-2 border-current/20",
      )}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {MEDALS[rank] ?? "🏅"}
      </span>
      {rank}등
    </span>
  );
}
