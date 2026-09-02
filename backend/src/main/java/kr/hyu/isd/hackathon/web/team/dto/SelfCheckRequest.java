package kr.hyu.isd.hackathon.web.team.dto;

import kr.hyu.isd.hackathon.domain.team.SelfCheck;

/**
 * 자가진단 응답. 프론트에서도 같은 규칙으로 결과를 즉시 보여주지만,
 * 최종 트랙 배정은 서버가 이 값으로 다시 계산한다.
 */
public record SelfCheckRequest(
        boolean workExperience,
        boolean awardHistory,
        boolean liveService,
        boolean apiExperience,
        boolean gitCollab,
        boolean advancedCourse,
        boolean externalApi
) {
    public SelfCheck toDomain() {
        return new SelfCheck(workExperience, awardHistory, liveService,
                apiExperience, gitCollab, advancedCourse, externalApi);
    }
}
