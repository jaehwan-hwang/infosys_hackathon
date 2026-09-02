package kr.hyu.isd.hackathon.application.team;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.dto.response.ApiErrorData;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.SelfCheck;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.UserRepository;
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

        Team team = Team.create(event, request.name(), request.topic(), request.description(),
                leader, request.appliedTrack(),
                request.selfCheck() != null ? request.selfCheck().toDomain() : SelfCheck.empty());

        team.addMember(TeamMember.createLeader(team, leader,
                leader.getName(), leader.getStudentId(), leader.getEmail()));

        for (TeamMemberRequest m : memberRequests) {
            // 이미 가입한 팀원이면 계정을 바로 연결하고, 아니면 로그인 시점에 연결한다.
            String email = m.email().toLowerCase();
            User linked = userRepository.findByEmail(email).orElse(null);
            team.addMember(TeamMember.createMember(team, linked, m.name(), m.studentId(), email));
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

    /** 트랙별 팀 목록(공개용). 평가 대상 선택 화면이 쓴다. */
    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByTrack(Track track) {
        HackathonEvent event = eventService.getActiveEvent();
        return teamRepository.findByEventIdAndTrackWithMembers(event.getId(), track)
                .stream()
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

        team.updateInfo(request.name(), request.topic(), request.description());
        return TeamResponse.from(team);
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

    private void requireLeader(Team team, Long userId) {
        if (!team.isLedBy(userId)) {
            throw new HackathonException(ErrorCode.NOT_TEAM_LEADER);
        }
    }
}
