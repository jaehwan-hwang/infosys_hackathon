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
 *   2. 한 계정은 한 팀을 한 번만 평가한다. 이미 낸 평가는 고칠 수 없다.
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
     * 평가를 제출한다. 한 계정은 한 팀을 한 번만 평가할 수 있고, 낸 뒤에는 고칠 수 없다.
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

        // 한 번 낸 평가는 그대로 둔다. 다시 매기려면 운영진이 지워 줘야 한다.
        if (evaluationRepository.findByEvaluatorIdAndTargetTeamId(userId, targetTeam.getId()).isPresent()) {
            throw new HackathonException(ErrorCode.ALREADY_EVALUATED,
                    "이미 평가한 팀입니다. 평가는 팀당 한 번만 가능합니다.");
        }

        Evaluation evaluation = saveNewEvaluation(evaluator, targetTeam, evaluatorType);
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
     * 참가자: 팀에 소속돼 있어야 하고, 자기 팀만 아니면 트랙과 무관하게 평가할 수 있다.
     *         (발표를 본 사람이 투표한다는 것이 전제다)
     * 교수:   Summit 트랙만 평가한다.
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

        // 참가자여야 한다. 트랙은 가리지 않는다 — 다른 트랙 발표도 보고 투표할 수 있다.
        if (teamRepository.findByEventIdAndMemberUserId(event.getId(), evaluator.getId()).isEmpty()) {
            throw new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                    "참가 팀에 소속된 학생만 투표할 수 있습니다.");
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
     *
     * 참가자는 평가가 열린 모든 트랙의 팀을 받는다(자기 팀 제외). 교수는 Summit만 받는다.
     * 운영진이 트랙별로 평가를 여닫으므로, 아직 발표하지 않은 트랙은 저절로 빠진다.
     */
    @Transactional(readOnly = true)
    public List<EvaluationTargetResponse> getTargets(Long userId, EvaluatorType evaluatorType) {
        HackathonEvent event = eventService.getActiveEvent();

        List<Track> tracks;
        Long myTeamId = null;
        if (evaluatorType == EvaluatorType.PROFESSOR) {
            tracks = List.of(Track.SUMMIT);
        } else {
            Team myTeam = teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                    .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                            "참가 팀에 소속된 학생만 투표할 수 있습니다."));
            myTeamId = myTeam.getId();
            tracks = List.of(Track.values());
        }

        List<Track> openTracks = tracks.stream().filter(event::isVotingOpen).toList();
        if (openTracks.isEmpty()) {
            throw new HackathonException(ErrorCode.VOTING_CLOSED);
        }

        Set<Long> evaluatedTeamIds = evaluationRepository
                .findByEvaluatorIdAndEventId(userId, event.getId())
                .stream()
                .map(e -> e.getTargetTeam().getId())
                .collect(java.util.stream.Collectors.toSet());

        final Long excludeTeamId = myTeamId;
        return openTracks.stream()
                .flatMap(t -> teamRepository.findByEventIdAndTrackWithMembers(event.getId(), t).stream())
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
