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

    /**
     * 화면에 보여줄 문구. 상황을 구체적으로 적어 던진 경우 그 문장을 쓰고,
     * 없으면 ErrorCode의 기본 문구를 쓴다.
     */
    private final String displayMessage;

    public HackathonException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.errorDataList = null;
        this.displayMessage = errorCode.getMessage();
    }

    public HackathonException(ErrorCode errorCode, String message) {
        super(errorCode.getMessage() + " - " + message);
        this.errorCode = errorCode;
        this.errorDataList = null;
        this.displayMessage = message;
    }

    public HackathonException(ErrorCode errorCode, List<ApiErrorData> errorDataList) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.errorDataList = errorDataList;
        this.displayMessage = errorCode.getMessage();
    }
}
