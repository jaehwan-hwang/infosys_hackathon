package kr.hyu.isd.hackathon.web.evaluation.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

/**
 * 평가 화면에 뿌릴 대상 팀 1개.
 * 이미 평가한 팀은 evaluated=true로 내려 프론트가 "수정" 상태로 보여준다.
 *
 * 팀이 낸 자료는 링크든 올린 파일이든 모두 내려준다. 평가자가 발표를 보며 결과물을
 * 직접 열어 확인할 수 있어야 하고, 트랙마다 필수 항목이 달라 팀마다 낸 것이 다르다.
 * 내지 않은 항목은 null이며, 화면은 그 버튼을 아예 띄우지 않는다.
 */
public record EvaluationTargetResponse(
        Long teamId,
        String teamName,
        Track track,
        String projectName,
        String summary,
        String deployUrl,
        String demoUrl,
        String sourceCodeUrl,
        String prototypeUrl,
        String deckFileUrl,
        String planFileUrl,
        String architectureFileUrl,
        String techSpecFileUrl,
        boolean evaluated
) {
}
