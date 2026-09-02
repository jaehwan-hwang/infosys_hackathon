package kr.hyu.isd.hackathon.web.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.hyu.isd.hackathon.domain.user.Role;

/**
 * 교수·운영진 권한 부여. 설정 파일을 고치지 않고 대시보드에서 바로 처리한다.
 */
public record RoleUpdateRequest(
        @NotBlank @Email String email,
        @NotNull Role role
) {
}
