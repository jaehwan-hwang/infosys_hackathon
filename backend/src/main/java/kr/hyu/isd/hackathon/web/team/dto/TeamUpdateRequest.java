package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 팀 수정 요청. 지금 고칠 수 있는 것은 팀명뿐이다. */
public record TeamUpdateRequest(
        @NotBlank(message = "팀명은 필수입니다.")
        @Size(max = 20, message = "팀명은 20자 이하여야 합니다.")
        String name
) {
}
