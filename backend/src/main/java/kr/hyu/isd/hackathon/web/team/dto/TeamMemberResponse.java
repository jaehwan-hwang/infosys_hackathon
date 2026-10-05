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
        boolean linked,
        /** 학생회비 납부 여부. 공개용에서는 내려주지 않는다. */
        Boolean duesPaid
) {

    public static TeamMemberResponse from(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                member.getUser() != null ? member.getUser().getId() : null,
                member.getName(),
                member.getStudentId(),
                member.getEmail(),
                member.getRole(),
                member.getUser() != null,
                member.isDuesPaid()
        );
    }

    /**
     * 공개용. 이름과 학번까지만 내려준다.
     *
     * 팀을 합치려면 누가 있는 팀인지 알아볼 수 있어야 해서 학번을 함께 보여준다.
     * 이메일과 학생회비 납부 여부는 우리 팀과 운영진만 본다.
     */
    public static TeamMemberResponse publicView(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                null,
                member.getName(),
                member.getStudentId(),
                null,
                member.getRole(),
                member.getUser() != null,
                null
        );
    }
}
