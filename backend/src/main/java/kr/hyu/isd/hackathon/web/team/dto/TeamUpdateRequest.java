package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TeamUpdateRequest(
        @NotBlank(message = "팀명은 필수입니다.")
        @Size(max = 60)
        String name,

        @Size(max = 200)
        String topic,

        @Size(max = 1000)
        String description
) {
}
