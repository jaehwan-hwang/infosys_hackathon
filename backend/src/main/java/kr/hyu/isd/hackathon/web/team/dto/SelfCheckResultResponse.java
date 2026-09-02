package kr.hyu.isd.hackathon.web.team.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

/**
 * 자가진단 결과 미리보기. 등록 전에 권장 트랙을 안내하는 용도다.
 */
public record SelfCheckResultResponse(
        Track resolvedTrack,
        boolean instantSummit,
        int checkedCount,
        String reason
) {
}
