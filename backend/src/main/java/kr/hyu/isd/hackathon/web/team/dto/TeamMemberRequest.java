package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 조장이 등록 폼에서 입력하는 팀원 1명.
 */
public record TeamMemberRequest(
        @NotBlank(message = "팀원 성명은 필수입니다.")
        @Size(max = 50)
        String name,

        @NotBlank(message = "학번은 필수입니다.")
        @Pattern(regexp = "[0-9]{7,12}", message = "학번은 숫자 7~12자리여야 합니다.")
        String studentId,

        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email
) {
}
