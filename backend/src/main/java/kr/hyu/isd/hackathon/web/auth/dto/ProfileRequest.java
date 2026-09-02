package kr.hyu.isd.hackathon.web.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 최초 로그인 후 1회 수집하는 프로필.
 */
public record ProfileRequest(
        @NotBlank(message = "성명은 필수입니다.")
        @Size(max = 50, message = "성명은 50자 이하여야 합니다.")
        String name,

        @NotBlank(message = "학번은 필수입니다.")
        @Pattern(regexp = "[0-9]{7,12}", message = "학번은 숫자 7~12자리여야 합니다.")
        String studentId,

        @Size(max = 50, message = "학과명은 50자 이하여야 합니다.")
        String department
) {
}
