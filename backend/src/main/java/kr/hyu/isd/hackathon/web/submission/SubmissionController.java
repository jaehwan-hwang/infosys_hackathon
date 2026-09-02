package kr.hyu.isd.hackathon.web.submission;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.submission.SubmissionService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.web.submission.dto.SubmissionRequest;
import kr.hyu.isd.hackathon.web.submission.dto.SubmissionResponse;
import kr.hyu.isd.hackathon.web.submission.dto.UploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    /** 산출물 저장 (조장 전용, 마감 전까지 덮어쓰기 가능) */
    @PutMapping("/me")
    public ApiResponse<SubmissionResponse> submit(@CurrentUser AuthPrincipal principal,
                                                  @Valid @RequestBody SubmissionRequest request) {
        return ApiResponse.success(submissionService.submit(principal.userId(), request));
    }

    /** 최종 제출 확정. 필수 항목이 비어 있으면 거부된다. */
    @PostMapping("/me/finalize")
    public ApiResponse<SubmissionResponse> finalizeSubmission(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(submissionService.finalizeSubmission(principal.userId()));
    }

    /** 내 팀 제출물. 아직 제출 전이면 data가 null이다. */
    @GetMapping("/me")
    public ApiResponse<SubmissionResponse> getMySubmission(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(submissionService.getMySubmission(principal.userId()));
    }

    /**
     * 제출 파일 업로드. 응답의 url을 제출 폼 해당 항목에 채워 넣는다.
     *
     * @param slot plan | prototype | source | deck | architecture | techspec
     */
    @PostMapping(value = "/me/files", consumes = "multipart/form-data")
    public ApiResponse<UploadResponse> upload(@CurrentUser AuthPrincipal principal,
                                              @RequestParam String slot,
                                              @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(submissionService.uploadFile(principal.userId(), slot, file));
    }

    /** 트랙별 제출물 목록 (평가 대상 선택용) */
    @GetMapping
    public ApiResponse<List<SubmissionResponse>> getSubmissions(@RequestParam Track track) {
        return ApiResponse.success(submissionService.getSubmissionsByTrack(track));
    }

    @GetMapping("/teams/{teamId}")
    public ApiResponse<SubmissionResponse> getTeamSubmission(@PathVariable Long teamId) {
        return ApiResponse.success(submissionService.getTeamSubmission(teamId));
    }
}
