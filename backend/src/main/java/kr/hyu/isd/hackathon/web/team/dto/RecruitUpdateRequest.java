package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.hyu.isd.hackathon.domain.team.RecruitStatus;

/** 모집 상태 변경 요청 */
public record RecruitUpdateRequest(
        @NotNull(message = "모집 상태는 필수입니다.")
        RecruitStatus recruiting,

        @Size(max = 150, message = "모집 글은 150자 이하여야 합니다.")
        String recruitNote
) {
}
