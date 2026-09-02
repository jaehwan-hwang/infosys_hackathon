package kr.hyu.isd.hackathon.web.evaluation.dto;

import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluationScore;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record EvaluationResponse(
        Long evaluationId,
        Long targetTeamId,
        String targetTeamName,
        EvaluatorType evaluatorType,
        BigDecimal totalScore,
        String comment,
        Instant evaluatedAt,
        List<ScoreEntry> scores
) {

    public static EvaluationResponse from(Evaluation evaluation) {
        List<ScoreEntry> scores = evaluation.getScores().stream()
                .map((EvaluationScore s) -> new ScoreEntry(s.getCriterion().getId(), s.getScore()))
                .toList();

        return new EvaluationResponse(
                evaluation.getId(),
                evaluation.getTargetTeam().getId(),
                evaluation.getTargetTeam().getName(),
                evaluation.getEvaluatorType(),
                evaluation.getTotalScore(),
                evaluation.getComment(),
                evaluation.getEvaluatedAt(),
                scores
        );
    }
}
