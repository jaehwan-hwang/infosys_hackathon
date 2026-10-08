package kr.hyu.isd.hackathon.web.admin;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.admin.AdminService;
import kr.hyu.isd.hackathon.application.admin.CsvExportService;
import kr.hyu.isd.hackathon.application.result.ResultService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.AuthProperties;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.web.admin.dto.*;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestResponse;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import kr.hyu.isd.hackathon.web.event.dto.EventResponse;
import kr.hyu.isd.hackathon.web.result.dto.TrackResultResponse;
import kr.hyu.isd.hackathon.web.submission.dto.SubmissionResponse;
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
    private final AuthProperties authProperties;
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

    /** 참가자 전체 명단. 학번·전화번호·이메일을 한 줄에 모은다. */
    @GetMapping("/participants")
    public ApiResponse<List<ParticipantResponse>> getParticipants() {
        return ApiResponse.success(adminService.getParticipants());
    }

    /** 제출물 전체 */
    @GetMapping("/submissions")
    public ApiResponse<List<SubmissionResponse>> getSubmissions() {
        return ApiResponse.success(adminService.getSubmissions());
    }

    /** 트랙 자동 배정 결과 수동 정정 */
    @PatchMapping("/teams/{teamId}/track")
    public ApiResponse<TeamAdminResponse> overrideTrack(@PathVariable Long teamId,
                                                        @RequestParam Track track,
                                                        @RequestParam(required = false) String reason) {
        return ApiResponse.success(adminService.overrideTrack(teamId, track, reason));
    }

    // ---- 행사 설정 ----

    /** 팀 삭제. 제출물·받은 평가·수상까지 함께 지운다. 최고 관리자만. */
    @DeleteMapping("/teams/{teamId}")
    public ApiResponse<Void> deleteTeam(@CurrentUser AuthPrincipal principal,
                                        @PathVariable Long teamId) {
        requireSuperAdmin(principal);
        adminService.deleteTeam(teamId);
        return ApiResponse.success(null);
    }

    @PutMapping("/event")
    public ApiResponse<EventResponse> updateEvent(@Valid @RequestBody EventUpdateRequest request) {
        return ApiResponse.success(adminService.updateEvent(request));
    }

    /** 발표 종료 후 트랙별 평가 열기/닫기. 최고 관리자만. */
    @PostMapping("/event/voting")
    public ApiResponse<EventResponse> toggleVoting(@CurrentUser AuthPrincipal principal,
                                                   @Valid @RequestBody VotingToggleRequest request) {
        requireSuperAdmin(principal);
        return ApiResponse.success(adminService.toggleVoting(request));
    }

    /**
     * 일차별 평가 전환. 1일차는 Spark만, 2일차는 Sprint·Summit만 열린다.
     * 토글 세 개를 손으로 맞추는 실수를 막기 위한 단축 동작이다.
     */
    @PostMapping("/event/voting/day/{day}")
    public ApiResponse<EventResponse> openVotingForDay(@CurrentUser AuthPrincipal principal,
                                                       @PathVariable int day) {
        requireSuperAdmin(principal);
        return ApiResponse.success(adminService.openVotingForDay(day));
    }

    /** 시상식에서 트랙별 리더보드 공개. 최고 관리자만. */
    @PostMapping("/event/publish")
    public ApiResponse<EventResponse> publishResults(@CurrentUser AuthPrincipal principal,
                                                     @RequestParam Track track,
                                                     @RequestParam boolean published) {
        requireSuperAdmin(principal);
        return ApiResponse.success(adminService.publishResults(track, published));
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

    // ---- 팀 합치기 ----

    /** 들어온 합치기 신청 목록. 대기 중인 것이 위로 온다. */
    @GetMapping("/join-requests")
    public ApiResponse<List<JoinRequestResponse>> getJoinRequests() {
        return ApiResponse.success(adminService.getJoinRequests());
    }

    /** 두 팀을 합친다. fromTeam의 팀원이 toTeam으로 옮겨 가고 fromTeam은 사라진다. */
    @PostMapping("/teams/merge")
    public ApiResponse<TeamAdminResponse> mergeTeams(@RequestParam Long fromTeamId,
                                                     @RequestParam Long toTeamId,
                                                     @RequestParam(required = false) String note) {
        return ApiResponse.successWithMsg(
                adminService.mergeTeams(fromTeamId, toTeamId, note), "두 팀을 합쳤습니다.");
    }

    @PostMapping("/join-requests/{requestId}/reject")
    public ApiResponse<Void> rejectJoinRequest(@PathVariable Long requestId,
                                               @RequestParam(required = false) String note) {
        adminService.rejectJoinRequest(requestId, note);
        return ApiResponse.successWithMsg("신청을 반려했습니다.");
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

    // ---- 굿즈 ----

    /** 굿즈 신청 내역. 물건을 건네고 입금을 대조해야 해서 학번·전화번호를 그대로 담는다. */
    @GetMapping("/goods")
    public ApiResponse<List<GoodsOrderAdminResponse>> getGoodsOrders() {
        return ApiResponse.success(adminService.getGoodsOrders());
    }

    // ---- 권한 ----

    @GetMapping("/staff")
    public ApiResponse<List<UserResponse>> getStaff() {
        return ApiResponse.success(adminService.getStaff());
    }

    /** 교수·운영진 권한 부여·해제. 최고 관리자만. */
    @PutMapping("/staff")
    public ApiResponse<UserResponse> updateRole(@CurrentUser AuthPrincipal principal,
                                                @Valid @RequestBody RoleUpdateRequest request) {
        requireSuperAdmin(principal);
        // 자기 권한을 스스로 거두면 그 자리에서 대시보드 밖으로 밀려나고 되돌릴 사람이 없다
        if (request.role() == Role.STUDENT
                && request.email().equalsIgnoreCase(principal.email())) {
            throw new HackathonException(ErrorCode.INSUFFICIENT_PERMISSION,
                    "자기 권한은 스스로 거둘 수 없습니다.");
        }
        return ApiResponse.success(adminService.updateRole(request));
    }

    /**
     * 되돌리기 어려운 조작을 막는다.
     *
     * 권한 부여, 평가 열기·닫기, 시상 공개, 팀 삭제는 한 번 누르면 수습이 어렵다.
     * 행사 당일 운영진 여럿이 같은 화면을 보므로, 이 네 가지만 최고 관리자에게 남긴다.
     */
    private void requireSuperAdmin(AuthPrincipal principal) {
        if (!authProperties.isSuperAdmin(principal.email())) {
            throw new HackathonException(ErrorCode.INSUFFICIENT_PERMISSION,
                    "최고 관리자만 할 수 있습니다. 운영진에게 요청해 주세요.");
        }
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

    @GetMapping("/export/goods")
    public ResponseEntity<Resource> exportGoods() {
        return csvResponse(csvExportService.exportGoods(), "goods");
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
