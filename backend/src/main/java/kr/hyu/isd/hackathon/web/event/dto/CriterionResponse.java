package kr.hyu.isd.hackathon.web.event.dto;

import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.math.BigDecimal;

public record CriterionResponse(
        Long criterionId,
        Track track,
        EvaluatorType evaluatorType,
        String name,
        String description,
        int maxScore,
        BigDecimal weight,
        int displayOrder
) {
    public static CriterionResponse from(Criterion criterion) {
        return new CriterionResponse(
                criterion.getId(),
                criterion.getTrack(),
                criterion.getEvaluatorType(),
                criterion.getName(),
                criterion.getDescription(),
                criterion.getMaxScore(),
                criterion.getWeight(),
                criterion.getDisplayOrder()
        );
    }
}
