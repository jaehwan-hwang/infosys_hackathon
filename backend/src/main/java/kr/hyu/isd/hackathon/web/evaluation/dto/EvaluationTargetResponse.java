package kr.hyu.isd.hackathon.web.evaluation.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

/**
 * 평가 화면에 뿌릴 대상 팀 1개.
 * 이미 평가한 팀은 evaluated=true로 내려 프론트가 "수정" 상태로 보여준다.
 */
public record EvaluationTargetResponse(
        Long teamId,
        String teamName,
        String topic,
        Track track,
        String projectName,
        String summary,
        String deployUrl,
        String demoUrl,
        boolean evaluated
) {
}
