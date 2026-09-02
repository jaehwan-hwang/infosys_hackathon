package kr.hyu.isd.hackathon.domain.team;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.user.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 참가 팀. 등록 시 트랙 선택(Spark 또는 Sprint/Summit)과 자가진단을 함께 받고,
 * Sprint/Summit을 고른 팀의 최종 트랙은 SelfCheck가 서버에서 다시 계산한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_team", uniqueConstraints = {
        @UniqueConstraint(name = "uk_team_event_name", columnNames = {"event_id", "name"})
})
public class Team extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent event;

    @Column(length = 60, nullable = false)
    private String name;

    /** 팀이 다루는 주제 한 줄 소개 */
    @Column(length = 200)
    private String topic;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    /** 서버가 최종 확정한 트랙 */
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Track track;

    @Embedded
    private SelfCheck selfCheck;

    /** 트랙 배정 사유. 대시보드에서 배정 근거를 보여주기 위해 저장한다. */
    @Column(name = "track_reason", length = 300)
    private String trackReason;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> members = new ArrayList<>();

    private Team(HackathonEvent event, String name, String topic, String description,
                 User leader, Track track, SelfCheck selfCheck, String trackReason) {
        this.event = event;
        this.name = name;
        this.topic = topic;
        this.description = description;
        this.leader = leader;
        this.track = track;
        this.selfCheck = selfCheck;
        this.trackReason = trackReason;
    }

    /**
     * 팀을 생성한다. Spark를 선택하면 자가진단과 무관하게 Spark로 확정되고,
     * Sprint/Summit을 선택하면 자가진단 결과가 최종 트랙을 결정한다.
     *
     * @param appliedTrack 팀이 등록 폼에서 선택한 트랙 (SPARK 또는 SPRINT/SUMMIT 계열)
     */
    public static Team create(HackathonEvent event, String name, String topic, String description,
                              User leader, Track appliedTrack, SelfCheck selfCheck) {
        if (appliedTrack == Track.SPARK) {
            return new Team(event, name, topic, description, leader,
                    Track.SPARK, SelfCheck.empty(), "Spark 트랙 직접 선택");
        }
        SelfCheck check = selfCheck != null ? selfCheck : SelfCheck.empty();
        return new Team(event, name, topic, description, leader,
                check.resolveTrack(), check, check.describeReason());
    }

    public void updateInfo(String name, String topic, String description) {
        this.name = name;
        this.topic = topic;
        this.description = description;
    }

    /** 운영진이 배정 결과를 수동으로 정정할 때만 사용한다. */
    public void overrideTrack(Track track, String reason) {
        this.track = track;
        this.trackReason = reason;
    }

    public void addMember(TeamMember member) {
        this.members.add(member);
    }

    public void clearMembers() {
        this.members.clear();
    }

    public int memberCount() {
        return this.members.size();
    }

    public boolean isLedBy(Long userId) {
        return this.leader.getId().equals(userId);
    }

    /** 해당 사용자가 이 팀의 팀원인가 (자기 팀 투표 차단에 쓴다) */
    public boolean hasMember(Long userId) {
        return this.members.stream()
                .anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(userId));
    }
}
