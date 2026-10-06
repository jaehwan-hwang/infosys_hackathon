package kr.hyu.isd.hackathon.domain.team;

/**
 * 해커톤 트랙. 산출물 완성도 단계에 따라 나뉜다.
 * SPARK  : 아이디어톤 (1일차). 코드 제출 금지
 * SPRINT : 기초 프로그램 개발 (2일차)
 * SUMMIT : 완성된 프로그램 개발 (2일차). 교수 평가 포함
 */
public enum Track {
    SPARK(1, 1, 5_000),
    SPRINT(2, 3, 10_000),
    SUMMIT(2, 3, 10_000);

    private final int day;
    private final int awardCount;
    private final int entryFee;

    Track(int day, int awardCount, int entryFee) {
        this.day = day;
        this.awardCount = awardCount;
        this.entryFee = entryFee;
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

    /**
     * 학생회비 미납자·휴학생이 내는 참가비(원).
     *
     * 1일차만 하는 Spark가 더 싸다. 학생회비를 낸 재학생은 트랙과 무관하게 0원이다.
     */
    public int getEntryFee() {
        return entryFee;
    }

    /** 화면과 안내 문구에 쓰는 이름 (Spark / Sprint / Summit) */
    public String getLabel() {
        return name().charAt(0) + name().substring(1).toLowerCase();
    }
}
