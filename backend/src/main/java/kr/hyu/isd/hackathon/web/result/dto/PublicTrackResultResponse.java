package kr.hyu.isd.hackathon.web.result.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.List;

/**
 * 리더보드의 트랙 한 칸.
 *
 * 공개 전에는 published=false에 winners가 비어 있다. 공개 전 순위를 아예 내려보내지
 * 않아야, 주소를 직접 쳐 보거나 응답을 열어 봐도 결과가 새지 않는다.
 *
 * @param awardCount 이 트랙이 시상하는 등수 (Spark 1등까지, Sprint·Summit 3등까지)
 */
public record PublicTrackResultResponse(
        Track track,
        boolean published,
        int awardCount,
        List<PublicTeamResultResponse> winners
) {

    public static PublicTrackResultResponse hidden(Track track) {
        return new PublicTrackResultResponse(track, false, track.getAwardCount(), List.of());
    }
}
