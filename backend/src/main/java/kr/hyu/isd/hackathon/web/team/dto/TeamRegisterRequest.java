package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.hyu.isd.hackathon.domain.team.RecruitStatus;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.List;

/**
 * 팀 등록 요청. 요청자가 곧 조장이 된다.
 *
 * @param appliedTrack 참가자가 고른 트랙. 고른 값이 그대로 확정된다.
 * @param members      등록하는 본인을 제외한 나머지 팀원
 * @param leaderEmail  팀장으로 지정할 사람의 이메일. 비우면 등록한 본인이 팀장이 된다.
 * @param recruiting   팀원을 더 찾는지, 팀장을 찾는지. 비우면 모집하지 않는 것으로 본다.
 * @param duesPaid     등록하는 본인의 학생회비 납부 여부
 */
public record TeamRegisterRequest(
        @NotBlank(message = "팀명은 필수입니다.")
        @Size(max = 20, message = "팀명은 20자 이하여야 합니다.")
        String name,

        @NotNull(message = "트랙 선택은 필수입니다.")
        Track appliedTrack,

        SelfCheckRequest selfCheck,

        @Valid
        List<TeamMemberRequest> members,

        @Size(max = 120)
        String leaderEmail,

        RecruitStatus recruiting,

        @Size(max = 150, message = "모집 글은 150자 이하여야 합니다.")
        String recruitNote,

        boolean duesPaid
) {
}
