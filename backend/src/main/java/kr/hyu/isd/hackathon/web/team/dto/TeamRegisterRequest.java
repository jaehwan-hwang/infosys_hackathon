package kr.hyu.isd.hackathon.web.team.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.List;

/**
 * 팀 등록 요청. 요청자가 곧 조장이 된다.
 *
 * @param appliedTrack 참가자가 고른 트랙. 고른 값이 그대로 확정된다.
 * @param members      조장을 제외한 나머지 팀원
 */
public record TeamRegisterRequest(
        @NotBlank(message = "팀명은 필수입니다.")
        @Size(max = 60, message = "팀명은 60자 이하여야 합니다.")
        String name,

        @NotNull(message = "트랙 선택은 필수입니다.")
        Track appliedTrack,

        SelfCheckRequest selfCheck,

        @Valid
        List<TeamMemberRequest> members,

        /** 개인정보 수집·이용 동의. 동의 없이는 등록할 수 없다. */
        boolean privacyConsent
) {
}
