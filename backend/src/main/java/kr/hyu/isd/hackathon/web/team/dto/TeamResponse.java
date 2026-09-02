package kr.hyu.isd.hackathon.web.team.dto;

import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record TeamResponse(
        Long teamId,
        String name,
        String topic,
        String description,
        Track track,
        String trackReason,
        Long leaderId,
        String leaderName,
        int memberCount,
        List<TeamMemberResponse> members,
        Instant createdAt
) {

    public static TeamResponse from(Team team) {
        List<TeamMemberResponse> members = team.getMembers().stream()
                // 조장을 항상 맨 앞에 둔다
                .sorted(Comparator.comparing(m -> !m.isLeader()))
                .map(TeamMemberResponse::from)
                .toList();

        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getTopic(),
                team.getDescription(),
                team.getTrack(),
                team.getTrackReason(),
                team.getLeader().getId(),
                team.getLeader().getName(),
                members.size(),
                members,
                team.getCreatedAt()
        );
    }

    /**
     * 평가 화면·공개 목록용 축약 응답.
     * 학번·이메일 같은 개인정보를 빼고 내려준다.
     */
    public static TeamResponse publicView(Team team) {
        List<TeamMemberResponse> members = team.getMembers().stream()
                .sorted(Comparator.comparing(m -> !m.isLeader()))
                .map(TeamMemberResponse::publicView)
                .toList();

        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getTopic(),
                team.getDescription(),
                team.getTrack(),
                null,
                team.getLeader().getId(),
                team.getLeader().getName(),
                members.size(),
                members,
                team.getCreatedAt()
        );
    }
}
