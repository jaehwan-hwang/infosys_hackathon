package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.common.auth.AuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 배포할 때 빠뜨리면 치명적인 설정을 기동 시점에 잡는다.
 *
 * 특히 JWT 서명 키가 문제다. 기본값은 저장소에 그대로 적혀 있으므로, 이 값을 쓴 채
 * 외부에 열면 누구나 운영진 토큰을 만들어 낼 수 있다. 로컬 H2로 띄울 때는 경고만 하고,
 * 실제 DB(Postgres 등)를 보고 있으면 기동을 멈춘다 — 조용히 뜨는 쪽이 더 위험하다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductionGuard {

    /** application.yml에 적힌 개발용 기본 키 */
    private static final String DEV_JWT_SECRET =
            "local-development-only-secret-key-change-me-in-production";

    private final AuthProperties authProperties;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @EventListener(ApplicationReadyEvent.class)
    public void check() {
        boolean localDatabase = datasourceUrl.startsWith("jdbc:h2:");
        boolean defaultSecret = DEV_JWT_SECRET.equals(authProperties.jwtSecret());

        if (defaultSecret && !localDatabase) {
            throw new IllegalStateException("""
                    JWT_SECRET이 개발용 기본값 그대로입니다.
                    이 키는 저장소에 공개돼 있어, 그대로 배포하면 누구나 운영진 권한 토큰을 만들 수 있습니다.
                    32바이트 이상의 임의 문자열을 JWT_SECRET 환경변수로 넣고 다시 띄워 주세요.""");
        }

        if (defaultSecret) {
            log.warn("JWT_SECRET이 개발용 기본값입니다. 배포 전에 반드시 바꾸세요.");
        }
        if (authProperties.googleClientId() == null || authProperties.googleClientId().isBlank()) {
            log.warn("GOOGLE_CLIENT_ID가 비어 있어 구글 토큰의 대상(aud) 검사를 건너뜁니다.");
        }
        if (authProperties.adminEmails().isEmpty()) {
            log.warn("ADMIN_EMAILS가 비어 있습니다. 운영진 대시보드에 들어갈 수 있는 계정이 없습니다.");
        }
    }
}
