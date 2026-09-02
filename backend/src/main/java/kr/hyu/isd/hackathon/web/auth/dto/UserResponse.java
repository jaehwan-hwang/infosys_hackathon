package kr.hyu.isd.hackathon.web.auth.dto;

import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;

public record UserResponse(
        Long userId,
        String email,
        String name,
        String studentId,
        String department,
        Role role,
        boolean profileCompleted
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getStudentId(),
                user.getDepartment(),
                user.getRole(),
                user.isProfileCompleted()
        );
    }
}
