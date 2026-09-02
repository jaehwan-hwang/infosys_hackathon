package kr.hyu.isd.hackathon.web.submission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 산출물 제출 요청.
 *
 * 모든 트랙의 필드를 한 DTO로 받되, 어떤 항목이 필수이고 어떤 항목이 금지인지는
 * 팀의 트랙에 따라 서버가 판정한다(Submission.findMissingRequirements 참고).
 * 프론트는 트랙에 맞는 입력란만 보여주지만, 검증은 서버 판정이 최종이다.
 */
public record SubmissionRequest(
        @NotBlank(message = "프로젝트명은 필수입니다.")
        @Size(max = 100)
        String projectName,

        @NotBlank(message = "한 줄 요약은 필수입니다.")
        @Size(max = 300)
        String summary,

        @Size(max = 3000)
        String description,

        // Spark
        String planFileUrl,
        String prototypeUrl,

        // Sprint / Summit
        String sourceCodeUrl,
        String deckFileUrl,
        String demoUrl,

        // Summit
        String deployUrl,
        String architectureFileUrl,
        String techSpecFileUrl,

        List<String> techStacks
) {
}
