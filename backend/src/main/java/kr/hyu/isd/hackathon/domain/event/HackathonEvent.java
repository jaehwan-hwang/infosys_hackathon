package kr.hyu.isd.hackathon.domain.event;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.team.Track;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 해커톤 행사 1회차. 마감 시각과 단계 토글을 모두 이 엔티티가 들고 있고,
 * 제출 잠금·투표 개방 판정은 항상 서버 시계(Instant.now())로만 이뤄진다.
 * 클라이언트 시계는 신뢰하지 않는다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_hackathon_event")
public class HackathonEvent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @Column(length = 100, nullable = false)
    private String title;

    @Column(length = 200)
    private String theme;

    @Column(length = 2000)
    private String description;

    @Column(length = 200)
    private String location;

    @Column(length = 300)
    private String contactUrl;

    /** 현재 활성 행사 여부. 활성 행사는 항상 하나만 둔다. */
    @Column(nullable = false)
    private boolean active;

    // ---- 참가 신청 기간 ----
    @Column(name = "register_starts_at")
    private Instant registerStartsAt;

    @Column(name = "register_ends_at")
    private Instant registerEndsAt;

    // ---- 트랙별 제출 마감 ----
    /** Spark 제출 마감 (1일차 19:00) */
    @Column(name = "spark_submit_deadline")
    private Instant sparkSubmitDeadline;

    /** Sprint/Summit 제출 마감 (2일차 18:00) */
    @Column(name = "dev_submit_deadline")
    private Instant devSubmitDeadline;

    // ---- 평가 단계 토글 (운영진이 발표 종료 후 수동으로 연다) ----
    @Column(name = "spark_voting_open", nullable = false)
    private boolean sparkVotingOpen;

    @Column(name = "sprint_voting_open", nullable = false)
    private boolean sprintVotingOpen;

    @Column(name = "summit_voting_open", nullable = false)
    private boolean summitVotingOpen;

    /** 순위·점수 공개 여부. 시상식 전까지 false로 유지한다. */
    @Column(name = "results_published", nullable = false)
    private boolean resultsPublished;

    // ---- 참가 규정 ----
    @Column(name = "min_team_size", nullable = false)
    private int minTeamSize;

    @Column(name = "max_team_size", nullable = false)
    private int maxTeamSize;

    /** 업로드 파일 1개당 용량 상한 (MB) */
    @Column(name = "max_upload_mb", nullable = false)
    private int maxUploadMb;

    private HackathonEvent(String title) {
        this.title = title;
        this.active = true;
        this.minTeamSize = 1;
        this.maxTeamSize = 5;
        this.maxUploadMb = 50;
    }

    public static HackathonEvent create(String title) {
        return new HackathonEvent(title);
    }

    // ---- 판정 로직 (서버 시계 기준) ----

    /** 트랙별 제출 마감 시각. 미설정이면 null(=마감 없음) */
    public Instant submitDeadlineOf(Track track) {
        return track == Track.SPARK ? sparkSubmitDeadline : devSubmitDeadline;
    }

    /** 지금 이 트랙의 제출 폼이 열려 있는가 */
    public boolean isSubmissionOpen(Track track, Instant now) {
        Instant deadline = submitDeadlineOf(track);
        return deadline == null || now.isBefore(deadline);
    }

    /** 지금 이 트랙의 평가가 열려 있는가 */
    public boolean isVotingOpen(Track track) {
        return switch (track) {
            case SPARK -> sparkVotingOpen;
            case SPRINT -> sprintVotingOpen;
            case SUMMIT -> summitVotingOpen;
        };
    }

    /** 지금 참가 신청을 받고 있는가 */
    public boolean isRegistrationOpen(Instant now) {
        if (registerStartsAt != null && now.isBefore(registerStartsAt)) return false;
        if (registerEndsAt != null && now.isAfter(registerEndsAt)) return false;
        return true;
    }

    // ---- 운영진 변경 메서드 ----

    public void updateBasics(String title, String theme, String description,
                             String location, String contactUrl) {
        this.title = title;
        this.theme = theme;
        this.description = description;
        this.location = location;
        this.contactUrl = contactUrl;
    }

    public void updateSchedule(Instant registerStartsAt, Instant registerEndsAt,
                               Instant sparkSubmitDeadline, Instant devSubmitDeadline) {
        this.registerStartsAt = registerStartsAt;
        this.registerEndsAt = registerEndsAt;
        this.sparkSubmitDeadline = sparkSubmitDeadline;
        this.devSubmitDeadline = devSubmitDeadline;
    }

    public void updateRules(int minTeamSize, int maxTeamSize, int maxUploadMb) {
        this.minTeamSize = minTeamSize;
        this.maxTeamSize = maxTeamSize;
        this.maxUploadMb = maxUploadMb;
    }

    public void setVotingOpen(Track track, boolean open) {
        switch (track) {
            case SPARK -> this.sparkVotingOpen = open;
            case SPRINT -> this.sprintVotingOpen = open;
            case SUMMIT -> this.summitVotingOpen = open;
        }
    }

    public void setResultsPublished(boolean published) {
        this.resultsPublished = published;
    }

    public void deactivate() {
        this.active = false;
    }
}
