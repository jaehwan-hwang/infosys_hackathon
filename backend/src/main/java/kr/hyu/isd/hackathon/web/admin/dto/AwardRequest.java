package kr.hyu.isd.hackathon.web.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AwardRequest(
        @NotNull(message = "수상 팀은 필수입니다.")
        Long teamId,

        @NotBlank(message = "수상명은 필수입니다.")
        @Size(max = 60)
        String awardName,

        Integer awardRank
) {
}
