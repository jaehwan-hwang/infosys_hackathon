package kr.hyu.isd.hackathon.application.evaluation;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluationScore;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.*;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationRequest;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationResponse;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationTargetResponse;
import kr.hyu.isd.hackathon.web.evaluation.dto.ScoreEntry;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * 학생 투표와 교수 평가.
 *
 * 부정 투표를 막는 세 겹의 방어선:
 *   1. (평가자, 대상팀) 유니크 제약으로 DB가 중복 행을 거부한다.
 *   2. 같은 평가자가 다시 제출하면 새 행을 만들지 않고 기존 평가를 덮어쓴다.
 *   3. 자기 팀 투표는 Team.hasMember()로 걸러낸다.
 *
 * 점수는 제출 순간에 가중 환산되어 저장되므로, 집계는 단순 평균으로 끝난다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final CriterionRepository criterionRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final EventService eventService;

    /**
     * 평가를 제출한다. 이미 같은 팀을 평가했다면 덮어쓴다.
     *
     * @param evaluatorType 학생 투표인지 교수 평가인지. 컨트롤러가 경로에 따라 정한다.
     */
    @Transactional
    public EvaluationResponse evaluate(Long userId, EvaluationRequest request, EvaluatorType evaluatorType) {
        HackathonEvent event = eventService.getActiveEvent();
        User evaluator = userRepository.findById(userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND));

        Team targetTeam = teamRepository.findByIdWithMembers(request.targetTeamId())
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));
        Track track = targetTeam.getTrack();

        if (!event.isVotingOpen(track)) {
            throw new HackathonException(ErrorCode.VOTING_CLOSED,
                    "%s 트랙 평가가 아직 열리지 않았습니다.".formatted(track.name()));
        }

        validateEvaluatorEligibility(evaluator, targetTeam, evaluatorType, event);

        List<Criterion> criteria = criterionRepository
                .findByEventIdAndTrackAndEvaluatorTypeOrderByDisplayOrderAsc(
                        event.getId(), track, evaluatorType);
        if (criteria.isEmpty()) {
            throw new HackathonException(ErrorCode.CRITERION_NOT_FOUND,
                    "이 트랙에 설정된 평가 항목이 없습니다.");
        }

        Evaluation evaluation = evaluationRepository
                .findByEvaluatorIdAndTargetTeamId(userId, targetTeam.getId())
                .orElseGet(() -> saveNewEvaluation(evaluator, targetTeam, evaluatorType));

        evaluation.replaceScores(buildScores(evaluation, criteria, request.scores()), request.comment());

        log.info("평가 제출: evaluator={}, team={}, type={}, total={}",
                evaluator.getEmail(), targetTeam.getName(), evaluatorType, evaluation.getTotalScore());

        return EvaluationResponse.from(evaluation);
    }

    /**
     * 새 평가 행을 만든다.
     *
     * 유니크 제약 위반은 같은 사용자가 동시에 두 번 제출한 경우이므로,
     * 경합에서 진 쪽은 이미 저장된 평가를 다시 읽어 이어간다.
     */
    private Evaluation saveNewEvaluation(User evaluator, Team targetTeam, EvaluatorType evaluatorType) {
        try {
            return evaluationRepository.saveAndFlush(
                    Evaluation.create(evaluator, targetTeam, evaluatorType));
        } catch (DataIntegrityViolationException e) {
            return evaluationRepository
                    .findByEvaluatorIdAndTargetTeamId(evaluator.getId(), targetTeam.getId())
                    .orElseThrow(() -> new HackathonException(ErrorCode.ALREADY_EVALUATED));
        }
    }

    /**
     * 이 평가자가 이 팀을 평가할 자격이 있는지 검사한다.
     *
     * 학생: 참가자 본인이어야 하고, 자기 팀은 평가할 수 없으며, 같은 트랙만 평가한다.
     * 교수: Summit 트랙만 평가한다.
     */
    private void validateEvaluatorEligibility(User evaluator, Team targetTeam,
                                              EvaluatorType evaluatorType, HackathonEvent event) {
        if (evaluatorType == EvaluatorType.PROFESSOR) {
            if (targetTeam.getTrack() != Track.SUMMIT) {
                throw new HackathonException(ErrorCode.TRACK_MISMATCH,
                        "교수 평가는 Summit 트랙만 대상으로 합니다.");
            }
            return;
        }

        // 자기 팀 투표 차단
        if (targetTeam.hasMember(evaluator.getId())) {
            throw new HackathonException(ErrorCode.SELF_VOTE_FORBIDDEN);
        }

        // 학생 투표는 자기가 속한 트랙 안에서만 이뤄진다.
        Team myTeam = teamRepository
                .findByEventIdAndMemberUserId(event.getId(), evaluator.getId())
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                        "참가 팀에 소속된 학생만 투표할 수 있습니다."));

        if (myTeam.getTrack() != targetTeam.getTrack()) {
            throw new HackathonException(ErrorCode.TRACK_MISMATCH,
                    "본인이 참가한 트랙의 팀만 평가할 수 있습니다.");
        }
    }

    /**
     * 요청 점수를 항목과 짝지어 도메인 객체로 만든다.
     * 항목 누락·초과, 만점 범위 이탈을 여기서 모두 거른다.
     */
    private List<EvaluationScore> buildScores(Evaluation evaluation, List<Criterion> criteria,
                                              List<ScoreEntry> entries) {
        Map<Long, Criterion> criterionById = new HashMap<>();
        criteria.forEach(c -> criterionById.put(c.getId(), c));

        Set<Long> submitted = new HashSet<>();
        List<EvaluationScore> scores = new ArrayList<>();

        for (ScoreEntry entry : entries) {
            Criterion criterion = criterionById.get(entry.criterionId());
            if (criterion == null) {
                throw new HackathonException(ErrorCode.CRITERIA_MISMATCH,
                        "이 트랙의 평가 항목이 아닙니다: " + entry.criterionId());
            }
            if (!submitted.add(entry.criterionId())) {
                throw new HackathonException(ErrorCode.CRITERIA_MISMATCH,
                        "같은 항목에 점수가 두 번 들어왔습니다: " + criterion.getName());
            }
            if (entry.score() < 0 || entry.score() > criterion.getMaxScore()) {
                throw new HackathonException(ErrorCode.INVALID_SCORE,
                        "%s 항목은 0~%d점입니다.".formatted(criterion.getName(), criterion.getMaxScore()));
            }
            scores.add(EvaluationScore.create(evaluation, criterion, entry.score()));
        }

        // 일부 항목만 채운 평가는 총점이 왜곡되므로 받지 않는다.
        if (submitted.size() != criteria.size()) {
            throw new HackathonException(ErrorCode.CRITERIA_MISMATCH,
                    "모든 평가 항목(%d개)에 점수를 입력해야 합니다.".formatted(criteria.size()));
        }

        return scores;
    }

    /**
     * 평가 화면에 뿌릴 대상 목록.
     * 학생은 자기 트랙의 다른 팀들만, 교수는 Summit 전체를 받는다.
     */
    @Transactional(readOnly = true)
    public List<EvaluationTargetResponse> getTargets(Long userId, EvaluatorType evaluatorType) {
        HackathonEvent event = eventService.getActiveEvent();

        Track track;
        Long myTeamId = null;
        if (evaluatorType == EvaluatorType.PROFESSOR) {
            track = Track.SUMMIT;
        } else {
            Team myTeam = teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                    .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                            "참가 팀에 소속된 학생만 투표할 수 있습니다."));
            track = myTeam.getTrack();
            myTeamId = myTeam.getId();
        }

        if (!event.isVotingOpen(track)) {
            throw new HackathonException(ErrorCode.VOTING_CLOSED);
        }

        Set<Long> evaluatedTeamIds = evaluationRepository
                .findByEvaluatorIdAndEventId(userId, event.getId())
                .stream()
                .map(e -> e.getTargetTeam().getId())
                .collect(java.util.stream.Collectors.toSet());

        final Long excludeTeamId = myTeamId;
        return teamRepository.findByEventIdAndTrackWithMembers(event.getId(), track).stream()
                // 자기 팀은 애초에 목록에서 뺀다
                .filter(t -> excludeTeamId == null || !t.getId().equals(excludeTeamId))
                .map(t -> toTarget(t, evaluatedTeamIds.contains(t.getId())))
                .toList();
    }

    private EvaluationTargetResponse toTarget(Team team, boolean evaluated) {
        Optional<Submission> submission = submissionRepository.findByTeamId(team.getId());
        return new EvaluationTargetResponse(
                team.getId(),
                team.getName(),
                team.getTopic(),
                team.getTrack(),
                submission.map(Submission::getProjectName).orElse(null),
                submission.map(Submission::getSummary).orElse(null),
                submission.map(Submission::getDeployUrl).orElse(null),
                submission.map(Submission::getDemoUrl).orElse(null),
                evaluated
        );
    }

    /** 내가 제출한 평가 목록. 평가 화면 복원에 쓴다. */
    @Transactional(readOnly = true)
    public List<EvaluationResponse> getMyEvaluations(Long userId) {
        HackathonEvent event = eventService.getActiveEvent();
        return evaluationRepository.findByEvaluatorIdAndEventId(userId, event.getId()).stream()
                .map(e -> evaluationRepository.findByIdWithScores(e.getId()).orElse(e))
                .map(EvaluationResponse::from)
                .toList();
    }

    /** 평가 화면에서 쓸 트랙·평가자유형별 항목 목록 */
    @Transactional(readOnly = true)
    public List<CriterionResponse> getCriteria(Track track, EvaluatorType evaluatorType) {
        HackathonEvent event = eventService.getActiveEvent();
        return criterionRepository
                .findByEventIdAndTrackAndEvaluatorTypeOrderByDisplayOrderAsc(
                        event.getId(), track, evaluatorType)
                .stream()
                .map(CriterionResponse::from)
                .toList();
    }
}
