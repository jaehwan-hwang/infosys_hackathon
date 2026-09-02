package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.team.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    Optional<Evaluation> findByEvaluatorIdAndTargetTeamId(Long evaluatorId, Long targetTeamId);

    @Query("""
            select e from Evaluation e
              join fetch e.targetTeam t
             where e.evaluator.id = :evaluatorId and t.event.id = :eventId
            """)
    List<Evaluation> findByEvaluatorIdAndEventId(@Param("evaluatorId") Long evaluatorId,
                                                 @Param("eventId") Long eventId);

    /**
     * 팀별·평가자유형별 평균 총점과 평가자 수.
     * 학생 투표 평균과 교수 평가 평균을 따로 뽑아 Summit 가중 합산에 쓴다.
     */
    @Query("""
            select e.targetTeam.id, e.evaluatorType, avg(e.totalScore), count(e)
              from Evaluation e
             where e.targetTeam.event.id = :eventId
             group by e.targetTeam.id, e.evaluatorType
            """)
    List<Object[]> aggregateByEventId(@Param("eventId") Long eventId);

    @Query("""
            select count(e) from Evaluation e
             where e.targetTeam.event.id = :eventId
               and e.targetTeam.track = :track
               and e.evaluatorType = :evaluatorType
            """)
    long countByEventIdAndTrackAndEvaluatorType(@Param("eventId") Long eventId,
                                                @Param("track") Track track,
                                                @Param("evaluatorType") EvaluatorType evaluatorType);

    @Query("""
            select distinct e from Evaluation e
              left join fetch e.scores s
             where e.id = :evaluationId
            """)
    Optional<Evaluation> findByIdWithScores(@Param("evaluationId") Long evaluationId);
}
