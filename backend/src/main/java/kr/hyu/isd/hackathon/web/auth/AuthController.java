package kr.hyu.isd.hackathon.web.auth;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.auth.AuthService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.auth.dto.GoogleLoginRequest;
import kr.hyu.isd.hackathon.web.auth.dto.LoginResponse;
import kr.hyu.isd.hackathon.web.auth.dto.ProfileRequest;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Google ID 토큰을 자체 액세스 토큰으로 교환한다. */
    @PostMapping("/google")
    public ApiResponse<LoginResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.success(authService.loginWithGoogle(request.idToken()));
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
