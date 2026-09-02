package kr.hyu.isd.hackathon.web.team;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.team.TeamService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.web.team.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /**
     * 자가진단 결과 미리보기.
     * 저장 없이 계산만 하므로 로그인 전에도 호출할 수 있게 열어둔다.
     */
    @PostMapping("/self-check")
    public ApiResponse<SelfCheckResultResponse> previewSelfCheck(
            @RequestBody SelfCheckRequest request) {
        return ApiResponse.success(teamService.previewSelfCheck(request));
    }

    /** 팀 등록. 요청자가 조장이 된다. */
    @PostMapping
    public ApiResponse<TeamResponse> register(@CurrentUser AuthPrincipal principal,
                                              @Valid @RequestBody TeamRegisterRequest request) {
        return ApiResponse.success(teamService.register(principal.userId(), request));
    }

    /** 내 팀. 소속 팀이 없으면 data가 null이다. */
    @GetMapping("/me")
    public ApiResponse<TeamResponse> getMyTeam(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(teamService.getMyTeam(principal.userId()));
    }

    /** 트랙별 팀 목록 (개인정보 제외) */
    @GetMapping
    public ApiResponse<List<TeamResponse>> getTeams(@RequestParam Track track) {
        return ApiResponse.success(teamService.getTeamsByTrack(track));
    }

    @GetMapping("/{teamId}")
    public ApiResponse<TeamResponse> getTeam(@PathVariable Long teamId) {
        return ApiResponse.success(teamService.getTeam(teamId));
    }

    /** 팀 정보 수정 (조장 전용) */
    @PutMapping("/{teamId}")
    public ApiResponse<TeamResponse> updateTeam(@CurrentUser AuthPrincipal principal,
                                                @PathVariable Long teamId,
                                                @Valid @RequestBody TeamUpdateRequest request) {
        return ApiResponse.success(teamService.updateTeam(principal.userId(), teamId, request));
    }
}
