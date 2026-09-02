package kr.hyu.isd.hackathon.common.auth;

import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

/**
 * 프론트에서 받은 Google ID 토큰을 검증하고 신원 정보를 꺼낸다.
 *
 * 서명·발급자·만료는 Spring Security의 JwtDecoder(Google JWKS)가 확인하고,
 * 여기서는 그 위에 이 서비스만의 조건 — 대상 클라이언트(aud), 이메일 인증 여부,
 * 허용 도메인 — 을 추가로 검사한다.
 */
@Slf4j
@Component
public class GoogleIdTokenVerifier {

    private final JwtDecoder googleJwtDecoder;
    private final AuthProperties authProperties;

    public GoogleIdTokenVerifier(JwtDecoder googleJwtDecoder, AuthProperties authProperties) {
        this.googleJwtDecoder = googleJwtDecoder;
        this.authProperties = authProperties;
    }

    /**
     * @return 검증에 성공한 Google 계정 정보
     * @throws HackathonException 토큰이 유효하지 않거나 허용 도메인이 아닌 경우
     */
    public GoogleIdentity verify(String idToken) {
        Jwt jwt;
        try {
            jwt = googleJwtDecoder.decode(idToken);
        } catch (JwtException e) {
            log.warn("Google ID 토큰 검증 실패: {}", e.getMessage());
            throw new HackathonException(ErrorCode.INVALID_ID_TOKEN);
        }

        // aud: 이 토큰이 우리 클라이언트를 위해 발급된 것인지 확인한다.
        // 확인하지 않으면 다른 서비스용으로 발급된 유효한 토큰도 통과해 버린다.
        String expectedClientId = authProperties.googleClientId();
        if (expectedClientId != null && !expectedClientId.isBlank()
                && !jwt.getAudience().contains(expectedClientId)) {
            log.warn("Google ID 토큰의 aud 불일치: {}", jwt.getAudience());
            throw new HackathonException(ErrorCode.INVALID_ID_TOKEN);
        }

        String email = jwt.getClaimAsString("email");
        Boolean emailVerified = jwt.getClaim("email_verified");
        if (email == null || !Boolean.TRUE.equals(emailVerified)) {
            throw new HackathonException(ErrorCode.INVALID_ID_TOKEN);
        }

        if (!authProperties.isDomainAllowed(email)) {
            throw new HackathonException(ErrorCode.DOMAIN_NOT_ALLOWED);
        }

        String name = jwt.getClaimAsString("name");
        return new GoogleIdentity(email.toLowerCase(), name != null ? name : email);
    }

    public record GoogleIdentity(String email, String name) {
    }
}
