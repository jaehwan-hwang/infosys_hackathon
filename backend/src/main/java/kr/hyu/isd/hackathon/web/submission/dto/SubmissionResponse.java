package kr.hyu.isd.hackathon.web.submission.dto;

import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public record SubmissionResponse(
        Long submissionId,
        Long teamId,
        String teamName,
        Track track,
        String projectName,
        String summary,
        String description,
        String planFileUrl,
        String prototypeUrl,
        String sourceCodeUrl,
        String deckFileUrl,
        String demoUrl,
        String deployUrl,
        String architectureFileUrl,
        String techSpecFileUrl,
        List<String> techStacks,
        Instant submittedAt,
        boolean complete,
        /** 아직 채워지지 않은 필수 항목 */
        List<String> missingRequirements
) {

    public static SubmissionResponse from(Submission s) {
        List<String> missing = s.findMissingRequirements();
        return new SubmissionResponse(
                s.getId(),
                s.getTeam().getId(),
                s.getTeam().getName(),
                s.getTeam().getTrack(),
                s.getProjectName(),
                s.getSummary(),
                s.getDescription(),
                s.getPlanFileUrl(),
                s.getPrototypeUrl(),
                s.getSourceCodeUrl(),
                s.getDeckFileUrl(),
                s.getDemoUrl(),
                s.getDeployUrl(),
                s.getArchitectureFileUrl(),
                s.getTechSpecFileUrl(),
                // 지연 로딩 컬렉션을 그대로 넘기면 트랜잭션이 끝난 뒤 JSON으로 쓰는 순간
                // 세션이 없어 터진다(open-in-view=false). 여기서 복사해 끊어낸다.
                new ArrayList<>(s.getTechStacks()),
                s.getSubmittedAt(),
                missing.isEmpty(),
                missing
        );
    }
}
