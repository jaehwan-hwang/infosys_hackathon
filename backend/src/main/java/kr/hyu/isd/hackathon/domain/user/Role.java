package kr.hyu.isd.hackathon.domain.user;

/**
 * 사용자 권한.
 * STUDENT   : 참가자. 팀 등록/제출/학생 투표
 * PROFESSOR : 교수 심사위원. Summit 트랙 평가
 * ADMIN     : 학생회 운영진. 대시보드/집계/설정
 */
public enum Role {
    STUDENT,
    PROFESSOR,
    ADMIN
}
