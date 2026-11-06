package kr.hyu.isd.hackathon.common.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 구글 없이 들어가는 테스트 로그인을 쓸 수 있는가.
 *
 * 화면을 학생·교수·운영진 눈으로 번갈아 보며 시험하려면 구글 계정이 셋 필요한데, 로그인은
 * 학교 계정으로만 된다. 그래서 로컬에서만 이메일 하나로 바로 들어가는 길을 둔다.
 *
 * 잠금이 두 겹이다. 환경변수(DEV_LOGIN_ENABLED)로 켜야 하고, 켜도 로컬 DB(H2)일 때만
 * 열린다. 운영 DB에 붙은 서버에서 켜면 ProductionGuard가 기동을 막는다 — 이 길이 운영에
 * 열리면 아무 이메일로나 운영진이 될 수 있다.
 */
@Component
public class DevLoginGate {

    private final boolean enabled;

    public DevLoginGate(@Value("${app.auth.dev-login-enabled:false}") boolean flag,
                        @Value("${spring.datasource.url}") String datasourceUrl) {
        this.enabled = flag && datasourceUrl.startsWith("jdbc:h2:");
    }

    public boolean isEnabled() {
        return enabled;
    }
}
