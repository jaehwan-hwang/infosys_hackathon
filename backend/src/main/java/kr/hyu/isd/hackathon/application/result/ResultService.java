package kr.hyu.isd.hackathon.application.result;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.domain.evaluation.Award;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.infrastructure.persistence.AwardRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.EvaluationRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.SubmissionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.web.result.dto.PublicTeamResultResponse;
import kr.hyu.isd.hackathon.web.result.dto.PublicTrackResultResponse;
import kr.hyu.isd.hackathon.web.result.dto.TeamResultResponse;
import kr.hyu.isd.hackathon.web.result.dto.TrackResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 트랙별 순위 집계.
 *
 * 기획서 6장의 산식을 그대로 구현한다.
 *   Spark  : 학생 투표 100%
 *   Sprint : 학생 투표 100%
 *   Summit : 교수 평가 40% + 학생 투표 60%
 *
 * 점수는 평가 제출 시점에 이미 100점 만점으로 가중 환산되어 저장되므로,
 * 여기서는 평가자별 평균을 내고 트랙 가중치만 적용하면 된다.
 *
 * 참가자가 보는 리더보드는 트랙마다 따로 열리고(Spark는 1일차, Sprint·Summit은 2일차),
 * 열린 트랙도 시상 등수까지만 내려간다. 운영진 조회는 언제든 가능하다.
 */
@Service
@RequiredArgsConstructor
public class ResultService {

    private final EvaluationRepository evaluationRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final AwardRepository awardRepository;
    private final EventService eventService;

    /** Summit 트랙의 교수 평가 가중치 */
    private static final BigDecimal PROFESSOR_WEIGHT = new BigDecimal("0.4");

    /** Summit 트랙의 학생 투표 가중치 */
    private static final BigDecimal STUDENT_WEIGHT = new BigDecimal("0.6");

    private static final int SCALE = 2;

    /**
     * 참가자가 보는 리더보드.
     *
     * 트랙 세 칸을 항상 내려주되, 공개하지 않은 트랙은 빈 칸으로 보낸다. 공개한 트랙도
     * 시상 등수까지만 보낸다 — 4등 이하는 자기 순위도 점수도 알 수 없다.
     */
    @Transactional(readOnly = true)
    public List<PublicTrackResultResponse> getPublishedResults() {
        HackathonEvent event = eventService.getActiveEvent();
        return List.of(Track.values()).stream()
                .map(track -> event.isResultsPublished(track)
                        ? toPublic(track, aggregate(event, track))
                        : PublicTrackResultResponse.hidden(track))
                .toList();
    }

    /**
     * 집계 결과를 공개용으로 바꾼다.
     *
     * 등수는 전부 보여주되 점수는 수상 팀 것만 넘긴다. 수상 밖 팀의 점수까지 내려보내면
     * 화면에서 가려도 응답을 열어 보면 그만이다.
     */
    private PublicTrackResultResponse toPublic(Track track, TrackResultResponse full) {
        List<PublicTeamResultResponse> teams = full.results().stream()
                .map(r -> {
                    // 동점으로 공동 수상이 나오면 그 등수까지는 모두 수상으로 본다
                    boolean awarded = r.rank() <= track.getAwardCount();
                    return new PublicTeamResultResponse(
                            r.rank(), r.teamId(), r.teamName(),
                            awarded ? r.projectName() : null,
                            r.awardName(),
                            awarded,
                            awarded ? r.finalScore() : null,
                            awarded ? r.studentAverage() : null,
                            // 교수 평가가 없는 트랙에서 0.00을 보여주면 0점을 받은 것처럼 읽힌다
                            awarded && track == Track.SUMMIT ? r.professorAverage() : null);
                })
                .toList();
        return new PublicTrackResultResponse(
                track, true, track.getAwardCount(), full.formula(), teams);
    }

    /**
     * 운영진용 집계. 공개 여부와 무관하게 언제든 볼 수 있다.
     */
    @Transactional(readOnly = true)
    public List<TrackResultResponse> getResultsForAdmin() {
        return aggregateAll(eventService.getActiveEvent());
    }

    @Transactional(readOnly = true)
    public TrackResultResponse getTrackResultForAdmin(Track track) {
        return aggregate(eventService.getActiveEvent(), track);
    }

    private List<TrackResultResponse> aggregateAll(HackathonEvent event) {
        return List.of(
                aggregate(event, Track.SPARK),
                aggregate(event, Track.SPRINT),
                aggregate(event, Track.SUMMIT)
        );
    }

    /**
     * 한 트랙의 순위표를 만든다.
     */
    private TrackResultResponse aggregate(HackathonEvent event, Track track) {
        List<Team> teams = teamRepository.findByEventIdAndTrackWithMembers(event.getId(), track);

        Map<Long, Aggregate> aggregates = loadAggregates(event.getId());
        Map<Long, String> projectNames = loadProjectNames(event.getId());
        Map<Long, String> awardNames = loadAwardNames(event.getId());

        List<TeamResultResponse> results = teams.stream()
                .map(team -> {
                    Aggregate agg = aggregates.getOrDefault(team.getId(), Aggregate.empty());
                    BigDecimal finalScore = computeFinalScore(track, agg);
                    return new TeamResultResponse(
                            0, // 정렬 후 채운다
                            team.getId(),
                            team.getName(),
                            track,
                            projectNames.get(team.getId()),
                            agg.studentAverage(),
                            agg.studentCount(),
                            agg.professorAverage(),
                            agg.professorCount(),
                            finalScore,
                            awardNames.get(team.getId())
                    );
                })
                // 점수 내림차순. 동점이면 팀명 오름차순으로 안정적인 순서를 만든다.
                .sorted(Comparator.comparing(TeamResultResponse::finalScore).reversed()
                        .thenComparing(TeamResultResponse::teamName))
                .toList();

        return new TrackResultResponse(track, formulaOf(track), results.size(), assignRanks(results));
    }

    /**
     * 순위를 매긴다. 동점 팀은 같은 순위를 받고, 그 다음 순위는 건너뛴다(1,2,2,4).
     */
    private List<TeamResultResponse> assignRanks(List<TeamResultResponse> sorted) {
        List<TeamResultResponse> ranked = new java.util.ArrayList<>(sorted.size());
        BigDecimal previousScore = null;
        int previousRank = 0;

        for (int i = 0; i < sorted.size(); i++) {
            TeamResultResponse r = sorted.get(i);
            int rank = (previousScore != null && previousScore.compareTo(r.finalScore()) == 0)
                    ? previousRank
                    : i + 1;
            previousScore = r.finalScore();
            previousRank = rank;

            ranked.add(new TeamResultResponse(
                    rank, r.teamId(), r.teamName(), r.track(), r.projectName(),
                    r.studentAverage(), r.studentVoterCount(),
                    r.professorAverage(), r.professorVoterCount(),
                    r.finalScore(), r.awardName()));
        }
        return ranked;
    }

    /**
     * 트랙별 최종 점수.
     *
     * Summit에서 교수 평가가 아직 하나도 없으면 학생 투표만으로 40:60을 적용할 수 없다.
     * 이 경우 학생 평균을 그대로 쓰는 대신 교수 몫을 0으로 두면 점수가 60%로 눌려
     * 순위가 뒤집히므로, 존재하는 평가만으로 가중치를 재정규화한다.
     */
    private BigDecimal computeFinalScore(Track track, Aggregate agg) {
        if (track != Track.SUMMIT) {
            return agg.studentAverage();
        }

        boolean hasProfessor = agg.professorCount() > 0;
        boolean hasStudent = agg.studentCount() > 0;

        if (hasProfessor && hasStudent) {
            return agg.professorAverage().multiply(PROFESSOR_WEIGHT)
                    .add(agg.studentAverage().multiply(STUDENT_WEIGHT))
                    .setScale(SCALE, RoundingMode.HALF_UP);
        }
        if (hasProfessor) return agg.professorAverage();
        if (hasStudent) return agg.studentAverage();
        return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private String formulaOf(Track track) {
        return track == Track.SUMMIT
                ? "교수 평가 평균 × 0.4 + 참가자 투표 평균 × 0.6"
                : "참가자 투표 평균 × 1.0";
    }

    /** 팀별 학생/교수 평균과 평가자 수를 한 번에 읽어 온다. */
    private Map<Long, Aggregate> loadAggregates(Long eventId) {
        Map<Long, Aggregate> map = new HashMap<>();

        for (Object[] row : evaluationRepository.aggregateByEventId(eventId)) {
            Long teamId = (Long) row[0];
            EvaluatorType type = (EvaluatorType) row[1];
            BigDecimal average = toScaledDecimal(row[2]);
            int count = ((Number) row[3]).intValue();

            Aggregate current = map.getOrDefault(teamId, Aggregate.empty());
            map.put(teamId, type == EvaluatorType.PROFESSOR
                    ? current.withProfessor(average, count)
                    : current.withStudent(average, count));
        }
        return map;
    }

    private Map<Long, String> loadProjectNames(Long eventId) {
        Map<Long, String> map = new HashMap<>();
        for (Submission s : submissionRepository.findAllByEventId(eventId)) {
            map.put(s.getTeam().getId(), s.getProjectName());
        }
        return map;
    }

    private Map<Long, String> loadAwardNames(Long eventId) {
        Map<Long, String> map = new HashMap<>();
        for (Award a : awardRepository.findAllByEventId(eventId)) {
            map.put(a.getTeam().getId(), a.getAwardName());
        }
        return map;
    }

    private static BigDecimal toScaledDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        return new BigDecimal(value.toString()).setScale(SCALE, RoundingMode.HALF_UP);
    }

    /**
     * 팀 하나의 평가 집계 중간값.
     */
    private record Aggregate(
            BigDecimal studentAverage, int studentCount,
            BigDecimal professorAverage, int professorCount
    ) {
        static Aggregate empty() {
            BigDecimal zero = BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
            return new Aggregate(zero, 0, zero, 0);
        }

        Aggregate withStudent(BigDecimal average, int count) {
            return new Aggregate(average, count, professorAverage, professorCount);
        }

        Aggregate withProfessor(BigDecimal average, int count) {
            return new Aggregate(studentAverage, studentCount, average, count);
        }
    }
}
