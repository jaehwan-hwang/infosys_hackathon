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

        return new GoogleIdentity(email.toLowerCase(), cleanName(jwt.getClaimAsString("name"), email));
    }

    /**
     * 구글 표시 이름에서 사람 이름만 남긴다.
     *
     * 한양대 계정은 "황재환 | 정보시스템학과 | 한양대(서울)"처럼 소속을 붙여 보내고,
     * 앞에 보이지 않는 제어 문자가 섞여 오기도 한다. 그대로 두면 참가자 명단과
     * 화면 곳곳에 소속까지 따라붙으므로 첫 구분자 앞까지만 취한다.
     * (프론트의 cleanPersonName과 같은 규칙이다)
     */
    private static String cleanName(String raw, String fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        String cleaned = raw.replaceAll("[­​-‏﻿]", "")
                .split("[|/·,(]", 2)[0]
                .trim();
        return cleaned.isEmpty() ? fallback : cleaned;
    }

    public record GoogleIdentity(String email, String name) {
    }
}
