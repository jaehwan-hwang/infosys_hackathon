package kr.hyu.isd.hackathon.web.result.dto;

import java.math.BigDecimal;

/**
 * 리더보드에 올라가는 수상 팀 한 줄.
 *
 * 점수는 수상 팀 것만 나간다. 시상 등수 밖 팀은 애초에 이 목록에 담기지 않으므로,
 * 떨어진 팀의 점수는 어디에도 드러나지 않는다.
 *
 * @param professorAverage 교수 평가가 있는 Summit에서만 채운다. 나머지 트랙은 null이다.
 */
public record PublicTeamResultResponse(
        int rank,
        Long teamId,
        String teamName,
        String projectName,
        String awardName,
        BigDecimal finalScore,
        BigDecimal studentAverage,
        BigDecimal professorAverage
) {
}
