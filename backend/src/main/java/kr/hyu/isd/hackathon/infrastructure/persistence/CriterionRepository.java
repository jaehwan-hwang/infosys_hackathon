package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.team.Track;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CriterionRepository extends JpaRepository<Criterion, Long> {

    List<Criterion> findByEventIdOrderByTrackAscDisplayOrderAsc(Long eventId);

    List<Criterion> findByEventIdAndTrackAndEvaluatorTypeOrderByDisplayOrderAsc(
            Long eventId, Track track, EvaluatorType evaluatorType);

    long countByEventId(Long eventId);
}
