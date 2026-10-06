package kr.hyu.isd.hackathon.web.auth.dto;

import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;

public record UserResponse(
        Long userId,
        String email,
        String name,
        String studentId,
        String department,
        String phone,
        Role role,
        String roleLabel,
        /** 되돌리기 어려운 조작을 할 수 있는 최고 관리자인가 */
        boolean superAdmin,
        boolean profileCompleted,
        boolean privacyConsent
) {
    public static UserResponse from(User user) {
        return from(user, false);
    }

    public static UserResponse from(User user, boolean superAdmin) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getStudentId(),
                user.getDepartment(),
                user.getPhone(),
                user.getRole(),
                superAdmin ? "최고 관리자" : user.getRole().getLabel(),
                superAdmin,
                user.isProfileCompleted(),
                user.hasPrivacyConsent()
        );
    }
}
