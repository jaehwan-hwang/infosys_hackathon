package kr.hyu.isd.hackathon.application.team;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.dto.response.ApiErrorData;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.RecruitStatus;
import kr.hyu.isd.hackathon.domain.team.SelfCheck;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.team.TeamMemberRole;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.UserRepository;
import kr.hyu.isd.hackathon.web.team.dto.RecruitUpdateRequest;
import kr.hyu.isd.hackathon.web.team.dto.SelfCheckRequest;
import kr.hyu.isd.hackathon.web.team.dto.SelfCheckResultResponse;
import kr.hyu.isd.hackathon.web.team.dto.TeamMemberRequest;
import kr.hyu.isd.hackathon.web.team.dto.TeamRegisterRequest;
import kr.hyu.isd.hackathon.web.team.dto.TeamResponse;
import kr.hyu.isd.hackathon.web.team.dto.TeamUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventService eventService;

    /**
     * 자가진단 결과 미리보기. 저장하지 않고 계산만 한다.
     * 등록 폼에서 권장 트랙을 즉시 안내하는 용도.
     */
    public SelfCheckResultResponse previewSelfCheck(SelfCheckRequest request) {
        SelfCheck check = request.toDomain();
        return new SelfCheckResultResponse(
                check.resolveTrack(),
                check.hasInstantSummitReason(),
                check.checkedCount(),
                check.describeReason()
        );
    }

    /**
     * 팀을 등록한다. 요청자가 조장이 되며, 트랙은 서버가 자가진단으로 다시 계산한다.
     */
    @Transactional
    public TeamResponse register(Long userId, TeamRegisterRequest request) {
        HackathonEvent event = eventService.getActiveEvent();

        if (!request.privacyConsent()) {
            throw new HackathonException(ErrorCode.BAD_REQUEST, "개인정보 수집·이용 동의가 필요합니다.");
        }
        if (!event.isRegistrationOpen(Instant.now())) {
            throw new HackathonException(ErrorCode.REGISTRATION_CLOSED);
        }

        User leader = userRepository.findById(userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND));
        if (!leader.isProfileCompleted()) {
            throw new HackathonException(ErrorCode.PROFILE_REQUIRED);
        }

        // 한 사람이 두 팀에 속할 수 없다.
        teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                .ifPresent(t -> {
                    throw new HackathonException(ErrorCode.ALREADY_IN_TEAM,
                            "이미 %s 팀에 소속되어 있습니다.".formatted(t.getName()));
                });

        if (teamRepository.existsByEventIdAndName(event.getId(), request.name())) {
            throw new HackathonException(ErrorCode.DUPLICATE_TEAM_NAME);
        }

        List<TeamMemberRequest> memberRequests = request.members() != null
                ? request.members() : List.of();
        validateTeamSize(event, memberRequests.size() + 1);
        validateNoDuplicates(leader, memberRequests);

        Team team = Team.create(event, request.name(), leader, request.appliedTrack(),
                request.selfCheck() != null ? request.selfCheck().toDomain() : SelfCheck.empty(),
                request.recruiting(), trimToNull(request.recruitNote()));

        // 팀장은 등록 폼에서 고른다. 비워 두면 등록한 본인이 팀장이 된다.
        String leaderEmail = resolveLeaderEmail(request, leader, memberRequests);

        team.addMember(TeamMember.create(team, leader,
                leader.getName(), leader.getStudentId(), leader.getEmail(),
                roleOf(leader.getEmail(), leaderEmail), request.duesPaid()));

        for (TeamMemberRequest m : memberRequests) {
            // 이미 가입한 팀원이면 계정을 바로 연결하고, 아니면 로그인 시점에 연결한다.
            String email = m.email().toLowerCase();
            User linked = userRepository.findByEmail(email).orElse(null);
            team.addMember(TeamMember.create(team, linked, m.name(), m.studentId(), email,
                    roleOf(email, leaderEmail), m.duesPaid()));
        }

        Team saved = teamRepository.save(team);
        log.info("팀 등록: name={}, track={}, reason={}, members={}",
                saved.getName(), saved.getTrack(), saved.getTrackReason(), saved.memberCount());

        return TeamResponse.from(saved);
    }

    /**
     * 내 팀 조회. 소속 팀이 없으면 null을 돌려준다.
     * 아직 등록하지 않은 것은 오류가 아니라 정상 상태이므로 404로 만들지 않는다.
     */
    @Transactional(readOnly = true)
    public TeamResponse getMyTeam(Long userId) {
        HackathonEvent event = eventService.getActiveEvent();
        return teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                .map(TeamResponse::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeam(Long teamId) {
        return TeamResponse.publicView(findTeamWithMembers(teamId));
    }

    /**
     * 팀 목록(공개용). track이 null이면 전체를 준다.
     *
     * 정렬은 Spark → Sprint → Summit 순이고 같은 트랙 안에서는 등록이 빠른 순이다.
     * 개인정보(학번·이메일)와 배정 근거는 publicView가 빼고 내려준다.
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> getTeams(Track track) {
        HackathonEvent event = eventService.getActiveEvent();
        List<Team> teams = track != null
                ? teamRepository.findByEventIdAndTrackWithMembers(event.getId(), track)
                : teamRepository.findAllByEventIdWithMembers(event.getId());

        return teams.stream()
                .sorted(Comparator.comparing(Team::getTrack).thenComparing(Team::getId))
                .map(TeamResponse::publicView)
                .toList();
    }

    /** 팀 정보 수정. 조장만 가능하다. */
    @Transactional
    public TeamResponse updateTeam(Long userId, Long teamId, TeamUpdateRequest request) {
        Team team = findTeamWithMembers(teamId);
        requireLeader(team, userId);

        HackathonEvent event = team.getEvent();
        if (!event.isRegistrationOpen(Instant.now())) {
            throw new HackathonException(ErrorCode.REGISTRATION_CLOSED,
                    "신청 기간이 끝나 팀 정보를 수정할 수 없습니다.");
        }

        if (!team.getName().equals(request.name())
                && teamRepository.existsByEventIdAndName(event.getId(), request.name())) {
            throw new HackathonException(ErrorCode.DUPLICATE_TEAM_NAME);
        }

        team.rename(request.name());
        return TeamResponse.from(team);
    }

    /**
     * 팀장으로 지정된 사람의 이메일을 정한다.
     *
     * 폼에서 고른 값이 우리 팀 사람이 아니면 등록한 본인으로 되돌린다 — 팀장이 없는 팀이
     * 생기면 결과물을 낼 사람이 사라진다.
     */
    private String resolveLeaderEmail(TeamRegisterRequest request, User registrant,
                                      List<TeamMemberRequest> members) {
        String picked = trimToNull(request.leaderEmail());
        if (picked == null) return registrant.getEmail().toLowerCase();

        String lowered = picked.toLowerCase();
        if (lowered.equalsIgnoreCase(registrant.getEmail())) return lowered;
        boolean amongMembers = members.stream()
                .anyMatch(m -> m.email() != null && m.email().equalsIgnoreCase(lowered));
        if (amongMembers) return lowered;

        throw new HackathonException(ErrorCode.INVALID_INPUT,
                "팀장은 팀원 중에서 골라야 합니다.");
    }

    private TeamMemberRole roleOf(String email, String leaderEmail) {
        return email.equalsIgnoreCase(leaderEmail) ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** 모집 상태 변경. 팀장 또는 등록한 사람만 할 수 있다. */
    @Transactional
    public TeamResponse updateRecruiting(Long userId, Long teamId, RecruitUpdateRequest request) {
        Team team = findTeamWithMembers(teamId);
        requireLeader(team, userId);
        team.updateRecruiting(request.recruiting(), trimToNull(request.recruitNote()));
        return TeamResponse.from(team);
    }

    /**
     * 모집 중인 팀 목록.
     *
     * 내 팀이 팀원을 찾고 있으면 팀장을 찾는 팀이, 팀장을 찾고 있으면 팀원을 찾는 팀이 보인다.
     * 서로 필요한 것이 반대인 쪽만 추려 주는 편이 전체 목록을 훑는 것보다 빠르다.
     */
    @Transactional(readOnly = true)
    public List<TeamResponse> getRecruitingTeams(Long userId, RecruitStatus want) {
        HackathonEvent event = eventService.getActiveEvent();
        Team myTeam = teamRepository.findByEventIdAndMemberUserId(event.getId(), userId).orElse(null);

        RecruitStatus target = want != null ? want
                : (myTeam != null ? myTeam.getRecruiting().counterpart() : RecruitStatus.NONE);

        List<Team> teams = target == RecruitStatus.NONE
                ? teamRepository.findAllByEventIdWithMembers(event.getId()).stream()
                        .filter(t -> t.getRecruiting() != RecruitStatus.NONE).toList()
                : teamRepository.findByEventIdAndRecruitingWithMembers(event.getId(), target);

        return teams.stream()
                .filter(t -> myTeam == null || !t.getId().equals(myTeam.getId()))
                .sorted(Comparator.comparing(Team::getTrack).thenComparing(Team::getId))
                .map(TeamResponse::publicView)
                .toList();
    }

    private void validateTeamSize(HackathonEvent event, int size) {
        if (size < event.getMinTeamSize() || size > event.getMaxTeamSize()) {
            throw new HackathonException(ErrorCode.INVALID_TEAM_SIZE,
                    "팀 인원은 %d~%d명이어야 합니다. (현재 %d명)"
                            .formatted(event.getMinTeamSize(), event.getMaxTeamSize(), size));
        }
    }

    /** 팀 안에서 이메일·학번이 겹치지 않는지 확인한다. */
    private void validateNoDuplicates(User leader, List<TeamMemberRequest> members) {
        List<ApiErrorData> errors = new ArrayList<>();
        Set<String> emails = new HashSet<>();
        Set<String> studentIds = new HashSet<>();

        emails.add(leader.getEmail().toLowerCase());
        if (leader.getStudentId() != null) {
            studentIds.add(leader.getStudentId());
        }

        for (int i = 0; i < members.size(); i++) {
            TeamMemberRequest m = members.get(i);
            if (!emails.add(m.email().toLowerCase())) {
                errors.add(new ApiErrorData("members[%d].email".formatted(i),
                        "중복된 이메일입니다.", m.email()));
            }
            if (!studentIds.add(m.studentId())) {
                errors.add(new ApiErrorData("members[%d].studentId".formatted(i),
                        "중복된 학번입니다.", m.studentId()));
            }
        }

        if (!errors.isEmpty()) {
            throw new HackathonException(ErrorCode.DUPLICATE_MEMBER, errors);
        }
    }

    private Team findTeamWithMembers(Long teamId) {
        return teamRepository.findByIdWithMembers(teamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));
    }

    /**
     * 팀을 건드릴 수 있는 사람인지 확인한다.
     *
     * 등록한 사람과, 폼에서 팀장으로 지정된 사람 둘 다 통과시킨다.
     * 등록은 대개 한 명이 대표로 하지만 팀장은 따로 지정할 수 있어 둘이 다를 수 있다.
     */
    private void requireLeader(Team team, Long userId) {
        if (!team.canManage(userId)) {
            throw new HackathonException(ErrorCode.NOT_TEAM_LEADER);
        }
    }
}
