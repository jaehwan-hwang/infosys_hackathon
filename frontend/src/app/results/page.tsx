import type { Metadata } from "next";
import { ApiError, publicApi } from "@/lib/api";
import { formatScore, rankLabel } from "@/lib/format";
import { TRACK_LABEL } from "@/lib/track-rules";
import type { TrackResult } from "@/lib/types";
import {
  Alert,
  Card,
  EmptyState,
  Section,
  TrackBadge,
  cx,
  trackStyle,
} from "@/components/ui";

export const metadata: Metadata = { title: "결과" };

// 공개 시점이 운영진 토글에 달려 있어 캐시하지 않는다.
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  let results: TrackResult[] | null = null;
  let notPublished = false;
  let error: string | null = null;

  try {
    results = await publicApi.getResults();
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) {
      notPublished = true;
    } else {
      error = e instanceof ApiError ? e.message : "결과를 불러오지 못했습니다.";
    }
  }

  if (notPublished) {
    return (
      <Section title="결과">
        <EmptyState
          title="아직 결과가 공개되지 않았습니다"
          description="순위와 점수는 시상식 발표 시점에 공개됩니다. 그때 이 페이지에서 확인할 수 있습니다."
        />
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="결과">
        <Alert tone="error">{error}</Alert>
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Results"
      title="최종 결과"
      description="트랙별 최종 순위입니다. 각 트랙에 적용된 산식을 함께 표기했습니다."
    >
      <div className="space-y-12">
        {(results ?? []).map((track) => (
          <TrackResults key={track.track} track={track} />
        ))}
      </div>
    </Section>
  );
}

function TrackResults({ track }: { track: TrackResult }) {
  const style = trackStyle(track.track);

  if (track.results.length === 0) return null;

  const [winner, ...rest] = track.results;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <TrackBadge track={track.track} />
        <h2 className="text-xl font-bold">{TRACK_LABEL[track.track]}</h2>
        <span className="text-xs text-subtle">{track.formula}</span>
      </div>

      {/* 1위는 크게 강조한다 */}
      <Card className={cx("mt-4 ring-2", style.ring)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-3xl">{rankLabel(winner.rank)}</p>
            <h3 className="mt-2 text-2xl font-black">{winner.teamName}</h3>
            {winner.projectName && (
              <p className="mt-1 text-muted">{winner.projectName}</p>
            )}
            {winner.awardName && (
              <p className={cx("mt-3 text-sm font-bold", style.accent)}>
                {winner.awardName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-subtle">최종 점수</p>
            <p className="text-3xl font-black tabular-nums">
              {formatScore(winner.finalScore)}
            </p>
          </div>
        </div>
      </Card>

      {rest.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">
              {TRACK_LABEL[track.track]} 트랙 전체 순위
            </caption>
            <thead>
              <tr className="border-b border-[var(--border-strong)] text-left">
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  순위
                </th>
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  팀
                </th>
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  수상
                </th>
                <th scope="col" className="py-2.5 text-right font-semibold">
                  최종 점수
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r) => (
                <tr key={r.teamId} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-3 font-bold tabular-nums">
                    {rankLabel(r.rank)}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="font-medium">{r.teamName}</span>
                    {r.projectName && (
                      <span className="ml-2 text-xs text-muted">{r.projectName}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-sm text-muted">{r.awardName ?? "–"}</td>
                  <td className="py-3 text-right font-semibold tabular-nums">
                    {formatScore(r.finalScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
