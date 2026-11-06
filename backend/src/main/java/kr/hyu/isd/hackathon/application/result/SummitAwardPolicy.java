package kr.hyu.isd.hackathon.application.result;

import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.infrastructure.persistence.EvaluationRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Summit 시상은 교수 평가가 끝나야 한다.
 *
 * 시상 흐름:
 *   1일차 — 참가자 전원이 Spark를 투표하고 그날 Spark 시상
 *   2일차 — Sprint·Summit 참가자가 투표하고 그날 Sprint 시상
 *   일주일쯤 뒤 — 교수 평가가 끝나면 Summit 시상
 *
 * 교수님들은 당일에 평가를 다 마치지 못한다. 그래서 Summit 리더보드는 정해진 수(기본 3명)의
 * 교수가 Summit 팀을 모두 평가한 뒤에야 열린다. 운영진이 먼저 열 수 없고, 마지막 교수가
 * 평가를 내는 순간 저절로 열린다 — 교수님이 언제 마칠지 운영진이 지켜보고 있지 않아도 된다.
 */
@Slf4j
@Component
public class SummitAwardPolicy {

    private final EvaluationRepository evaluationRepository;
    private final TeamRepository teamRepository;
    private final int requiredProfessors;

    public SummitAwardPolicy(EvaluationRepository evaluationRepository,
                             TeamRepository teamRepository,
                             @Value("${app.results.summit-professors-required:3}") int requiredProfessors) {
        this.evaluationRepository = evaluationRepository;
        this.teamRepository = teamRepository;
        this.requiredProfessors = requiredProfessors;
    }

    /**
     * @param completed Summit 팀을 모두 평가한 교수 수
     * @param required  Summit을 열려면 필요한 교수 수
     */
    public record Progress(int completed, int required) {
        public boolean isReady() {
            return completed >= required;
        }
    }

    public Progress progress(HackathonEvent event) {
        long summitTeams = teamRepository.countByEventIdAndTrack(event.getId(), Track.SUMMIT);
        if (summitTeams == 0) return new Progress(0, requiredProfessors);
        int completed = (int) evaluationRepository
                .countTargetsPerEvaluator(event.getId(), Track.SUMMIT, EvaluatorType.PROFESSOR)
                .stream()
                .filter(row -> ((Number) row[1]).longValue() >= summitTeams)
                .count();
        return new Progress(completed, requiredProfessors);
    }

    /** 교수 평가가 다 모였으면 Summit 리더보드를 연다. 이미 열려 있으면 그대로 둔다. */
    public void publishIfReady(HackathonEvent event) {
        if (event.isResultsPublished(Track.SUMMIT)) return;
        Progress progress = progress(event);
        if (progress.isReady()) {
            event.setResultsPublished(Track.SUMMIT, true);
            log.info("교수 {}명 평가가 끝나 Summit 리더보드를 열었습니다.", progress.completed());
        }
    }
}
