package kr.hyu.isd.hackathon.common.config;

import jakarta.persistence.EntityManager;
import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Arrays;
import java.util.List;

/**
 * 품목 목록에서 빠진 굿즈의 신청 행을 지운다.
 *
 * 품목은 DB에 이름 문자열로 들어간다. 코드에서 값을 빼면 그 이름이 적힌 행은 더 이상
 * 되살릴 수 없어, 읽는 순간 "No enum constant"로 터진다. 한 사람의 신청만 깨지는 게
 * 아니라 운영진의 집계·내보내기까지 같이 멈춘다.
 *
 * 그래서 기동할 때마다 한 번 훑고 지운다. 지울 게 없으면 아무 일도 하지 않으므로
 * 재배포해도 안전하다. 품목을 뺀 순간 그 신청은 없던 것이 되는 게 맞다 —
 * 팔지 않는 물건의 수량을 남겨 두면 집계에 유령 수요가 잡힌다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class RetiredGoodsCleanup {

    private final EntityManager entityManager;

    /**
     * 트랜잭션을 직접 연다. @Transactional을 붙인 메서드를 같은 클래스 안에서 부르면
     * 프록시를 타지 않아 쓰기가 거부된다 — 기동이 그대로 멈춘다.
     */
    private final TransactionTemplate transactionTemplate;

    @Bean
    public ApplicationRunner cleanUpRetiredGoods() {
        return args -> cleanUp();
    }

    private void cleanUp() {
        List<String> alive = Arrays.stream(GoodsItem.values()).map(Enum::name).toList();

        Integer removed = transactionTemplate.execute(status -> entityManager
                .createNativeQuery("delete from tb_goods_order_item where item not in (:alive)")
                .setParameter("alive", alive)
                .executeUpdate());

        if (removed != null && removed > 0) {
            log.warn("판매하지 않는 굿즈 신청 {}건을 지웠습니다. 남은 품목={}", removed, alive);
        }
    }
}
