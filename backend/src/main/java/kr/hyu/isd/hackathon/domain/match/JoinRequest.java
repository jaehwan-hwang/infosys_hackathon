package kr.hyu.isd.hackathon.domain.match;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Team;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 팀 합류 신청.
 *
 * 두 가지로 들어온다.
 *   - 원하는 팀을 골라 신청 (toTeam이 있다)
 *   - 어느 팀이든 좋으니 합쳐 달라 (toTeam이 null)
 *
 * 어느 쪽이든 바로 합쳐지지 않는다. 운영진이 양쪽에 연락해 확인한 뒤 직접 합치는 것이
 * 이 행사의 운영 방식이라, 신청은 대기 상태로 쌓이기만 한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_join_request")
public class JoinRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "join_request_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent event;

    /**
     * 합치고 싶어 하는 쪽. 신청을 보낸 사람의 팀이다.
     *
     * 합치고 나면 이 팀은 사라지므로 연결을 끊는다. 그래서 null을 허용하고,
     * 기록이 남도록 팀 이름을 따로 적어 둔다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_team_id")
    private Team fromTeam;

    /** 들어가고 싶은 팀. 특정 팀을 고르지 않았으면 null이다. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_team_id")
    private Team toTeam;

    /** 신청 당시의 팀 이름. 팀이 사라져도 목록에 남기기 위한 사본이다. */
    @Column(name = "from_team_name", length = 60, nullable = false)
    private String fromTeamName;

    @Column(name = "to_team_name", length = 60)
    private String toTeamName;

    /** 신청 당시 보낸 팀의 인원. 팀이 사라진 뒤에도 보여 준다. */
    @Column(name = "from_member_count", nullable = false)
    private int fromMemberCount;

    /** 신청하면서 남긴 한마디. 운영진이 연락할 때 참고한다. */
    @Column(length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private JoinRequestStatus status;

    /** 운영진이 반려하거나 합친 뒤 남기는 메모 */
    @Column(name = "handled_note", length = 500)
    private String handledNote;

    private JoinRequest(HackathonEvent event, Team fromTeam, Team toTeam, String message) {
        this.event = event;
        this.fromTeam = fromTeam;
        this.toTeam = toTeam;
        this.fromTeamName = fromTeam.getName();
        this.toTeamName = toTeam != null ? toTeam.getName() : null;
        this.fromMemberCount = fromTeam.memberCount();
        this.message = message;
        this.status = JoinRequestStatus.PENDING;
    }

    public static JoinRequest create(HackathonEvent event, Team fromTeam, Team toTeam, String message) {
        return new JoinRequest(event, fromTeam, toTeam, message);
    }

    public boolean isPending() {
        return this.status == JoinRequestStatus.PENDING;
    }

    /** 특정 팀을 고르지 않은 "아무 팀이나" 신청인가 */
    public boolean isOpenRequest() {
        return this.toTeam == null;
    }

    public void markMerged(String note) {
        this.status = JoinRequestStatus.MERGED;
        this.handledNote = note;
    }

    public void reject(String note) {
        this.status = JoinRequestStatus.REJECTED;
        this.handledNote = note;
    }

    /**
     * 사라지는 팀과의 연결을 끊는다.
     *
     * 팀이 지워지면 외래 키가 걸려 삭제가 막힌다. 이름은 이미 사본으로 들고 있으므로
     * 연결만 떼어 내면 기록은 그대로 남는다.
     */
    public void detachTeam(Long teamId) {
        if (fromTeam != null && fromTeam.getId().equals(teamId)) this.fromTeam = null;
        if (toTeam != null && toTeam.getId().equals(teamId)) this.toTeam = null;
    }
}
