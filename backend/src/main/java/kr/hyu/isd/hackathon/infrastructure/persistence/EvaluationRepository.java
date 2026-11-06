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

    /**
     * 이 팀을 대상으로 한 평가 전부.
     * 팀 삭제 시 함께 지우려고 쓴다. 벌크 삭제 대신 엔티티로 읽어야
     * 항목 점수(scores)까지 cascade로 정리된다.
     */
    List<Evaluation> findAllByTargetTeamId(Long targetTeamId);

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

    /** 코멘트가 달린 교수 평가 전부 (운영진 확인용). 팀·교수 이름까지 한 번에 읽는다. */
    @Query("""
            select e from Evaluation e
              join fetch e.targetTeam t
              join fetch e.evaluator u
             where t.event.id = :eventId
               and e.evaluatorType = kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType.PROFESSOR
               and e.comment is not null
             order by t.track, t.name, e.evaluatedAt
            """)
    List<Evaluation> findProfessorCommentsByEventId(@Param("eventId") Long eventId);

    /** 이 행사에 들어온 평가가 하나라도 있는가 (평가 항목을 갈아끼워도 되는지 판단할 때 쓴다) */
    @Query("select count(e) > 0 from Evaluation e where e.targetTeam.event.id = :eventId")
    boolean existsByEventId(@Param("eventId") Long eventId);

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
