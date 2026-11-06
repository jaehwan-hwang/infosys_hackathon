"use client";

import { useState } from "react";
import { formatScore } from "@/lib/format";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import type { PublicTeamResult, PublicTrackResult, Track } from "@/lib/types";
import { MaterialLinks } from "@/components/material-links";
import { cx, trackStyle } from "@/components/ui";

/**
 * 리더보드.
 *
 * 트랙마다 큼직한 둥근 네모를 하나씩 두고, 누르면 그 아래로 수상 팀이 펼쳐진다.
 * 시상 화면이라 트랙 이름 자체가 큼직하게 보여야 하고, 세 트랙을 한꺼번에 늘어놓으면
 * 아직 시상하지 않은 트랙의 빈 칸이 자리만 차지한다.
 *
 * 트랙마다 따로 열고 닫는다. 누르면 펼쳐지고, 다시 누르면 접힌다 — 다른 트랙은 건드리지 않는다.
 */
export function LeaderboardBoard({ tracks }: { tracks: PublicTrackResult[] }) {
  // 처음 열 때는 공개된 트랙 중 첫 번째를 펼쳐 둔다
  const firstOpen = tracks.find((t) => t.published)?.track;
  const [open, setOpen] = useState<Set<Track>>(() => new Set(firstOpen ? [firstOpen] : []));

  const toggle = (track: Track) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <TrackPanel
          key={track.track}
          track={track}
          open={open.has(track.track)}
          onToggle={() => toggle(track.track)}
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
              {track.track === "SUMMIT"
                ? "Summit은 교수 평가가 끝나면 시상하며, 그때 여기에 수상 팀이 올라옵니다."
                : `${TRACK_LABEL[track.track]} 트랙 시상이 끝나면 여기에 수상 팀이 올라옵니다.`}
            </p>
          ) : track.teams.length === 0 ? (
            <p className="rounded-2xl border-2 border-current/15 px-6 py-7 text-center text-sm text-muted">
              이 트랙에는 집계된 팀이 없습니다.
            </p>
          ) : (
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

/**
 * 수상 팀 한 줄: 메달 · 팀명 · 낸 자료 · 최종 점수.
 *
 * 점수는 최종 점수 하나만 둔다 — 교수·참가자 점수를 섞는 방식은 홈 화면에 적혀 있다.
 * 낸 자료는 팀명과 점수 사이 가운데에 둔다. Summit은 최대 여덟 개까지 나오므로 버튼을
 * 작게 하고 두 줄까지 감싼다. 좁은 화면에서는 자료 줄을 맨 아래로 내린다.
 */
function WinnerRow({ team: winner, track }: { team: PublicTeamResult; track: Track }) {
  const first = winner.rank === 1;

  return (
    <div
      className={cx(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-2xl border-2 bg-[var(--bg)] px-5 py-4",
        "md:grid-cols-[auto_minmax(0,12rem)_minmax(0,1fr)_auto]",
        first ? cx("border-current/15", trackStyle(track).ring) : "border-current/15",
      )}
    >
      <MedalTag rank={winner.rank} />

      <div className="min-w-0">
        <p
          className={cx(
            // 한글 팀명이 글자 중간에서 잘리지 않게 단어 단위로 감싸고, 아주 긴 이름만 쪼갠다
            "font-display break-keep tracking-tight [overflow-wrap:anywhere]",
            first ? "text-xl sm:text-2xl" : "text-lg sm:text-xl",
          )}
        >
          {winner.teamName}
        </p>
        {winner.projectName && (
          <p className="mt-0.5 text-sm text-muted">{winner.projectName}</p>
        )}
        {winner.awardName && (
          <span className="mt-1.5 inline-block rounded-full border-2 border-current/20 px-3 py-1 text-xs font-bold">
            {winner.awardName}
          </span>
        )}
      </div>

      <div className="order-last col-span-3 empty:hidden md:order-none md:col-span-1 md:empty:block">
        {winner.materials && (
          <MaterialLinks links={winner.materials} compact className="justify-center" />
        )}
      </div>

      <div className="text-right">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
          최종 점수
        </p>
        <p
          className={cx(
            "font-display tabular-nums tracking-tight",
            first ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          )}
        >
          {formatScore(winner.finalScore)}
        </p>
      </div>
    </div>
  );
}

/**
 * 수상 밖 팀. 등수·팀명·프로젝트명과 낸 자료를 보여준다.
 *
 * 점수는 서버가 내려주지 않는다 — 몇 점 차로 못 받았는지까지 드러낼 이유가 없다.
 * 수상 줄보다 눈에 덜 띄게 두되, 자료 칸은 수상 줄과 같은 자리에 맞춰 세로로 줄이 맞게 한다.
 */
function PlainRow({ team }: { team: PublicTeamResult }) {
  return (
    <div
      className={cx(
        "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border-2 border-current/10 px-5 py-3.5",
        "md:grid-cols-[auto_minmax(0,12rem)_minmax(0,1fr)_auto]",
      )}
    >
      {/* 수상 줄의 메달 칸과 폭을 맞춘다 */}
      <span className="w-[4.25rem] shrink-0 text-center text-sm font-bold tabular-nums text-subtle">
        {team.rank}등
      </span>

      <div className="min-w-0">
        <p className="break-keep font-bold [overflow-wrap:anywhere]">{team.teamName}</p>
        {team.projectName && (
          <p className="mt-0.5 text-sm text-muted">{team.projectName}</p>
        )}
      </div>

      <div className="order-last col-span-2 empty:hidden md:order-none md:col-span-1 md:empty:block">
        {team.materials && (
          <MaterialLinks links={team.materials} compact className="justify-center" />
        )}
      </div>

      {/* 수상 줄의 점수 칸 자리. 비워 두어 자료 칸이 같은 폭으로 놓이게 한다 */}
      <div aria-hidden="true" className="hidden w-[5.5rem] md:block" />
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
