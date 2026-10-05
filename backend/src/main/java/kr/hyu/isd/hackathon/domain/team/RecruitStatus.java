package kr.hyu.isd.hackathon.domain.team;

/**
 * 팀의 모집 상태.
 *
 * 서로 찾는 것이 반대인 팀끼리 이어 주기 위한 표식이다.
 * 팀원을 모집하는 팀에게는 팀장을 찾는 쪽이, 팀장을 모집하는 쪽에는 팀원을 찾는 팀이 보인다.
 */
public enum RecruitStatus {

    /** 모집하지 않는다. 인원이 다 찼거나 그대로 참가할 팀 */
    NONE("모집 안 함"),

    /** 우리 팀에 들어올 팀원을 찾는다 */
    MEMBERS("팀원 모집"),

    /** 우리를 이끌어 줄 팀장(또는 합류할 팀)을 찾는다 */
    LEADER("팀장 모집");

    private final String label;

    RecruitStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /** 이 상태의 팀이 찾아봐야 할 반대쪽 상태 */
    public RecruitStatus counterpart() {
        return switch (this) {
            case MEMBERS -> LEADER;
            case LEADER -> MEMBERS;
            case NONE -> NONE;
        };
    }
}
