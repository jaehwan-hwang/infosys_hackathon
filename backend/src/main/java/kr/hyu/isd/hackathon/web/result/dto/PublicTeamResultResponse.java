package kr.hyu.isd.hackathon.web.result.dto;

import kr.hyu.isd.hackathon.domain.submission.Submission;

import java.math.BigDecimal;

/**
 * 리더보드에 올라가는 팀 한 줄.
 *
 * 전체 등수는 모두 보여주되, 점수는 수상한 팀 것만 내려보낸다. 수상 밖 팀의 점수까지
 * 공개하면 "몇 점 차로 못 받았다"가 그대로 드러난다. 등수만 밝히는 선에서 멈춘다.
 *
 * 리더보드에는 최종 점수 하나만 둔다. 교수·참가자 점수가 어떻게 섞이는지는 홈 화면에
 * 적어 두었으므로, 내역(교수 평균·참가자 평균)은 내려보내지 않는다.
 *
 * @param awarded    시상 등수 안에 든 팀인가 (Spark 1등, Sprint·Summit 3등까지)
 * @param finalScore 수상 팀만 채운다. 나머지는 null이다.
 * @param materials  팀이 낸 자료. 수상과 상관없이 모든 팀 것을 보낸다. 아무것도 내지 않았으면 null이다.
 */
public record PublicTeamResultResponse(
        int rank,
        Long teamId,
        String teamName,
        String projectName,
        String awardName,
        boolean awarded,
        BigDecimal finalScore,
        Materials materials
) {

    /** 팀이 낸 자료의 주소. 링크든 올린 파일이든 열 수 있는 주소이고, 내지 않은 칸은 null이다. */
    public record Materials(
            String deployUrl,
            String demoUrl,
            String sourceCodeUrl,
            String prototypeUrl,
            String deckFileUrl,
            String planFileUrl,
            String architectureFileUrl,
            String techSpecFileUrl
    ) {
        public static Materials from(Submission s) {
            return new Materials(s.getDeployUrl(), s.getDemoUrl(), s.getSourceCodeUrl(),
                    s.getPrototypeUrl(), s.getDeckFileUrl(), s.getPlanFileUrl(),
                    s.getArchitectureFileUrl(), s.getTechSpecFileUrl());
        }
    }
}
