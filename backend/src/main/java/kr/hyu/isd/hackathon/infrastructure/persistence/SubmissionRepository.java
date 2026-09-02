package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByTeamId(Long teamId);

    @Query("""
            select s from Submission s
              join fetch s.team t
             where t.event.id = :eventId
             order by t.id
            """)
    List<Submission> findAllByEventId(@Param("eventId") Long eventId);

    @Query("""
            select s from Submission s
              join fetch s.team t
             where t.event.id = :eventId and t.track = :track
             order by t.id
            """)
    List<Submission> findByEventIdAndTrack(@Param("eventId") Long eventId,
                                           @Param("track") Track track);

    @Query("select count(s) from Submission s where s.team.event.id = :eventId")
    long countByEventId(@Param("eventId") Long eventId);
}
