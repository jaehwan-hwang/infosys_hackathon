package kr.hyu.isd.hackathon.web.submission.dto;

import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.time.Instant;
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
                s.getTechStacks(),
                s.getSubmittedAt(),
                missing.isEmpty(),
                missing
        );
    }
}
