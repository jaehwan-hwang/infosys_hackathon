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
 * 참가 팀.
 *
 * 등록 때 받는 것은 팀명·트랙·팀원뿐이다. 주제와 소개는 받지 않는다 —
 * 신청 단계에서 아직 정해지지 않은 내용을 적게 하면 신청이 무거워지고,
 * 어차피 결과물 제출 단계에서 프로젝트명과 요약으로 다시 받기 때문이다.
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

    private Team(HackathonEvent event, String name,
                 User leader, Track track, SelfCheck selfCheck, String trackReason) {
        this.event = event;
        this.name = name;
        this.leader = leader;
        this.track = track;
        this.selfCheck = selfCheck;
        this.trackReason = trackReason;
    }

    /**
     * 트랙은 참가자가 등록 폼에서 직접 고른다.
     * 자가진단은 어느 트랙이 맞는지 권해 주는 안내일 뿐이라, 고른 값을 그대로 쓴다.
     * 운영진이 보기에 필요한 자가진단 기록은 넘어온 값이 있으면 함께 저장한다.
     *
     * @param appliedTrack 팀이 등록 폼에서 고른 트랙. 비어 있으면 Spark로 둔다.
     */
    public static Team create(HackathonEvent event, String name,
                              User leader, Track appliedTrack, SelfCheck selfCheck) {
        Track track = appliedTrack != null ? appliedTrack : Track.SPARK;
        SelfCheck check = selfCheck != null ? selfCheck : SelfCheck.empty();
        return new Team(event, name, leader, track, check, "참가자 직접 선택");
    }

    public void rename(String name) {
        this.name = name;
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
