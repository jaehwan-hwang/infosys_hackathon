package kr.hyu.isd.hackathon.web.team.dto;

import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.team.TeamMemberRole;

public record TeamMemberResponse(
        Long teamMemberId,
        Long userId,
        String name,
        String studentId,
        String email,
        TeamMemberRole role,
        /** 이 팀원이 서비스에 로그인해 계정이 연결됐는지 */
        boolean linked
) {

    public static TeamMemberResponse from(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                member.getUser() != null ? member.getUser().getId() : null,
                member.getName(),
                member.getStudentId(),
                member.getEmail(),
                member.getRole(),
                member.getUser() != null
        );
    }

    /** 개인정보(학번·이메일)를 가린 공개용 */
    public static TeamMemberResponse publicView(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                null,
                member.getName(),
                null,
                null,
                member.getRole(),
                member.getUser() != null
        );
    }
}
