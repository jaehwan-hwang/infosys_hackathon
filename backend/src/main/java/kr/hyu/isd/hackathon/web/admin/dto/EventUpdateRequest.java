package kr.hyu.isd.hackathon.web.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * 행사 기본 정보·일정·규정 수정. 모든 시각은 UTC ISO-8601로 받는다.
 */
public record EventUpdateRequest(
        @NotBlank(message = "행사명은 필수입니다.")
        @Size(max = 100)
        String title,

        @Size(max = 200)
        String theme,

        @Size(max = 2000)
        String description,

        @Size(max = 200)
        String location,

        @Size(max = 300)
        String contactUrl,

        Instant registerStartsAt,
        Instant registerEndsAt,
        Instant sparkSubmitDeadline,
        Instant devSubmitDeadline,

        int minTeamSize,
        int maxTeamSize,
        int maxUploadMb
) {
}
