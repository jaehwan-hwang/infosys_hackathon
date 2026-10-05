package kr.hyu.isd.hackathon.web.result.dto;

/**
 * 리더보드에 올라가는 수상 팀 한 줄.
 *
 * 점수는 넣지 않는다. 시상은 등수만 밝히면 되고, 점수를 공개하면 "몇 점 차로 졌다"가
 * 드러나 참가자들 사이에 불필요한 비교가 생긴다. 운영진은 /admin 집계에서 그대로 본다.
 */
public record PublicTeamResultResponse(
        int rank,
        Long teamId,
        String teamName,
        String projectName,
        String awardName
) {
}
