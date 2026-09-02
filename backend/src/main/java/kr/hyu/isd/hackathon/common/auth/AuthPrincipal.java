package kr.hyu.isd.hackathon.common.auth;

import kr.hyu.isd.hackathon.domain.user.Role;

/**
 * 인증된 요청의 주체. SecurityContext에 담겨 컨트롤러까지 전달된다.
 */
public record AuthPrincipal(Long userId, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean isProfessor() {
        return role == Role.PROFESSOR;
    }
}
