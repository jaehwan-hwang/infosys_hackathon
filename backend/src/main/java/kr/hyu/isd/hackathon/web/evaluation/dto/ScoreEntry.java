package kr.hyu.isd.hackathon.web.evaluation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 평가 항목 하나에 매긴 점수.
 */
public record ScoreEntry(
        @NotNull(message = "평가 항목 ID는 필수입니다.")
        Long criterionId,

        @Min(value = 0, message = "점수는 0점 이상이어야 합니다.")
        int score
) {
}
