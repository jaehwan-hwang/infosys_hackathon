package kr.hyu.isd.hackathon.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * 자체 액세스 토큰 발급·검증.
 *
 * Google ID 토큰은 로그인 순간에만 쓰고, 이후 모든 API 호출은
 * 여기서 발급한 토큰으로 인증한다. 권한(role)을 토큰에 담아두면
 * 매 요청마다 사용자 조회를 하지 않아도 되지만, 권한이 바뀐 직후에는
 * 재로그인이 필요하다는 점을 감안해 유효 기간을 짧게 잡는다.
 */
@Component
public class JwtProvider {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey key;
    private final long expirySeconds;

    public JwtProvider(AuthProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.jwtSecret().getBytes(StandardCharsets.UTF_8));
        this.expirySeconds = properties.jwtExpirySeconds();
    }

    /** 로그인 성공 시 액세스 토큰을 발급한다. */
    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirySeconds)))
                .signWith(key)
                .compact();
    }

    /** 토큰을 검증하고 주체를 복원한다. 만료/위조 시 예외를 던진다. */
    public AuthPrincipal parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return new AuthPrincipal(
                    Long.valueOf(claims.getSubject()),
                    claims.get(CLAIM_EMAIL, String.class),
                    Role.valueOf(claims.get(CLAIM_ROLE, String.class))
            );
        } catch (ExpiredJwtException e) {
            throw new HackathonException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new HackathonException(ErrorCode.INVALID_TOKEN);
        }
    }

    public long getExpirySeconds() {
        return expirySeconds;
    }
}
