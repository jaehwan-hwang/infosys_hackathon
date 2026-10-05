package kr.hyu.isd.hackathon.domain.team;

/**
 * 해커톤 트랙. 산출물 완성도 단계에 따라 나뉜다.
 * SPARK  : 아이디어톤 (1일차). 코드 제출 금지
 * SPRINT : 기초 프로그램 개발 (2일차)
 * SUMMIT : 완성된 프로그램 개발 (2일차). 교수 평가 포함
 */
public enum Track {
    SPARK(1, 1),
    SPRINT(2, 3),
    SUMMIT(2, 3);

    private final int day;
    private final int awardCount;

    Track(int day, int awardCount) {
        this.day = day;
        this.awardCount = awardCount;
    }

    /** 해당 트랙이 진행되는 행사 일차 (1 또는 2) */
    public int getDay() {
        return day;
    }

    /**
     * 시상하는 등수. Spark는 1등만, Sprint와 Summit은 3등까지다.
     * 리더보드에는 이 등수까지만 올리고 나머지 팀은 아예 내보내지 않는다.
     */
    public int getAwardCount() {
        return awardCount;
    }

    /** 화면과 안내 문구에 쓰는 이름 (Spark / Sprint / Summit) */
    public String getLabel() {
        return name().charAt(0) + name().substring(1).toLowerCase();
    }
}
