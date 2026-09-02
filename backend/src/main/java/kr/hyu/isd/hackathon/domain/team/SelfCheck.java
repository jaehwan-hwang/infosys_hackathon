package kr.hyu.isd.hackathon.domain.team;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 트랙 배정 자가진단. 기획서 2-1의 규칙을 그대로 코드로 옮긴 값 객체다.
 *
 * 즉시 Summit 배정 사유(3개) 중 하나라도 해당하면 무조건 Summit,
 * 그렇지 않으면 체크리스트 4개 중 3개 이상 해당 시 Summit, 아니면 Sprint.
 *
 * 프론트에서도 같은 계산을 즉시 보여주지만, 실제 배정은 항상 서버가 다시 계산한다.
 */
@Getter
@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SelfCheck {

    /** 즉시 Summit — 개발 직무 실무·인턴 경험 */
    @Column(name = "sc_work_experience", nullable = false)
    private boolean workExperience;

    /** 즉시 Summit — 교내외 개발 대회 수상 이력 */
    @Column(name = "sc_award_history", nullable = false)
    private boolean awardHistory;

    /** 즉시 Summit — 실제 배포·운영 서비스 보유 */
    @Column(name = "sc_live_service", nullable = false)
    private boolean liveService;

    /** 체크리스트 1 — API 및 서버 연동 경험 */
    @Column(name = "sc_api_experience", nullable = false)
    private boolean apiExperience;

    /** 체크리스트 2 — Git/GitHub 브랜치 전략 협업 경험 */
    @Column(name = "sc_git_collab", nullable = false)
    private boolean gitCollab;

    /** 체크리스트 3 — 개발 산출물이 필수인 심화 전공 과목 이수 */
    @Column(name = "sc_advanced_course", nullable = false)
    private boolean advancedCourse;

    /** 체크리스트 4 — 외부 인증/결제/LLM API 연동 경험 */
    @Column(name = "sc_external_api", nullable = false)
    private boolean externalApi;

    /** 체크리스트 4개 중 몇 개를 넘어야 Summit인지 */
    private static final int CHECKLIST_THRESHOLD = 3;

    public SelfCheck(boolean workExperience, boolean awardHistory, boolean liveService,
                     boolean apiExperience, boolean gitCollab,
                     boolean advancedCourse, boolean externalApi) {
        this.workExperience = workExperience;
        this.awardHistory = awardHistory;
        this.liveService = liveService;
        this.apiExperience = apiExperience;
        this.gitCollab = gitCollab;
        this.advancedCourse = advancedCourse;
        this.externalApi = externalApi;
    }

    /** 모두 false인 빈 자가진단 (Spark 팀은 자가진단을 거치지 않는다) */
    public static SelfCheck empty() {
        return new SelfCheck(false, false, false, false, false, false, false);
    }

    /** 즉시 Summit 배정 사유에 하나라도 해당하는가 */
    public boolean hasInstantSummitReason() {
        return workExperience || awardHistory || liveService;
    }

    /** 체크리스트 4개 중 해당하는 개수 */
    public int checkedCount() {
        int count = 0;
        if (apiExperience) count++;
        if (gitCollab) count++;
        if (advancedCourse) count++;
        if (externalApi) count++;
        return count;
    }

    /** Sprint/Summit 지원 팀의 최종 배정 트랙 */
    public Track resolveTrack() {
        if (hasInstantSummitReason()) return Track.SUMMIT;
        return checkedCount() >= CHECKLIST_THRESHOLD ? Track.SUMMIT : Track.SPRINT;
    }

    /**
     * 배정 사유를 사람이 읽을 수 있는 문장으로 만든다.
     * 운영진 대시보드에서 "왜 이 팀이 Summit인가"를 확인할 때 쓴다.
     */
    public String describeReason() {
        if (hasInstantSummitReason()) {
            StringBuilder sb = new StringBuilder("즉시 Summit 배정: ");
            if (workExperience) sb.append("실무·인턴 경험, ");
            if (awardHistory) sb.append("개발 대회 수상 이력, ");
            if (liveService) sb.append("배포·운영 서비스 보유, ");
            sb.setLength(sb.length() - 2);
            return sb.toString();
        }
        int count = checkedCount();
        return count >= CHECKLIST_THRESHOLD
                ? "자가진단 %d/4 항목 해당 → Summit".formatted(count)
                : "자가진단 %d/4 항목 해당 → Sprint".formatted(count);
    }
}
