package kr.hyu.isd.hackathon.web.admin.dto;

import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * 교수가 남긴 코멘트 한 건. 운영진만 본다.
 *
 * 코멘트는 교수만 남길 수 있고 참가자에게는 보이지 않는다. 시상 때 전하거나 운영진이
 * 참고하려고 모아 본다. 어느 교수가 몇 점을 주며 남긴 말인지 함께 싣는다.
 */
public record ProfessorCommentResponse(
        Long teamId,
        String teamName,
        Track track,
        String professorName,
        BigDecimal totalScore,
        String comment,
        Instant evaluatedAt
) {

    public static ProfessorCommentResponse from(Evaluation e) {
        return new ProfessorCommentResponse(
                e.getTargetTeam().getId(),
                e.getTargetTeam().getName(),
                e.getTargetTeam().getTrack(),
                e.getEvaluator().getName(),
                e.getTotalScore(),
                e.getComment(),
                e.getEvaluatedAt());
    }
}
