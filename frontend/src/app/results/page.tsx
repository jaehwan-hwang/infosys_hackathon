import type { Metadata } from "next";
import { ApiError, publicApi } from "@/lib/api";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import type { PublicTeamResult, PublicTrackResult, Track } from "@/lib/types";
import { Alert, Card, Section, TrackBadge, cx, trackStyle } from "@/components/ui";

export const metadata: Metadata = { title: "리더보드" };

// 공개 시점이 운영진 토글에 달려 있어 캐시하지 않는다.
export const dynamic = "force-dynamic";

/**
 * 리더보드.
 *
 * 점수는 보여주지 않는다. 등수와 팀 이름만 올린다 — 점수를 공개하면 "몇 점 차로
 * 졌다"가 드러나고, 시상 밖 팀의 순위까지 드러난다. 서버도 시상 등수까지만 내려준다.
 *
 * 트랙마다 따로 열린다. Spark는 1일차 시상 직후, Sprint와 Summit은 2일차에 열린다.
 * 아직 열지 않은 트랙은 "시상 기간이 아닙니다"만 보인다.
 */
export default async function ResultsPage() {
  let tracks: PublicTrackResult[] = [];
  let error: string | null = null;

  try {
    tracks = await publicApi.getResults();
  } catch (e) {
    error = e instanceof ApiError ? e.message : "리더보드를 불러오지 못했습니다.";
  }

  if (error) {
    return (
      <Section title="리더보드">
        <Alert tone="error">{error}</Alert>
      </Section>
    );
  }

  const openCount = tracks.filter((t) => t.published).length;

  return (
    <Section
      eyebrow="Leaderboard"
      title="리더보드"
      description={
        openCount === 0
          ? "시상이 끝난 트랙부터 순서대로 공개됩니다. Spark는 1일차, Sprint와 Summit은 2일차에 열립니다."
          : "트랙별 수상 팀입니다. 점수는 공개하지 않습니다."
      }
    >
      <div className="space-y-10">
        {tracks.map((track) => (
          <TrackBoard key={track.track} track={track} />
        ))}
      </div>
    </Section>
  );
}

function TrackBoard({ track }: { track: PublicTrackResult }) {
  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <TrackBadge track={track.track} />
        <h2 className="font-display text-2xl tracking-tight">
          {TRACK_LABEL[track.track]}
        </h2>
        <span className="text-xs text-subtle">
          {TRACK_TAGLINE[track.track]} · {track.awardCount}등까지 시상
        </span>
      </div>

      {!track.published ? (
        <Card className="mt-4">
          <p className="font-bold">시상 기간이 아닙니다</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {TRACK_LABEL[track.track]} 트랙 시상이 끝나면 이 자리에 수상 팀이 올라옵니다.
          </p>
        </Card>
      ) : track.winners.length === 0 ? (
        <Card className="mt-4">
          <p className="font-bold">수상 팀이 없습니다</p>
          <p className="mt-1.5 text-sm text-muted">
            이 트랙에는 집계된 팀이 없습니다.
          </p>
        </Card>
      ) : (
        <ul className="mt-4 space-y-3">
          {track.winners.map((winner) => (
            <li key={winner.teamId}>
              <WinnerCard winner={winner} track={track.track} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WinnerCard({ winner, track }: { winner: PublicTeamResult; track: Track }) {
  const first = winner.rank === 1;

  return (
    <Card className={cx(first && trackStyle(track).ring)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <MedalTag rank={winner.rank} />
        <div className="min-w-0">
          <p
            className={cx(
              "font-display tracking-tight",
              first ? "text-2xl sm:text-3xl" : "text-xl",
            )}
          >
            {winner.teamName}
          </p>
          {winner.projectName && (
            <p className="mt-0.5 text-sm text-muted">{winner.projectName}</p>
          )}
        </div>
        {winner.awardName && (
          <span className="ml-auto rounded-full border-2 border-current/20 px-3 py-1 text-xs font-bold">
            {winner.awardName}
          </span>
        )}
      </div>
    </Card>
  );
}

/** 등수 메달. 1등만 파란 그라데이션으로 채우고 나머지는 선만 둔다. */
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function MedalTag({ rank }: { rank: number }) {
  const medal = MEDALS[rank] ?? "🏅";

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
        rank === 1 ? "bg-grad-brand text-white" : "border-2 border-current/20",
      )}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {medal}
      </span>
      {rank}등
    </span>
  );
}
