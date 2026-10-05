package kr.hyu.isd.hackathon.web.match.dto;

import jakarta.validation.constraints.Size;

/**
 * 팀 합치기 신청.
 *
 * @param toTeamId 들어가고 싶은 팀. 비우면 "어느 팀이든 좋으니 합쳐 달라"는 신청이 된다.
 * @param message  운영진이 연락할 때 참고할 한마디
 */
public record JoinRequestCreateRequest(
        Long toTeamId,

        @Size(max = 500)
        String message
) {
}
