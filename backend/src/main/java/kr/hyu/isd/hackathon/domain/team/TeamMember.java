package kr.hyu.isd.hackathon.domain.team;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.user.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 팀 구성원. 조장이 등록 시 팀원 정보를 직접 입력하므로,
 * 아직 로그인한 적 없는 팀원은 user가 null이고 입력된 이름/학번/이메일만 남는다.
 * 해당 팀원이 나중에 로그인하면 이메일로 매칭해 user를 채운다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_team_member", uniqueConstraints = {
        @UniqueConstraint(name = "uk_member_team_email", columnNames = {"team_id", "email"})
})
public class TeamMember extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_member_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    /** 매칭된 서비스 계정. 미로그인 팀원은 null */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(name = "student_id", length = 20, nullable = false)
    private String studentId;

    @Column(length = 120, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TeamMemberRole role;

    /**
     * 학생회비를 납부한 재학생인가.
     *
     * false면 참가비 1만원 대상이다(미납자 또는 휴학생). 본인이 고른 값을 그대로 두고,
     * 실제 확인과 입금 대조는 운영진이 명단을 받아 한다.
     *
     * 열을 NOT NULL로 두지 않는다 — 이 항목이 생기기 전에 등록된 팀원이 이미 있어서,
     * 운영 중인 DB에 NOT NULL 열을 더하면 기동 때 스키마 변경이 실패한다.
     * 값이 없으면 납부한 것으로 읽어, 묻지 않았던 사람이 갑자기 미납으로 뜨지 않게 한다.
     */
    @Column(name = "dues_paid")
    private Boolean duesPaid;

    private TeamMember(Team team, User user, String name, String studentId,
                       String email, TeamMemberRole role, Boolean duesPaid) {
        this.team = team;
        this.user = user;
        this.name = name;
        this.studentId = studentId;
        this.email = email;
        this.role = role;
        this.duesPaid = duesPaid;
    }

    public static TeamMember create(Team team, User user, String name, String studentId,
                                    String email, TeamMemberRole role, boolean duesPaid) {
        return new TeamMember(team, user, name, studentId, email, role, duesPaid);
    }

    /** 값이 없던 예전 팀원은 납부한 것으로 본다. */
    public boolean isDuesPaid() {
        return !Boolean.FALSE.equals(this.duesPaid);
    }

    /** 팀을 합칠 때 옮겨 온 팀원은 팀원 자격으로 들어간다. */
    public void moveTo(Team team) {
        this.team = team;
        this.role = TeamMemberRole.MEMBER;
    }

    /** 참가비 1만원을 내야 하는 사람인가 */
    public boolean needsEntryFee() {
        return !isDuesPaid();
    }

    /** 팀원이 뒤늦게 로그인했을 때 계정을 연결한다. */
    public void linkUser(User user) {
        this.user = user;
    }

    public boolean isLeader() {
        return this.role == TeamMemberRole.LEADER;
    }
}
