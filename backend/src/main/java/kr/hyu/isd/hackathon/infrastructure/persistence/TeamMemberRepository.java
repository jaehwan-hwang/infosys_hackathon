package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.team.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    /**
     * 팀원을 통째로 다른 팀으로 옮긴다 (팀 합치기).
     *
     * 컬렉션에서 빼고 넣는 방식으로는 할 수 없다 — Team.members가 orphanRemoval이라
     * 목록에서 빼는 순간 팀원이 삭제 대상이 되기 때문이다. 쿼리로 소속만 바꾼다.
     * 옮겨 온 사람은 모두 팀원이 된다. 받는 팀의 팀장은 그대로다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update TeamMember m
               set m.team = (select t from Team t where t.id = :toTeamId),
                   m.role = kr.hyu.isd.hackathon.domain.team.TeamMemberRole.MEMBER
             where m.team.id = :fromTeamId
            """)
    int moveAllToTeam(@Param("fromTeamId") Long fromTeamId, @Param("toTeamId") Long toTeamId);
}
