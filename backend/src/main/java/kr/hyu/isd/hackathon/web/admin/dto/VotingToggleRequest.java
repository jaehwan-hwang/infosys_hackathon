package kr.hyu.isd.hackathon.web.admin.dto;

import jakarta.validation.constraints.NotNull;
import kr.hyu.isd.hackathon.domain.team.Track;

/**
 * 발표 종료 후 운영진이 해당 트랙의 평가를 여닫는다.
 */
public record VotingToggleRequest(
        @NotNull Track track,
        boolean open
) {
}
