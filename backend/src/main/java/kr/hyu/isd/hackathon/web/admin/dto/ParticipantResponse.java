package kr.hyu.isd.hackathon.web.admin.dto;

import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.team.Track;

/**
 * 운영진이 보는 참가자 한 명.
 *
 * 연락할 때 필요한 것(학번·전화번호·이메일)을 한 줄에 모은다.
 * 전화번호는 본인이 프로필에 넣는 값이라 아직 로그인하지 않은 팀원은 비어 있다.
 */
public record ParticipantResponse(
        Long teamMemberId,
        Long teamId,
        String teamName,
        Track track,
        String name,
        String studentId,
        String email,
        String phone,
        boolean leader,
        /** 계정이 연결됐는지. 아직이면 전화번호가 없다. */
        boolean linked,
        boolean duesPaid
) {

    public static ParticipantResponse from(Team team, TeamMember member) {
        return new ParticipantResponse(
                member.getId(),
                team.getId(),
                team.getName(),
                team.getTrack(),
                member.getName(),
                member.getStudentId(),
                member.getEmail(),
                member.getUser() != null ? member.getUser().getPhone() : null,
                member.isLeader(),
                member.getUser() != null,
                member.isDuesPaid()
        );
    }
}
