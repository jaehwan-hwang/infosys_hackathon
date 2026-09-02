package kr.hyu.isd.hackathon.web.result.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.List;

/**
 * 트랙별 순위표.
 *
 * @param formula 이 트랙에 적용된 산식 설명. 결과 화면에 그대로 노출해 계산 근거를 밝힌다.
 */
public record TrackResultResponse(
        Track track,
        String formula,
        int teamCount,
        List<TeamResultResponse> results
) {
}
