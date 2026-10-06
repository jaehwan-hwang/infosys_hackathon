package kr.hyu.isd.hackathon.domain.user;

/**
 * 사용자 권한.
 *
 * STUDENT   : 참가자. 팀 등록/제출/학생 투표
 * PROFESSOR : 교수 심사위원. Summit 트랙 평가
 * ADMIN     : 학생회 운영진. 대시보드·집계·내보내기·팀 합치기·행사 설정
 *
 * "최고 관리자"는 여기에 값을 더하지 않고 설정의 이메일 목록(app.auth.super-admin-emails)
 * 으로 가린다. 이 열은 DB에서 세 값만 허용하는 타입으로 만들어져 있어, 값을 늘리면
 * 이미 데이터가 들어 있는 운영 DB에서 스키마 변경이 막힌다.
 */
public enum Role {
    STUDENT,
    PROFESSOR,
    ADMIN;

    /** 운영진 화면에 들어갈 수 있는가 */
    public boolean isStaff() {
        return this == ADMIN;
    }

    public String getLabel() {
        return switch (this) {
            case STUDENT -> "참가자";
            case PROFESSOR -> "교수";
            case ADMIN -> "운영진";
        };
    }
}
