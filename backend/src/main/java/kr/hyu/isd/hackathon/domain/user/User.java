package kr.hyu.isd.hackathon.domain.user;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 서비스 사용자. Google 로그인(@hanyang.ac.kr) 시 최초 1회 생성되고,
 * 성명/학번은 프로필 입력 폼에서 한 번 수집한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_user")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    /** Google 계정 이메일. 로그인 식별자 */
    @Column(length = 120, nullable = false, unique = true)
    private String email;

    @Column(length = 50, nullable = false)
    private String name;

    /** 학번. 최초 로그인 후 프로필 입력 전까지는 null */
    @Column(name = "student_id", length = 20)
    private String studentId;

    @Column(length = 50)
    private String department;

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Role role;

    private User(String email, String name, Role role) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.profileCompleted = false;
    }

    public static User createStudent(String email, String name) {
        return new User(email, name, Role.STUDENT);
    }

    public static User create(String email, String name, Role role) {
        return new User(email, name, role);
    }

    /** 최초 로그인 이후 학번·학과를 채우면 프로필 완료로 표시한다. */
    public void completeProfile(String name, String studentId, String department) {
        this.name = name;
        this.studentId = studentId;
        this.department = department;
        this.profileCompleted = true;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    public boolean isProfessor() {
        return this.role == Role.PROFESSOR;
    }
}
