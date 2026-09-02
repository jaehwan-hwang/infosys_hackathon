package kr.hyu.isd.hackathon.web.admin.dto;

import jakarta.validation.constraints.*;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.math.BigDecimal;

/**
 * 평가 항목 생성·수정.
 * 한 트랙·평가자유형 안에서 weight 합이 1.0이 되도록 서버가 검사한다.
 */
public record CriterionRequest(
        @NotNull Track track,
        @NotNull EvaluatorType evaluatorType,

        @NotBlank(message = "항목명은 필수입니다.")
        @Size(max = 100)
        String name,

        @Size(max = 300)
        String description,

        @Min(value = 1, message = "만점은 1점 이상이어야 합니다.")
        @Max(value = 100, message = "만점은 100점 이하여야 합니다.")
        int maxScore,

        @NotNull(message = "가중치는 필수입니다.")
        @DecimalMin(value = "0.0", inclusive = false, message = "가중치는 0보다 커야 합니다.")
        @DecimalMax(value = "1.0", message = "가중치는 1.0 이하여야 합니다.")
        BigDecimal weight,

        @Min(0)
        int displayOrder
) {
}
