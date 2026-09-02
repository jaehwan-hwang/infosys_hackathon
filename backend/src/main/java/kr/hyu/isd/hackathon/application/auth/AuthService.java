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

        String accessToken = jwtProvider.issue(user);
        return new LoginResponse(
                accessToken,
                jwtProvider.getExpirySeconds(),
                UserResponse.from(user),
                !user.isProfileCompleted()
        );
    }

    private User createUser(GoogleIdentity identity) {
        User user = User.create(identity.email(), identity.name(), resolveConfiguredRole(identity.email()));
        log.info("신규 사용자 생성: email={}, role={}", user.getEmail(), user.getRole());
        return userRepository.save(user);
    }

    /** 설정에 지정된 권한이 있으면 그것을, 없으면 STUDENT를 돌려준다. */
    private Role resolveConfiguredRole(String email) {
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

        teamRepository.findByEventIdAndMemberEmail(eventId, user.getEmail())
                .ifPresent(team -> linkMember(team, user));
    }

    private void linkMember(Team team, User user) {
        team.getMembers().stream()
                .filter(m -> m.getUser() == null && m.getEmail().equalsIgnoreCase(user.getEmail()))
                .findFirst()
                .ifPresent((TeamMember member) -> {
                    member.linkUser(user);
                    log.info("팀원 계정 연결: team={}, email={}", team.getName(), user.getEmail());
                });
    }

    /** 최초 로그인 후 학번·성명을 등록한다. */
    @Transactional
    public UserResponse completeProfile(Long userId, ProfileRequest request) {
        User user = findUser(userId);
        user.completeProfile(request.name(), request.studentId(), request.department());
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        return UserResponse.from(findUser(userId));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND));
    }

    private static boolean containsIgnoreCase(java.util.List<String> list, String value) {
        return list.stream().anyMatch(s -> s.trim().equalsIgnoreCase(value));
    }
}
