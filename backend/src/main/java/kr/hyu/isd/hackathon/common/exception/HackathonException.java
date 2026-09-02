package kr.hyu.isd.hackathon.common.exception;

import kr.hyu.isd.hackathon.common.dto.response.ApiErrorData;
import lombok.Getter;

import java.util.List;

/**
 * 서비스 전역 비즈니스 예외.
 */
@Getter
public class HackathonException extends RuntimeException {

    private final ErrorCode errorCode;
    private final List<ApiErrorData> errorDataList;

    public HackathonException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.errorDataList = null;
    }

    public HackathonException(ErrorCode errorCode, String message) {
        super(errorCode.getMessage() + " - " + message);
        this.errorCode = errorCode;
        this.errorDataList = null;
    }

    public HackathonException(ErrorCode errorCode, List<ApiErrorData> errorDataList) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.errorDataList = errorDataList;
    }
}
