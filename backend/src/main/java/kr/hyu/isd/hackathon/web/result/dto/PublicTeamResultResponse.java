package kr.hyu.isd.hackathon.web.result.dto;

import java.math.BigDecimal;

/**
 * 리더보드에 올라가는 팀 한 줄.
 *
 * 전체 등수는 모두 보여주되, 점수는 수상한 팀 것만 내려보낸다. 수상 밖 팀의 점수까지
 * 공개하면 "몇 점 차로 못 받았다"가 그대로 드러난다. 등수만 밝히는 선에서 멈춘다.
 *
 * @param awarded          시상 등수 안에 든 팀인가 (Spark 1등, Sprint·Summit 3등까지)
 * @param finalScore       수상 팀만 채운다. 나머지는 null이다.
 * @param professorAverage 교수 평가가 있는 Summit의 수상 팀만 채운다.
 */
public record PublicTeamResultResponse(
        int rank,
        Long teamId,
        String teamName,
        String projectName,
        String awardName,
        boolean awarded,
        BigDecimal finalScore,
        BigDecimal studentAverage,
        BigDecimal professorAverage
) {
}
