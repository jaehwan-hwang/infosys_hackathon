package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.match.JoinRequest;
import kr.hyu.isd.hackathon.domain.match.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    /** 운영진 화면용. 대기 중인 것이 위로 오도록 정렬한다. */
    @Query("""
            select r from JoinRequest r
              left join fetch r.fromTeam f
              left join fetch r.toTeam t
             where r.event.id = :eventId
             order by case when r.status = kr.hyu.isd.hackathon.domain.match.JoinRequestStatus.PENDING
                           then 0 else 1 end, r.id desc
            """)
    List<JoinRequest> findAllByEventId(@Param("eventId") Long eventId);

    /** 내가 보낸 신청 */
    @Query("""
            select r from JoinRequest r
              left join fetch r.toTeam t
             where r.event.id = :eventId and r.fromTeam.id = :teamId
             order by r.id desc
            """)
    List<JoinRequest> findByEventIdAndFromTeamId(@Param("eventId") Long eventId,
                                                 @Param("teamId") Long teamId);

    /** 우리 팀으로 들어온 신청 */
    @Query("""
            select r from JoinRequest r
              left join fetch r.fromTeam f
             where r.event.id = :eventId and r.toTeam.id = :teamId
             order by r.id desc
            """)
    List<JoinRequest> findByEventIdAndToTeamId(@Param("eventId") Long eventId,
                                               @Param("teamId") Long teamId);

    boolean existsByFromTeamIdAndToTeamIdAndStatus(Long fromTeamId, Long toTeamId,
                                                   JoinRequestStatus status);

    boolean existsByFromTeamIdAndToTeamIsNullAndStatus(Long fromTeamId, JoinRequestStatus status);

    /** 팀이 지워질 때 관련 신청도 함께 정리한다 */
    @Query("select r from JoinRequest r where r.fromTeam.id = :teamId or r.toTeam.id = :teamId")
    List<JoinRequest> findAllTouchingTeam(@Param("teamId") Long teamId);
}
