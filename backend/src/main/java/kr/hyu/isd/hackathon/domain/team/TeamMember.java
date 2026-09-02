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

    private TeamMember(Team team, User user, String name, String studentId,
                       String email, TeamMemberRole role) {
        this.team = team;
        this.user = user;
        this.name = name;
        this.studentId = studentId;
        this.email = email;
        this.role = role;
    }

    public static TeamMember createLeader(Team team, User user, String name, String studentId, String email) {
        return new TeamMember(team, user, name, studentId, email, TeamMemberRole.LEADER);
    }

    public static TeamMember createMember(Team team, User user, String name, String studentId, String email) {
        return new TeamMember(team, user, name, studentId, email, TeamMemberRole.MEMBER);
    }

    /** 팀원이 뒤늦게 로그인했을 때 계정을 연결한다. */
    public void linkUser(User user) {
        this.user = user;
    }

    public boolean isLeader() {
        return this.role == TeamMemberRole.LEADER;
    }
}
