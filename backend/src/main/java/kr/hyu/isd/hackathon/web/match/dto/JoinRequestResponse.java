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

    /** 운영진용. 신청 내용을 그대로 본다. */
    public static JoinRequestResponse from(JoinRequest request) {
        return from(request, null, true);
    }

    public static JoinRequestResponse from(JoinRequest request, Long myTeamId) {
        boolean mine = request.getFromTeam() != null
                && request.getFromTeam().getId().equals(myTeamId);
        return from(request, myTeamId, mine);
    }

    /**
     * @param showMessage 신청하며 남긴 한마디를 내려줄지.
     *                    그 글은 운영진에게 남기는 것이라, 신청을 받은 팀에게는 가리고
     *                    보낸 팀 본인과 운영진에게만 보여 준다.
     */
    private static JoinRequestResponse from(JoinRequest request, Long myTeamId, boolean showMessage) {
        return new JoinRequestResponse(
                request.getId(),
                request.getFromTeam() != null ? request.getFromTeam().getId() : null,
                request.getFromTeamName(),
                request.getFromMemberCount(),
                request.getFromTeam() != null ? request.getFromTeam().getTrack() : null,
                request.getToTeam() != null ? request.getToTeam().getId() : null,
                request.getToTeamName(),
                showMessage ? request.getMessage() : null,
                request.getStatus(),
                request.getStatus().getLabel(),
                request.getHandledNote(),
                // 운영진 조회(myTeamId 없음)에서는 보낸/받은 구분이 의미 없다.
                // 보낸 팀이 합쳐져 사라졌으면 내가 보낸 것은 아니므로 false다.
                myTeamId == null ? null
                        : request.getFromTeam() != null
                                && request.getFromTeam().getId().equals(myTeamId),
                request.getCreatedAt()
        );
    }
}
