package kr.hyu.isd.hackathon.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 서비스 전역 에러 코드. 코드 체계는 ISD###-{HTTP status}.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ---- 400 Bad Request ----
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "ISD001-400", "잘못된 요청입니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "ISD002-400", "입력값이 유효하지 않습니다."),
    PROFILE_REQUIRED(HttpStatus.BAD_REQUEST, "ISD003-400", "학번·성명 프로필을 먼저 등록해야 합니다."),
    ALREADY_IN_TEAM(HttpStatus.BAD_REQUEST, "ISD004-400", "이미 소속된 팀이 있습니다."),
    DUPLICATE_TEAM_NAME(HttpStatus.BAD_REQUEST, "ISD005-400", "이미 사용 중인 팀명입니다."),
    INVALID_TEAM_SIZE(HttpStatus.BAD_REQUEST, "ISD006-400", "팀 인원이 허용 범위를 벗어났습니다."),
    DUPLICATE_MEMBER(HttpStatus.BAD_REQUEST, "ISD007-400", "팀원 정보가 중복됩니다."),
    REGISTRATION_CLOSED(HttpStatus.BAD_REQUEST, "ISD008-400", "참가 신청 기간이 아닙니다."),
    SUBMISSION_CLOSED(HttpStatus.BAD_REQUEST, "ISD009-400", "제출 마감 시각이 지났습니다."),
    SUBMISSION_INCOMPLETE(HttpStatus.BAD_REQUEST, "ISD010-400", "트랙별 필수 제출 항목이 채워지지 않았습니다."),
    SOURCE_CODE_FORBIDDEN(HttpStatus.BAD_REQUEST, "ISD011-400", "Spark 트랙은 소스코드·구동 프로그램을 제출할 수 없습니다."),
    VOTING_CLOSED(HttpStatus.BAD_REQUEST, "ISD012-400", "현재 평가가 열려 있지 않습니다."),
    SELF_VOTE_FORBIDDEN(HttpStatus.BAD_REQUEST, "ISD013-400", "자신이 속한 팀은 평가할 수 없습니다."),
    TRACK_MISMATCH(HttpStatus.BAD_REQUEST, "ISD014-400", "같은 트랙의 팀만 평가할 수 있습니다."),
    INVALID_SCORE(HttpStatus.BAD_REQUEST, "ISD015-400", "점수가 허용 범위를 벗어났습니다."),
    CRITERIA_MISMATCH(HttpStatus.BAD_REQUEST, "ISD016-400", "평가 항목이 기준과 일치하지 않습니다."),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "ISD017-400", "업로드 용량 제한을 초과했습니다."),
    UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "ISD018-400", "허용되지 않는 파일 형식입니다."),
    NO_ACTIVE_EVENT(HttpStatus.BAD_REQUEST, "ISD019-400", "활성화된 해커톤 행사가 없습니다."),

    // ---- 401 Unauthorized ----
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "ISD020-401", "유효하지 않은 토큰입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "ISD021-401", "토큰이 만료되었습니다."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "ISD022-401", "로그인이 필요합니다."),
    INVALID_ID_TOKEN(HttpStatus.UNAUTHORIZED, "ISD023-401", "Google 인증 정보를 확인할 수 없습니다."),

    // ---- 403 Forbidden ----
    INSUFFICIENT_PERMISSION(HttpStatus.FORBIDDEN, "ISD024-403", "권한이 없습니다."),
    NOT_TEAM_LEADER(HttpStatus.FORBIDDEN, "ISD025-403", "팀 조장만 수행할 수 있습니다."),
    DOMAIN_NOT_ALLOWED(HttpStatus.FORBIDDEN, "ISD026-403", "한양대학교 이메일(@hanyang.ac.kr)로만 이용할 수 있습니다."),
    RESULTS_NOT_PUBLISHED(HttpStatus.FORBIDDEN, "ISD027-403", "결과는 시상식 이후 공개됩니다."),

    // ---- 404 Not Found ----
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD028-404", "사용자를 찾을 수 없습니다."),
    TEAM_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD029-404", "팀을 찾을 수 없습니다."),
    SUBMISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD030-404", "제출물을 찾을 수 없습니다."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD031-404", "해커톤 행사를 찾을 수 없습니다."),
    CRITERION_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD032-404", "평가 항목을 찾을 수 없습니다."),
    AWARD_NOT_FOUND(HttpStatus.NOT_FOUND, "ISD033-404", "수상 내역을 찾을 수 없습니다."),

    // ---- 409 Conflict ----
    ALREADY_EVALUATED(HttpStatus.CONFLICT, "ISD034-409", "이미 평가한 팀입니다."),

    // ---- 500 Internal Server Error ----
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "ISD035-500", "서버 내부 오류가 발생했습니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "ISD036-500", "파일 업로드에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
