package kr.hyu.isd.hackathon.application.admin;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.evaluation.Award;
import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.*;
import kr.hyu.isd.hackathon.web.admin.dto.*;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import kr.hyu.isd.hackathon.web.event.dto.EventResponse;
import kr.hyu.isd.hackathon.web.team.dto.TeamMemberResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 학생회 운영진 전용 기능.
 *
 * 경로 단위 ADMIN 검사는 SecurityConfig가 이미 했으므로,
 * 여기서는 데이터 정합성(가중치 합, 배정 정정 등)에 집중한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final HackathonEventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final CriterionRepository criterionRepository;
    private final EvaluationRepository evaluationRepository;
    private final AwardRepository awardRepository;
    private final UserRepository userRepository;
    private final EventService eventService;

    // ---- 대시보드 ----

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        HackathonEvent event = eventService.getActiveEvent();
        Long eventId = event.getId();

        Map<Track, Long> teamsByTrack = new EnumMap<>(Track.class);
        Map<Track, Long> submissionsByTrack = new EnumMap<>(Track.class);
        Map<Track, Long> studentVotesByTrack = new EnumMap<>(Track.class);
        Map<Track, Boolean> votingOpen = new EnumMap<>(Track.class);

        long totalParticipants = 0;
        for (Track track : Track.values()) {
            List<Team> teams = teamRepository.findByEventIdAndTrackWithMembers(eventId, track);
            teamsByTrack.put(track, (long) teams.size());
            totalParticipants += teams.stream().mapToInt(Team::memberCount).sum();

            long submitted = submissionRepository.findByEventIdAndTrack(eventId, track).stream()
                    .filter(Submission::isComplete)
                    .count();
            submissionsByTrack.put(track, submitted);

            studentVotesByTrack.put(track, evaluationRepository
                    .countByEventIdAndTrackAndEvaluatorType(eventId, track, EvaluatorType.STUDENT));
            votingOpen.put(track, event.isVotingOpen(track));
        }

        long professorVotes = evaluationRepository.countByEventIdAndTrackAndEvaluatorType(
                eventId, Track.SUMMIT, EvaluatorType.PROFESSOR);

        return new DashboardResponse(
                teamRepository.countByEventId(eventId),
                submissionRepository.countByEventId(eventId),
                totalParticipants,
                teamsByTrack,
                submissionsByTrack,
                studentVotesByTrack,
                professorVotes,
                event.isResultsPublished(),
                votingOpen
        );
    }

    /** 팀 전체 목록 + 제출 현황 */
    @Transactional(readOnly = true)
    public List<TeamAdminResponse> getTeams() {
        HackathonEvent event = eventService.getActiveEvent();

        Map<Long, Submission> submissionByTeam = new HashMap<>();
        submissionRepository.findAllByEventId(event.getId())
                .forEach(s -> submissionByTeam.put(s.getTeam().getId(), s));

        return teamRepository.findAllByEventIdWithMembers(event.getId()).stream()
                .map(team -> toAdminResponse(team, submissionByTeam.get(team.getId())))
                .toList();
    }

    private TeamAdminResponse toAdminResponse(Team team, Submission submission) {
        List<TeamMemberResponse> members = team.getMembers().stream()
                .sorted(Comparator.comparing(m -> !m.isLeader()))
                .map(TeamMemberResponse::from)
                .toList();

        List<String> missing = submission != null ? submission.findMissingRequirements() : List.of();

        return new TeamAdminResponse(
                team.getId(),
                team.getName(),
                team.getTopic(),
                team.getTrack(),
                team.getTrackReason(),
                team.getLeader().getName(),
                team.getLeader().getEmail(),
                members.size(),
                members,
                submission != null,
                submission != null && missing.isEmpty(),
                missing,
                submission != null ? submission.getSubmittedAt() : null,
                team.getCreatedAt()
        );
    }

    // ---- 행사 설정 ----

    @Transactional
    public EventResponse updateEvent(EventUpdateRequest request) {
        HackathonEvent event = eventService.getActiveEvent();

        if (request.minTeamSize() > request.maxTeamSize()) {
            throw new HackathonException(ErrorCode.INVALID_INPUT,
                    "최소 인원이 최대 인원보다 클 수 없습니다.");
        }

        event.updateBasics(request.title(), request.theme(), request.description(),
                request.location(), request.contactUrl());
        event.updateSchedule(request.registerStartsAt(), request.registerEndsAt(),
                request.sparkSubmitDeadline(), request.devSubmitDeadline());
        event.updateRules(request.minTeamSize(), request.maxTeamSize(), request.maxUploadMb());

        log.info("행사 설정 변경: title={}", event.getTitle());
        return EventResponse.from(event);
    }

    /** 발표 종료 후 트랙별 평가를 연다/닫는다. */
    @Transactional
    public EventResponse toggleVoting(VotingToggleRequest request) {
        HackathonEvent event = eventService.getActiveEvent();
        event.setVotingOpen(request.track(), request.open());
        log.info("평가 토글: track={}, open={}", request.track(), request.open());
        return EventResponse.from(event);
    }

    /** 시상식에서 결과를 공개한다. */
    @Transactional
    public EventResponse publishResults(boolean published) {
        HackathonEvent event = eventService.getActiveEvent();
        event.setResultsPublished(published);
        log.info("결과 공개 상태 변경: {}", published);
        return EventResponse.from(event);
    }

    // ---- 평가 항목 ----

    @Transactional(readOnly = true)
    public List<CriterionResponse> getCriteria() {
        HackathonEvent event = eventService.getActiveEvent();
        return criterionRepository.findByEventIdOrderByTrackAscDisplayOrderAsc(event.getId())
                .stream()
                .map(CriterionResponse::from)
                .toList();
    }

    @Transactional
    public CriterionResponse createCriterion(CriterionRequest request) {
        HackathonEvent event = eventService.getActiveEvent();
        Criterion criterion = Criterion.create(event, request.track(), request.evaluatorType(),
                request.name(), request.description(), request.maxScore(),
                request.weight(), request.displayOrder());
        return CriterionResponse.from(criterionRepository.save(criterion));
    }

    @Transactional
    public CriterionResponse updateCriterion(Long criterionId, CriterionRequest request) {
        Criterion criterion = criterionRepository.findById(criterionId)
                .orElseThrow(() -> new HackathonException(ErrorCode.CRITERION_NOT_FOUND));
        criterion.update(request.name(), request.description(), request.maxScore(),
                request.weight(), request.displayOrder());
        return CriterionResponse.from(criterion);
    }

    @Transactional
    public void deleteCriterion(Long criterionId) {
        if (!criterionRepository.existsById(criterionId)) {
            throw new HackathonException(ErrorCode.CRITERION_NOT_FOUND);
        }
        criterionRepository.deleteById(criterionId);
    }

    /**
     * 트랙·평가자유형별 가중치 합을 점검한다.
     *
     * 합이 1.0이 아니면 총점이 100점 만점으로 환산되지 않아 트랙 간 비교가 어긋난다.
     * 저장을 막지는 않고(중간 편집 상태를 허용), 어긋난 조합을 알려주기만 한다.
     */
    @Transactional(readOnly = true)
    public List<String> validateCriteriaWeights() {
        HackathonEvent event = eventService.getActiveEvent();
        Map<String, BigDecimal> sums = new HashMap<>();

        for (Criterion c : criterionRepository.findByEventIdOrderByTrackAscDisplayOrderAsc(event.getId())) {
            String key = c.getTrack() + "/" + c.getEvaluatorType();
            sums.merge(key, c.getWeight(), BigDecimal::add);
        }

        return sums.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ONE) != 0)
                .map(e -> "%s 가중치 합이 %s입니다 (1.0이어야 함)".formatted(e.getKey(), e.getValue()))
                .toList();
    }

    // ---- 트랙 배정 정정 ----

    /** 자동 배정 결과를 운영진이 수동으로 바꾼다. */
    @Transactional
    public TeamAdminResponse overrideTrack(Long teamId, Track track, String reason) {
        Team team = teamRepository.findByIdWithMembers(teamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));

        Track previous = team.getTrack();
        team.overrideTrack(track, reason != null ? reason : "운영진 수동 배정");
        log.info("트랙 수동 변경: team={}, {} -> {}", team.getName(), previous, track);

        return toAdminResponse(team, submissionRepository.findByTeamId(teamId).orElse(null));
    }

    // ---- 수상 ----

    @Transactional
    public void createAward(AwardRequest request) {
        Team team = teamRepository.findById(request.teamId())
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));
        // 팀당 수상은 하나로 유지한다. 다시 등록하면 이전 수상을 대체한다.
        awardRepository.deleteByTeamId(team.getId());
        awardRepository.save(Award.create(team, request.awardName(), request.awardRank()));
    }

    @Transactional
    public void deleteAward(Long awardId) {
        if (!awardRepository.existsById(awardId)) {
            throw new HackathonException(ErrorCode.AWARD_NOT_FOUND);
        }
        awardRepository.deleteById(awardId);
    }

    // ---- 권한 ----

    /** 교수·운영진 권한을 부여한다. 아직 로그인 전인 이메일도 미리 등록할 수 있다. */
    @Transactional
    public UserResponse updateRole(RoleUpdateRequest request) {
        String email = request.email().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(email);

        User user = existing.orElseGet(() ->
                userRepository.save(User.create(email, email.split("@")[0], request.role())));
        user.changeRole(request.role());

        log.info("권한 변경: email={}, role={}", email, request.role());
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getStaff() {
        return java.util.stream.Stream.concat(
                        userRepository.findByRole(Role.ADMIN).stream(),
                        userRepository.findByRole(Role.PROFESSOR).stream())
                .map(UserResponse::from)
                .toList();
    }
}
