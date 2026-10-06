package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.goods.GoodsOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GoodsOrderRepository extends JpaRepository<GoodsOrder, Long> {

    @Query("""
            select o from GoodsOrder o
              left join fetch o.quantities
             where o.event.id = :eventId and o.user.id = :userId
            """)
    Optional<GoodsOrder> findByEventIdAndUserId(@Param("eventId") Long eventId,
                                                @Param("userId") Long userId);

    /** 운영진 집계·내보내기용 */
    @Query("""
            select distinct o from GoodsOrder o
              join fetch o.user u
              left join fetch o.quantities
             where o.event.id = :eventId
             order by o.id
            """)
    List<GoodsOrder> findAllByEventId(@Param("eventId") Long eventId);
}
