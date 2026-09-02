package kr.hyu.isd.hackathon.web.admin.dto;

import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.web.team.dto.TeamMemberResponse;

import java.time.Instant;
import java.util.List;

/**
 * 운영진이 보는 팀 1행. 제출 현황이 함께 붙는다.
 */
public record TeamAdminResponse(
        Long teamId,
        String teamName,
        String topic,
        Track track,
        String trackReason,
        String leaderName,
        String leaderEmail,
        int memberCount,
        List<TeamMemberResponse> members,
        boolean submitted,
        boolean submissionComplete,
        List<String> missingRequirements,
        Instant submittedAt,
        Instant createdAt
) {
}
