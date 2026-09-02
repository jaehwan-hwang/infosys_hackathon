package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    boolean existsByEventIdAndName(Long eventId, String name);

    @Query("""
            select distinct t from Team t
              left join fetch t.members m
             where t.event.id = :eventId
             order by t.id
            """)
    List<Team> findAllByEventIdWithMembers(@Param("eventId") Long eventId);

    @Query("""
            select distinct t from Team t
              left join fetch t.members m
             where t.event.id = :eventId and t.track = :track
             order by t.id
            """)
    List<Team> findByEventIdAndTrackWithMembers(@Param("eventId") Long eventId,
                                                @Param("track") Track track);

    @Query("""
            select distinct t from Team t
              left join fetch t.members m
             where t.id = :teamId
            """)
    Optional<Team> findByIdWithMembers(@Param("teamId") Long teamId);

    /** 이 사용자가 소속된 팀. 계정이 연결된 팀원 기준으로 찾는다. */
    @Query("""
            select distinct t from Team t
              join t.members m
             where t.event.id = :eventId and m.user.id = :userId
            """)
    Optional<Team> findByEventIdAndMemberUserId(@Param("eventId") Long eventId,
                                                @Param("userId") Long userId);

    /** 아직 계정이 연결되지 않은 팀원 자리를 이메일로 찾는다 (최초 로그인 시 연결용) */
    @Query("""
            select distinct t from Team t
              join t.members m
             where t.event.id = :eventId and lower(m.email) = lower(:email)
            """)
    Optional<Team> findByEventIdAndMemberEmail(@Param("eventId") Long eventId,
                                               @Param("email") String email);

    long countByEventId(Long eventId);

    long countByEventIdAndTrack(Long eventId, Track track);
}
