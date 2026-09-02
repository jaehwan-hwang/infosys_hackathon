package kr.hyu.isd.hackathon.web.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 한 팀에 대한 평가 제출.
 * 같은 팀을 다시 제출하면 기존 평가를 덮어쓴다(중복 집계되지 않는다).
 */
public record EvaluationRequest(
        @NotNull(message = "평가 대상 팀은 필수입니다.")
        Long targetTeamId,

        @Valid
        @NotEmpty(message = "평가 항목 점수는 필수입니다.")
        List<ScoreEntry> scores,

        @Size(max = 1000)
        String comment
) {
}
