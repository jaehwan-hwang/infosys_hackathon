package kr.hyu.isd.hackathon.common.dto.response;

/**
 * 필드 단위 에러 상세.
 *
 * @param field         에러가 발생한 필드명
 * @param message       에러 메시지
 * @param rejectedValue 거부된 값
 */
public record ApiErrorData(String field, String message, Object rejectedValue) {
}
