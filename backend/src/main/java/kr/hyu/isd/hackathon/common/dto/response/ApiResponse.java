package kr.hyu.isd.hackathon.common.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 모든 API 응답의 표준 형식.
 *
 * @param timestamp 응답 시각 (epoch millis)
 * @param data      성공 시 데이터, 실패 시 상세 에러 데이터
 * @param errorCode 실패 시 에러 코드
 * @param message   성공/실패 메시지
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        long timestamp,
        T data,
        String errorCode,
        String message
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(System.currentTimeMillis(), data, null, "Success");
    }

    public static <T> ApiResponse<T> successWithMsg(String message) {
        return new ApiResponse<>(System.currentTimeMillis(), null, null, message);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        return new ApiResponse<>(System.currentTimeMillis(), null, errorCode, message);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message, T data) {
        return new ApiResponse<>(System.currentTimeMillis(), data, errorCode, message);
    }
}
