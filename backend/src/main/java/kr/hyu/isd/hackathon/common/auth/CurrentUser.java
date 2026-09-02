package kr.hyu.isd.hackathon.common.auth;

import java.lang.annotation.*;

/**
 * 컨트롤러 파라미터에 붙여 인증된 사용자를 주입받는다.
 *
 * <pre>{@code
 * @GetMapping("/me")
 * public ApiResponse<UserResponse> me(@CurrentUser AuthPrincipal principal) { ... }
 * }</pre>
 *
 * @see CurrentUserArgumentResolver
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {

    /** false면 비로그인 요청에서 null을 주입한다 (공개 API의 선택적 인증용) */
    boolean required() default true;
}
