package kr.hyu.isd.hackathon.web.match.dto;

import kr.hyu.isd.hackathon.domain.match.JoinRequest;
import kr.hyu.isd.hackathon.domain.match.JoinRequestStatus;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.time.Instant;

/**
 * 합류 신청 1건.
 *
 * @param outgoing 내 팀이 보낸 신청인가. 받은 신청과 보낸 신청을 한 목록에 섞어 보여줄 때 쓴다.
 */
public record JoinRequestResponse(
        Long joinRequestId,
        Long fromTeamId,
        String fromTeamName,
        int fromTeamMemberCount,
        Track fromTeamTrack,
        Long toTeamId,
        String toTeamName,
        String message,
        JoinRequestStatus status,
        String statusLabel,
        String handledNote,
        Boolean outgoing,
        Instant createdAt
) {

    public static JoinRequestResponse from(JoinRequest request) {
        return from(request, null);
    }

    public static JoinRequestResponse from(JoinRequest request, Long myTeamId) {
        return new JoinRequestResponse(
                request.getId(),
                request.getFromTeam() != null ? request.getFromTeam().getId() : null,
                request.getFromTeamName(),
                request.getFromMemberCount(),
                request.getFromTeam() != null ? request.getFromTeam().getTrack() : null,
                request.getToTeam() != null ? request.getToTeam().getId() : null,
                request.getToTeamName(),
                request.getMessage(),
                request.getStatus(),
                request.getStatus().getLabel(),
                request.getHandledNote(),
                myTeamId != null && request.getFromTeam() != null
                        ? request.getFromTeam().getId().equals(myTeamId) : null,
                request.getCreatedAt()
        );
    }
}
