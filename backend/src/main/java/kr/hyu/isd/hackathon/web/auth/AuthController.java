package kr.hyu.isd.hackathon.web.auth;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.auth.AuthService;
import kr.hyu.isd.hackathon.common.auth.DevLoginGate;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.web.auth.dto.GoogleLoginRequest;
import kr.hyu.isd.hackathon.web.auth.dto.LoginResponse;
import kr.hyu.isd.hackathon.web.auth.dto.ProfileRequest;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final DevLoginGate devLoginGate;

    /** Google ID 토큰을 자체 액세스 토큰으로 교환한다. */
    @PostMapping("/google")
    public ApiResponse<LoginResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.success(authService.loginWithGoogle(request.idToken()));
    }

    /**
     * 테스트 로그인 — 로컬에서만. 잠겨 있으면 404("사용자를 찾을 수 없습니다")를 돌려준다.
     * 운영에서 이 기능이 있다는 것조차 드러내지 않으려고 403이 아니라 404다.
     */
    @PostMapping("/dev-login")
    public ApiResponse<LoginResponse> devLogin(@RequestBody Map<String, String> body) {
        if (!devLoginGate.isEnabled()) {
            throw new HackathonException(ErrorCode.USER_NOT_FOUND);
        }
        return ApiResponse.success(authService.loginForTesting(body.getOrDefault("email", "")));
    }

    /** 내 정보 조회 */
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMe(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(authService.getMe(principal.userId()));
    }

    /** 최초 로그인 후 학번·성명 등록 */
    @PutMapping("/me/profile")
    public ApiResponse<UserResponse> completeProfile(@CurrentUser AuthPrincipal principal,
                                                     @Valid @RequestBody ProfileRequest request) {
        return ApiResponse.success(authService.completeProfile(principal.userId(), request));
    }
}
