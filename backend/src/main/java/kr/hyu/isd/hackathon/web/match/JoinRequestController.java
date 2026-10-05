package kr.hyu.isd.hackathon.web.match;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.match.JoinRequestService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestCreateRequest;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 팀 합치기 신청.
 *
 * 신청은 쌓이기만 하고, 실제로 합치는 것은 운영진이 한다(/api/v1/admin/join-requests).
 */
@RestController
@RequestMapping("/api/v1/join-requests")
@RequiredArgsConstructor
public class JoinRequestController {

    private final JoinRequestService joinRequestService;

    @PostMapping
    public ApiResponse<JoinRequestResponse> create(@CurrentUser AuthPrincipal principal,
                                                   @Valid @RequestBody JoinRequestCreateRequest request) {
        return ApiResponse.successWithMsg(joinRequestService.create(principal.userId(), request),
                "신청을 접수했습니다. 운영진이 확인한 뒤 연락드립니다.");
    }

    /** 우리 팀이 보낸 신청과 받은 신청 */
    @GetMapping("/me")
    public ApiResponse<List<JoinRequestResponse>> getMine(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(joinRequestService.getMyRequests(principal.userId()));
    }

    @DeleteMapping("/{requestId}")
    public ApiResponse<Void> cancel(@CurrentUser AuthPrincipal principal,
                                    @PathVariable Long requestId) {
        joinRequestService.cancel(principal.userId(), requestId);
        return ApiResponse.successWithMsg("신청을 취소했습니다.");
    }
}
