package kr.hyu.isd.hackathon.domain.user;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

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

    /** 운영진 연락용. 참가자 명단 내보내기에 함께 나간다. */
    @Column(length = 20)
    private String phone;

    /**
     * 개인정보 수집·이용 동의.
     *
     * 팀 등록이 아니라 프로필 등록에서 본인이 직접 한다 — 팀장이 팀원 몫까지 대신
     * 동의하는 형태는 동의라고 보기 어렵다.
     */
    @Column(name = "privacy_consent")
    private Boolean privacyConsent;

    @Column(name = "privacy_consent_at")
    private Instant privacyConsentAt;

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
    public void completeProfile(String name, String studentId, String department,
                               String phone, boolean privacyConsent) {
        this.name = name;
        this.studentId = studentId;
        this.department = department;
        this.phone = phone;
        if (privacyConsent && !Boolean.TRUE.equals(this.privacyConsent)) {
            this.privacyConsent = true;
            this.privacyConsentAt = Instant.now();
        }
        this.profileCompleted = true;
    }

    /** 개인정보 수집·이용에 동의했는가 */
    public boolean hasPrivacyConsent() {
        return Boolean.TRUE.equals(this.privacyConsent);
    }

    /**
     * 참가에 필요한 정보가 다 모였는가.
     *
     * 저장된 깃발만 보지 않는다. 전화번호와 동의를 받기 전에 가입한 사람은 깃발이
     * 켜져 있어도 두 값이 비어 있어서, 프로필 화면이 다시 뜨지 않으면 동의할 길이
     * 없는 채로 팀 등록만 막힌다. 빠진 것이 있으면 다시 받는다.
     */
    public boolean isProfileReady() {
        return this.profileCompleted && hasPrivacyConsent()
                && this.phone != null && !this.phone.isBlank();
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public boolean isAdmin() {
        return this.role.isStaff();
    }

    public boolean isProfessor() {
        return this.role == Role.PROFESSOR;
    }
}
