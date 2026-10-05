import type { Metadata } from "next";
import { LeaderboardBoard } from "@/components/leaderboard-board";
import { ApiError, publicApi } from "@/lib/api";
import type { PublicTrackResult } from "@/lib/types";
import { Alert, Section } from "@/components/ui";

export const metadata: Metadata = { title: "리더보드" };

// 공개 시점이 운영진 토글에 달려 있어 캐시하지 않는다.
export const dynamic = "force-dynamic";

/**
 * 리더보드.
 *
 * 트랙을 골라 보는 화면이다. 세 트랙을 한 번에 늘어놓으면 아직 시상하지 않은
 * 트랙의 "시상 기간이 아닙니다"가 자리만 차지한다. 팀 목록의 트랙 분류 버튼과 같은
 * 모양으로 고르게 했다.
 *
 * 서버가 내려주는 것은 시상 등수까지다. 등수 밖 팀은 목록에 없으므로 점수도 없다.
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
          : "트랙별 수상 팀입니다."
      }
    >
      <LeaderboardBoard tracks={tracks} />
    </Section>
  );
}
