package kr.hyu.isd.hackathon.web.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 최초 로그인 후 1회 수집하는 프로필.
 *
 * 개인정보 수집·이용 동의를 여기서 본인에게 직접 받는다.
 */
public record ProfileRequest(
        @NotBlank(message = "성명은 필수입니다.")
        @Size(max = 50, message = "성명은 50자 이하여야 합니다.")
        String name,

        @NotBlank(message = "학번은 필수입니다.")
        @Pattern(regexp = "[0-9]{7,12}", message = "학번은 숫자 7~12자리여야 합니다.")
        String studentId,

        @Size(max = 50, message = "학과명은 50자 이하여야 합니다.")
        String department,

        @NotBlank(message = "전화번호는 필수입니다.")
        @Pattern(regexp = "01[0-9]-?[0-9]{3,4}-?[0-9]{4}",
                message = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)")
        String phone,

        /** 개인정보 수집·이용 동의. 동의하지 않으면 프로필을 저장할 수 없다. */
        boolean privacyConsent
) {
}
