package kr.hyu.isd.hackathon.web.auth.dto;

/**
 * @param accessToken   이후 API 호출에 쓸 자체 액세스 토큰
 * @param expiresIn     유효 기간(초)
 * @param user          로그인한 사용자 정보
 * @param profileNeeded 학번·성명 프로필 입력이 아직 필요한지
 */
public record LoginResponse(
        String accessToken,
        long expiresIn,
        UserResponse user,
        boolean profileNeeded
) {
}
