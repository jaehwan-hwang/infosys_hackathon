package kr.hyu.isd.hackathon.domain.team;

/**
 * 해커톤 트랙. 산출물 완성도 단계에 따라 나뉜다.
 * SPARK  : 아이디어톤 (1일차). 코드 제출 금지
 * SPRINT : 기초 프로그램 개발 (2일차)
 * SUMMIT : 완성된 프로그램 개발 (2일차). 교수 평가 포함
 */
public enum Track {
    SPARK(1),
    SPRINT(2),
    SUMMIT(2);

    private final int day;

    Track(int day) {
        this.day = day;
    }

    /** 해당 트랙이 진행되는 행사 일차 (1 또는 2) */
    public int getDay() {
        return day;
    }
}
