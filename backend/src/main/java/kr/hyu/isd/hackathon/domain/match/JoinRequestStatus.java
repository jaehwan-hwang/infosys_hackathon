package kr.hyu.isd.hackathon.domain.match;

/**
 * 합류 신청의 처리 상태.
 *
 * 신청이 들어와도 자동으로 합쳐지지 않는다. 운영진이 양쪽에 연락해 확인한 뒤
 * 직접 합치기 때문에, 신청은 PENDING으로 쌓여 운영진 화면에서 처리된다.
 */
public enum JoinRequestStatus {
    PENDING("대기"),
    MERGED("합침"),
    REJECTED("반려"),
    CANCELED("취소");

    private final String label;

    JoinRequestStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
