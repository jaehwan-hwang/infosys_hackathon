package kr.hyu.isd.hackathon.common.exception;

import kr.hyu.isd.hackathon.common.dto.response.ApiErrorData;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HackathonException.class)
    public ResponseEntity<ApiResponse<?>> handleHackathonException(HackathonException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("HackathonException: code={}, message={}", errorCode.getCode(), e.getMessage());

        ApiResponse<?> response = (e.getErrorDataList() != null && !e.getErrorDataList().isEmpty())
                ? ApiResponse.error(errorCode.getCode(), errorCode.getMessage(), e.getErrorDataList())
                : ApiResponse.error(errorCode.getCode(), errorCode.getMessage());

        return new ResponseEntity<>(response, errorCode.getHttpStatus());
    }

    /** @Valid 검증 실패를 필드별 상세 목록으로 변환한다. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException e) {
        List<ApiErrorData> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiErrorData(fe.getField(), fe.getDefaultMessage(), fe.getRejectedValue()))
                .toList();

        ErrorCode errorCode = ErrorCode.INVALID_INPUT;
        return new ResponseEntity<>(
                ApiResponse.error(errorCode.getCode(), errorCode.getMessage(), errors),
                errorCode.getHttpStatus());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<?>> handleMaxUploadSize(MaxUploadSizeExceededException e) {
        ErrorCode errorCode = ErrorCode.FILE_TOO_LARGE;
        log.warn("업로드 용량 초과: {}", e.getMessage());
        return new ResponseEntity<>(
                ApiResponse.error(errorCode.getCode(), errorCode.getMessage()),
                errorCode.getHttpStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGlobalException(Exception e) {
        log.error("처리되지 않은 예외: {}", e.getMessage(), e);
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        return new ResponseEntity<>(
                ApiResponse.error(errorCode.getCode(), errorCode.getMessage()),
                errorCode.getHttpStatus());
    }
}
