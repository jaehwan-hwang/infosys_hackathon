package kr.hyu.isd.hackathon.application.auth;

import kr.hyu.isd.hackathon.common.auth.AuthProperties;
import kr.hyu.isd.hackathon.common.auth.GoogleIdTokenVerifier;
import kr.hyu.isd.hackathon.common.auth.GoogleIdTokenVerifier.GoogleIdentity;
import kr.hyu.isd.hackathon.common.auth.JwtProvider;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.UserRepository;
import kr.hyu.isd.hackathon.web.auth.dto.LoginResponse;
import kr.hyu.isd.hackathon.web.auth.dto.ProfileRequest;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final HackathonEventRepository eventRepository;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final JwtProvider jwtProvider;
    private final AuthProperties authProperties;

    /**
     * Google ID 토큰으로 로그인한다. 처음 보는 이메일이면 계정을 만들고,
     * 설정에 등록된 운영진·교수 이메일이면 그에 맞는 권한을 부여한다.
     */
    @Transactional
    public LoginResponse loginWithGoogle(String idToken) {
        GoogleIdentity identity = googleIdTokenVerifier.verify(idToken);

        User user = userRepository.findByEmail(identity.email())
                .orElseGet(() -> createUser(identity));

        // 설정 파일의 운영진·교수 목록이 바뀌었으면 로그인 시점에 반영한다.
        syncConfiguredRole(user);

        // 조장이 미리 입력해 둔 팀원 자리가 있으면 이 계정과 연결한다.
        linkPendingTeamMembership(user);

        return issueLogin(user);
    }

    /**
     * 구글 없이 이메일로 로그인한다 — 로컬 테스트 전용. 열려 있는지는 컨트롤러가 DevLoginGate로 본다.
     * 미리 만들어 둔 테스트 계정만 받는다. 처음 보는 이메일로 계정을 만들지는 않는다.
     */
    @Transactional
    public LoginResponse loginForTesting(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND,
                        "테스트 계정이 아닙니다: " + email));
        return issueLogin(user);
    }

    private LoginResponse issueLogin(User user) {
        String accessToken = jwtProvider.issue(user);
        return new LoginResponse(
                accessToken,
                jwtProvider.getExpirySeconds(),
                UserResponse.from(user, authProperties.isSuperAdmin(user.getEmail())),
                !user.isProfileReady()
        );
    }

    private User createUser(GoogleIdentity identity) {
        User user = User.create(identity.email(), identity.name(), resolveConfiguredRole(identity.email()));
        log.info("신규 사용자 생성: email={}, role={}", user.getEmail(), user.getRole());
        return userRepository.save(user);
    }

    /** 설정에 지정된 권한이 있으면 그것을, 없으면 STUDENT를 돌려준다. */
    private Role resolveConfiguredRole(String email) {
        // 최고 관리자도 DB상으로는 운영진이다. 구분은 설정의 이메일 목록으로만 한다.
        if (containsIgnoreCase(authProperties.superAdminEmails(), email)) return Role.ADMIN;
        if (containsIgnoreCase(authProperties.adminEmails(), email)) return Role.ADMIN;
        if (containsIgnoreCase(authProperties.professorEmails(), email)) return Role.PROFESSOR;
        return Role.STUDENT;
    }

    /**
     * 설정으로 부여되는 권한만 동기화한다.
     * 운영진이 대시보드에서 직접 올린 권한을 설정 파일이 되돌리지 않도록,
     * 강등은 하지 않고 승격만 반영한다.
     */
    private void syncConfiguredRole(User user) {
        Role configured = resolveConfiguredRole(user.getEmail());
        if (configured != Role.STUDENT && user.getRole() != configured) {
            user.changeRole(configured);
            log.info("설정 기반 권한 승격: email={}, role={}", user.getEmail(), configured);
        }
    }

    /**
     * 조장이 등록 시 이메일만 적어둔 팀원 자리에 이 계정을 연결한다.
     * 연결돼야 투표 시 "자기 팀" 판정과 팀 조회가 정상 동작한다.
     */
    private void linkPendingTeamMembership(User user) {
        Optional<HackathonEvent> event = eventRepository.findFirstByActiveTrueOrderByIdDesc();
        if (event.isEmpty()) return;

        Long eventId = event.get().getId();
        // 이미 연결된 팀이 있으면 할 일이 없다.
        if (teamRepository.findByEventIdAndMemberUserId(eventId, user.getId()).isPresent()) return;

        // 같은 이메일이 두 팀에 적혀 있을 수도 있어 목록으로 받는다. 비어 있는 자리 하나에만 잇는다.
        for (Team team : teamRepository.findByEventIdAndMemberEmail(eventId, user.getEmail())) {
            if (linkMember(team, user)) return;
        }

        // 이메일로 못 찾으면 학번으로 찾는다. 조장이 팀원 이메일을 틀리게(오타·개인 메일) 적은 경우다.
        // 연결되지 않은 자리 중 학번이 같은 자리가 딱 하나일 때만 잇는다.
        String studentId = user.getStudentId() == null ? null : user.getStudentId().trim();
        if (studentId == null || studentId.isEmpty()) return;
        List<TeamMember> candidates = teamRepository.findByEventIdAndUnlinkedMemberStudentId(eventId, studentId)
                .stream()
                .flatMap(t -> t.getMembers().stream())
                .filter(m -> m.getUser() == null && studentId.equals(trim(m.getStudentId())))
                .toList();
        if (candidates.size() != 1) {
            if (candidates.size() > 1) {
                log.warn("학번이 같은 팀원 자리가 여럿이라 연결하지 않습니다: studentId={}", studentId);
            }
            return;
        }
        TeamMember member = candidates.get(0);
        String typedEmail = member.getEmail();
        member.linkUser(user);
        log.info("팀원 계정 연결(학번): team={}, 적힌 이메일={} → 로그인 이메일={}",
                member.getTeam().getName(), typedEmail, user.getEmail());
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private boolean linkMember(Team team, User user) {
        Optional<TeamMember> slot = team.getMembers().stream()
                .filter(m -> m.getUser() == null && m.getEmail().equalsIgnoreCase(user.getEmail()))
                .findFirst();
        slot.ifPresent(member -> {
            member.linkUser(user);
            log.info("팀원 계정 연결: team={}, email={}", team.getName(), user.getEmail());
        });
        return slot.isPresent();
    }

    /** 최초 로그인 후 학번·성명을 등록한다. */
    @Transactional
    public UserResponse completeProfile(Long userId, ProfileRequest request) {
        if (!request.privacyConsent()) {
            throw new HackathonException(ErrorCode.BAD_REQUEST,
                    "개인정보 수집·이용에 동의해야 참가할 수 있습니다.");
        }
        User user = findUser(userId);
        user.completeProfile(request.name(), request.studentId(), request.department(),
                normalizePhone(request.phone()), true);
        return UserResponse.from(user, authProperties.isSuperAdmin(user.getEmail()));
    }

    /** 전화번호를 010-1234-5678 꼴로 맞춘다. 명단을 뽑을 때 표기가 섞이지 않게 한다. */
    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() == 11) {
            return digits.substring(0, 3) + "-" + digits.substring(3, 7) + "-" + digits.substring(7);
        }
        if (digits.length() == 10) {
            return digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6);
        }
        return raw.trim();
    }

    /**
     * 내 정보. 화면이 30초마다 부르므로, 아직 팀에 연결되지 않은 계정은 여기서도 연결을 시도한다 —
     * 이미 로그인해 둔 사람은 다시 로그인하지 않아도 팀원 자리를 찾는다.
     */
    @Transactional
    public UserResponse getMe(Long userId) {
        User user = findUser(userId);
        if (user.getRole() == Role.STUDENT) {
            linkPendingTeamMembership(user);
        }
        return UserResponse.from(user, authProperties.isSuperAdmin(user.getEmail()));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND));
    }

    private static boolean containsIgnoreCase(java.util.List<String> list, String value) {
        return list.stream().anyMatch(s -> s.trim().equalsIgnoreCase(value));
    }
}
