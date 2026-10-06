package kr.hyu.isd.hackathon.application.admin;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.auth.AuthProperties;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.evaluation.Award;
import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.match.JoinRequest;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.*;
import kr.hyu.isd.hackathon.web.admin.dto.*;
import kr.hyu.isd.hackathon.web.auth.dto.UserResponse;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestResponse;
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
    private final JoinRequestRepository joinRequestRepository;
    private final AuthProperties authProperties;
    private final TeamMemberRepository teamMemberRepository;
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
        Map<Track, Boolean> resultsPublished = new EnumMap<>(Track.class);

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
            resultsPublished.put(track, event.isResultsPublished(track));
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
                resultsPublished,
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
                team.getTrack(),
                team.getRecruiting(),
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
                request.submitOpensAt(),
                request.sparkSubmitDeadline(), request.devSubmitDeadline());
        event.updateRules(request.minTeamSize(), request.maxTeamSize(), request.maxUploadMb());

        log.info("행사 설정 변경: title={}", event.getTitle());
        return EventResponse.from(event, eventService.effectiveMaxUploadMb(event));
    }

    /** 발표 종료 후 트랙별 평가를 연다/닫는다. */
    @Transactional
    public EventResponse toggleVoting(VotingToggleRequest request) {
        HackathonEvent event = eventService.getActiveEvent();
        event.setVotingOpen(request.track(), request.open());
        log.info("평가 토글: track={}, open={}", request.track(), request.open());
        return EventResponse.from(event, eventService.effectiveMaxUploadMb(event));
    }

    /**
     * 일차별 투표 전환. 1일차는 Spark만, 2일차는 Sprint·Summit만 열린다.
     */
    @Transactional
    public EventResponse openVotingForDay(int day) {
        if (day != 1 && day != 2) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "일차는 1 또는 2만 가능합니다.");
        }
        HackathonEvent event = eventService.getActiveEvent();
        event.openVotingForDay(day);
        log.info("{}일차 평가 전환: spark={}, sprint={}, summit={}", day,
                event.isSparkVotingOpen(), event.isSprintVotingOpen(), event.isSummitVotingOpen());
        return EventResponse.from(event, eventService.effectiveMaxUploadMb(event));
    }

    /** 시상식에서 트랙 하나의 리더보드를 공개한다. */
    @Transactional
    public EventResponse publishResults(Track track, boolean published) {
        HackathonEvent event = eventService.getActiveEvent();
        event.setResultsPublished(track, published);
        log.info("리더보드 공개 상태 변경: track={}, published={}", track, published);
        return EventResponse.from(event, eventService.effectiveMaxUploadMb(event));
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

    /**
     * 팀을 지운다. 테스트로 만든 팀을 정리하거나, 참가를 취소한 팀을 뺄 때 쓴다.
     *
     * 팀을 가리키는 기록(제출물·받은 평가·수상)을 먼저 정리해야 외래키가 끊기지 않는다.
     * 팀원 행은 Team에 cascade로 묶여 있어 함께 지워진다.
     * 계정 자체는 남는다 — 팀을 해체하는 것이지 사람을 지우는 것이 아니다.
     */
    @Transactional
    public void deleteTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));

        List<Evaluation> received = evaluationRepository.findAllByTargetTeamId(teamId);
        evaluationRepository.deleteAll(received);
        submissionRepository.findByTeamId(teamId).ifPresent(submissionRepository::delete);
        awardRepository.deleteByTeamId(teamId);
        // 이 팀이 걸린 합치기 신청도 같이 치운다. 남겨 두면 없는 팀을 가리킨다.
        joinRequestRepository.deleteAll(joinRequestRepository.findAllTouchingTeam(teamId));
        teamRepository.delete(team);

        log.warn("팀 삭제: id={}, name={}, 함께 지운 평가 {}건", teamId, team.getName(), received.size());
    }

    // ---- 팀 합치기 ----

    /** 들어온 합치기 신청 전부. 대기 중인 것이 위로 온다. */
    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getJoinRequests() {
        HackathonEvent event = eventService.getActiveEvent();
        return joinRequestRepository.findAllByEventId(event.getId()).stream()
                .map(JoinRequestResponse::from)
                .toList();
    }

    /**
     * 두 팀을 합친다.
     *
     * fromTeam의 팀원을 전부 toTeam으로 옮기고 fromTeam을 지운다. 옮겨 온 사람은 팀원이
     * 되고, 받는 팀의 팀장은 그대로다 — 합쳐진 팀에 팀장이 둘이 되면 결과물을 낼 사람이
     * 모호해진다. 신청 단계에서 정원을 확인하지만, 그 사이 양쪽 인원이 바뀔 수 있어 한 번 더 본다.
     */
    @Transactional
    public TeamAdminResponse mergeTeams(Long fromTeamId, Long toTeamId, String note) {
        if (fromTeamId.equals(toTeamId)) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "같은 팀끼리는 합칠 수 없습니다.");
        }
        HackathonEvent event = eventService.getActiveEvent();
        Team from = teamRepository.findByIdWithMembers(fromTeamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));
        Team to = teamRepository.findByIdWithMembers(toTeamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));

        int merged = from.memberCount() + to.memberCount();
        if (merged > event.getMaxTeamSize()) {
            throw new HackathonException(ErrorCode.INVALID_TEAM_SIZE,
                    "합치면 %d명이 되어 최대 인원 %d명을 넘습니다."
                            .formatted(merged, event.getMaxTeamSize()));
        }

        String fromName = from.getName();
        String memo = note != null && !note.isBlank() ? note : "%s 팀과 합침".formatted(fromName);

        // 넘어온 팀이 내놓았던 제출물·평가·수상은 팀과 함께 사라진다
        // (신청 기간에 합치는 것이라 보통은 아무것도 없다)
        submissionRepository.findByTeamId(fromTeamId).ifPresent(submissionRepository::delete);
        evaluationRepository.deleteAll(evaluationRepository.findAllByTargetTeamId(fromTeamId));
        awardRepository.deleteByTeamId(fromTeamId);

        // 소속을 쿼리로 바꾼다. 컬렉션에서 빼면 orphanRemoval이 팀원을 지워 버린다.
        teamMemberRepository.moveAllToTeam(fromTeamId, toTeamId);

        // 위 쿼리가 영속성 컨텍스트를 비우므로 다시 읽어서 처리한다.
        // 사라질 팀을 가리키는 신청은 연결을 떼어 낸다 — 외래 키가 걸려 삭제가 막힌다.
        for (JoinRequest r : joinRequestRepository.findAllTouchingTeam(fromTeamId)) {
            if (r.isPending()) {
                boolean aimedHere = r.getToTeam() != null
                        && r.getToTeam().getId().equals(fromTeamId);
                if (aimedHere) {
                    r.reject("%s 팀이 사라져 반려".formatted(fromName));
                } else {
                    r.markMerged(memo);
                }
            }
            r.detachTeam(fromTeamId);
        }
        joinRequestRepository.flush();

        teamRepository.deleteById(fromTeamId);
        log.info("팀 합치기: {} -> {} ({}명)", fromName, to.getName(), merged);

        Team result = teamRepository.findByIdWithMembers(toTeamId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));
        return toAdminResponse(result, submissionRepository.findByTeamId(toTeamId).orElse(null));
    }

    /** 신청을 반려한다. 합치지 않고 목록에서만 내린다. */
    @Transactional
    public void rejectJoinRequest(Long requestId, String note) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND, "신청을 찾을 수 없습니다."));
        if (!request.isPending()) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "이미 처리된 신청입니다.");
        }
        request.reject(note);
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
        return UserResponse.from(user, authProperties.isSuperAdmin(user.getEmail()));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getStaff() {
        return java.util.stream.Stream.concat(
                        userRepository.findByRole(Role.ADMIN).stream(),
                        userRepository.findByRole(Role.PROFESSOR).stream())
                .map(u -> UserResponse.from(u, authProperties.isSuperAdmin(u.getEmail())))
                .toList();
    }
}
