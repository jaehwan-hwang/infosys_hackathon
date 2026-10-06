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

    /**
     * 우리 팀에게 보여 주는 내용.
     *
     * 학생회비 납부 여부는 빼고 내려준다 — 돈을 냈는지 안 냈는지는 같은 팀원이라도
     * 알 이유가 없고, 미납이 휴학 사실까지 드러낸다. 운영진만 adminView로 본다.
     * 학번은 입학년도까지만 보낸다.
     */
    public static TeamMemberResponse from(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                member.getUser() != null ? member.getUser().getId() : null,
                member.getName(),
                maskStudentId(member.getStudentId()),
                member.getEmail(),
                member.getRole(),
                member.getUser() != null,
                null
        );
    }

    /** 운영진용. 학번 전체와 학생회비 납부 여부까지 본다. */
    public static TeamMemberResponse adminView(TeamMember member) {
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
     * 다른 팀에게 보여 주는 내용.
     *
     * 팀을 합치려면 누가 있는 팀인지 알아볼 수 있어야 해서 이름과 입학년도까지는 준다.
     * 이메일·학번 뒷자리·학생회비 납부 여부는 주지 않는다.
     */
    public static TeamMemberResponse publicView(TeamMember member) {
        return new TeamMemberResponse(
                member.getId(),
                null,
                member.getName(),
                maskStudentId(member.getStudentId()),
                null,
                member.getRole(),
                member.getUser() != null,
                null
        );
    }

    /** 학번에서 입학년도만 남긴다 (2024******). */
    private static String maskStudentId(String studentId) {
        if (studentId == null || studentId.length() <= 4) return studentId;
        return studentId.substring(0, 4) + "*".repeat(studentId.length() - 4);
    }
}
