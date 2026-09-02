package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.evaluation.Award;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AwardRepository extends JpaRepository<Award, Long> {

    @Query("""
            select a from Award a
              join fetch a.team t
             where t.event.id = :eventId
             order by t.track, a.awardRank
            """)
    List<Award> findAllByEventId(@Param("eventId") Long eventId);

    void deleteByTeamId(Long teamId);
}
