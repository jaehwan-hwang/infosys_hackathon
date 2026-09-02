package kr.hyu.isd.hackathon.web.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 프론트에서 Google 로그인으로 받은 ID 토큰을 넘겨 세션을 시작한다.
 */
public record GoogleLoginRequest(
        @NotBlank(message = "idToken은 필수입니다.")
        String idToken
) {
}
