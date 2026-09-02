package kr.hyu.isd.hackathon.common.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * 인증 관련 설정. application.yml의 app.auth.* 를 바인딩한다.
 *
 * @param jwtSecret        자체 액세스 토큰 서명 키 (HS256, 최소 32바이트)
 * @param jwtExpirySeconds 액세스 토큰 유효 기간
 * @param googleClientId   Google OAuth 클라이언트 ID. ID 토큰의 aud 클레임과 대조한다.
 * @param allowedDomains   로그인을 허용할 이메일 도메인 목록
 * @param adminEmails      최초 기동 시 ADMIN 권한을 부여할 이메일 목록
 * @param professorEmails  최초 기동 시 PROFESSOR 권한을 부여할 이메일 목록
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        String jwtSecret,
        long jwtExpirySeconds,
        String googleClientId,
        List<String> allowedDomains,
        List<String> adminEmails,
        List<String> professorEmails
) {

    public AuthProperties {
        if (allowedDomains == null || allowedDomains.isEmpty()) {
            allowedDomains = List.of("hanyang.ac.kr");
        }
        if (adminEmails == null) adminEmails = List.of();
        if (professorEmails == null) professorEmails = List.of();
        if (jwtExpirySeconds <= 0) jwtExpirySeconds = 60 * 60 * 12; // 기본 12시간
    }

    /** 해당 이메일이 허용 도메인에 속하는가 */
    public boolean isDomainAllowed(String email) {
        if (email == null) return false;
        String lower = email.toLowerCase();
        return allowedDomains.stream().anyMatch(d -> lower.endsWith("@" + d.toLowerCase()));
    }
}
