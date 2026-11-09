package kr.hyu.isd.hackathon.web.evaluation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 한 팀에 대한 평가 제출.
 * 평가는 팀당 한 번뿐이다 — 이미 평가한 팀을 다시 제출하면 거부한다.
 * 참가자는 항목별 점수(scores)를, 교수는 100점 만점 점수(totalScore)를 보낸다.
 */
public record EvaluationRequest(
        @NotNull(message = "평가 대상 팀은 필수입니다.")
        Long targetTeamId,

        /** 참가자 투표: 항목별 1~5점. 교수 평가에서는 쓰지 않는다. */
        @Valid
        List<ScoreEntry> scores,

        /** 교수 평가: 100점 만점 점수 하나. 참가자 투표에서는 쓰지 않는다. */
        @Min(value = 0, message = "점수는 0점 이상이어야 합니다.")
        @Max(value = 100, message = "점수는 100점까지입니다.")
        Integer totalScore,

        @Size(max = 1000)
        String comment
) {
}
