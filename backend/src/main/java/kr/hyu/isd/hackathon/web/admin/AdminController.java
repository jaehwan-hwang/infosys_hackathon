package kr.hyu.isd.hackathon.web.admin;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.admin.AdminService;
import kr.hyu.isd.hackathon.application.admin.CsvExportService;
import kr.hyu.isd.hackathon.application.result.ResultService;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.web.admin.dto.*;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import kr.hyu.isd.hackathon.web.event.dto.EventResponse;
import kr.hyu.isd.hackathon.web.result.dto.TrackResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/**
 * 학생회 운영진 대시보드 API.
 * 이 경로 전체가 SecurityConfig에서 ROLE_ADMIN으로 막혀 있다.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CsvExportService csvExportService;
    private final ResultService resultService;

    // ---- 대시보드 ----

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> getDashboard() {
        return ApiResponse.success(adminService.getDashboard());
    }

    /** 전체 팀 목록 + 제출 현황 */
    @GetMapping("/teams")
    public ApiResponse<List<TeamAdminResponse>> getTeams() {
        return ApiResponse.success(adminService.getTeams());
    }

    /** 트랙 자동 배정 결과 수동 정정 */
    @PatchMapping("/teams/{teamId}/track")
    public ApiResponse<TeamAdminResponse> overrideTrack(@PathVariable Long teamId,
                                                        @RequestParam Track track,
                                                        @RequestParam(required = false) String reason) {
        return ApiResponse.success(adminService.overrideTrack(teamId, track, reason));
    }

    // ---- 행사 설정 ----

    @PutMapping("/event")
    public ApiResponse<EventResponse> updateEvent(@Valid @RequestBody EventUpdateRequest request) {
        return ApiResponse.success(adminService.updateEvent(request));
    }

    /** 발표 종료 후 트랙별 평가 열기/닫기 */
    @PostMapping("/event/voting")
    public ApiResponse<EventResponse> toggleVoting(@Valid @RequestBody VotingToggleRequest request) {
        return ApiResponse.success(adminService.toggleVoting(request));
    }

    /** 시상식에서 결과 공개 */
    @PostMapping("/event/publish")
    public ApiResponse<EventResponse> publishResults(@RequestParam boolean published) {
        return ApiResponse.success(adminService.publishResults(published));
    }

    // ---- 평가 항목 ----

    @GetMapping("/criteria")
    public ApiResponse<List<CriterionResponse>> getCriteria() {
        return ApiResponse.success(adminService.getCriteria());
    }

    @PostMapping("/criteria")
    public ApiResponse<CriterionResponse> createCriterion(@Valid @RequestBody CriterionRequest request) {
        return ApiResponse.success(adminService.createCriterion(request));
    }

    @PutMapping("/criteria/{criterionId}")
    public ApiResponse<CriterionResponse> updateCriterion(@PathVariable Long criterionId,
                                                          @Valid @RequestBody CriterionRequest request) {
        return ApiResponse.success(adminService.updateCriterion(criterionId, request));
    }

    @DeleteMapping("/criteria/{criterionId}")
    public ApiResponse<Void> deleteCriterion(@PathVariable Long criterionId) {
        adminService.deleteCriterion(criterionId);
        return ApiResponse.successWithMsg("평가 항목을 삭제했습니다.");
    }

    /** 가중치 합이 1.0이 아닌 트랙을 알려준다. 비어 있으면 정상. */
    @GetMapping("/criteria/validate")
    public ApiResponse<List<String>> validateCriteria() {
        return ApiResponse.success(adminService.validateCriteriaWeights());
    }

    // ---- 결과 ----

    /** 공개 여부와 무관한 내부 집계 */
    @GetMapping("/results")
    public ApiResponse<List<TrackResultResponse>> getResults() {
        return ApiResponse.success(resultService.getResultsForAdmin());
    }

    @GetMapping("/results/{track}")
    public ApiResponse<TrackResultResponse> getTrackResult(@PathVariable Track track) {
        return ApiResponse.success(resultService.getTrackResultForAdmin(track));
    }

    // ---- 수상 ----

    @PostMapping("/awards")
    public ApiResponse<Void> createAward(@Valid @RequestBody AwardRequest request) {
        adminService.createAward(request);
        return ApiResponse.successWithMsg("수상 내역을 등록했습니다.");
    }

    @DeleteMapping("/awards/{awardId}")
    public ApiResponse<Void> deleteAward(@PathVariable Long awardId) {
        adminService.deleteAward(awardId);
        return ApiResponse.successWithMsg("수상 내역을 삭제했습니다.");
    }

    // ---- 권한 ----

    @GetMapping("/staff")
    public ApiResponse<List<UserResponse>> getStaff() {
        return ApiResponse.success(adminService.getStaff());
    }

    /** 교수·운영진 권한 부여 */
    @PutMapping("/staff")
    public ApiResponse<UserResponse> updateRole(@Valid @RequestBody RoleUpdateRequest request) {
        return ApiResponse.success(adminService.updateRole(request));
    }

    // ---- CSV 내보내기 ----

    @GetMapping("/export/participants")
    public ResponseEntity<Resource> exportParticipants() {
        return csvResponse(csvExportService.exportParticipants(), "participants");
    }

    @GetMapping("/export/submissions")
    public ResponseEntity<Resource> exportSubmissions() {
        return csvResponse(csvExportService.exportSubmissions(), "submissions");
    }

    @GetMapping("/export/results")
    public ResponseEntity<Resource> exportResults() {
        return csvResponse(csvExportService.exportResults(), "results");
    }

    private ResponseEntity<Resource> csvResponse(String csv, String name) {
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        String filename = "%s-%s.csv".formatted(name, LocalDate.now());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s\"".formatted(filename))
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }
}
