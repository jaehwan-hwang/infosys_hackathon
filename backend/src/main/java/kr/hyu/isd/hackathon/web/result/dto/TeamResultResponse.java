package kr.hyu.isd.hackathon.web.result.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

import java.math.BigDecimal;

/**
 * 팀 하나의 집계 결과.
 *
 * Spark/Sprint는 학생 투표 평균이 그대로 최종 점수이고,
 * Summit은 교수 평균 70% + 학생 평균 30%로 합산한다.
 */
public record TeamResultResponse(
        int rank,
        Long teamId,
        String teamName,
        Track track,
        String projectName,
        BigDecimal studentAverage,
        int studentVoterCount,
        BigDecimal professorAverage,
        int professorVoterCount,
        BigDecimal finalScore,
        String awardName
) {
}
