package kr.hyu.isd.hackathon.web.goods.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.GoodsOrder;

import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;

/**
 * 내 굿즈 신청 현황.
 *
 * @param estimatedTotal 예상 금액. 가격이 확정되기 전의 어림값이라 그대로 청구되지 않는다.
 */
public record GoodsOrderResponse(
        Map<GoodsItem, Integer> quantities,
        int estimatedTotal,
        Instant updatedAt
) {

    public static GoodsOrderResponse from(GoodsOrder order) {
        Map<GoodsItem, Integer> quantities = new EnumMap<>(GoodsItem.class);
        for (GoodsItem item : GoodsItem.values()) {
            quantities.put(item, order.quantityOf(item));
        }
        return new GoodsOrderResponse(quantities, order.estimatedTotal(), order.getUpdatedAt());
    }

    /** 아직 신청하지 않은 상태 */
    public static GoodsOrderResponse empty() {
        Map<GoodsItem, Integer> quantities = new EnumMap<>(GoodsItem.class);
        for (GoodsItem item : GoodsItem.values()) {
            quantities.put(item, 0);
        }
        return new GoodsOrderResponse(quantities, 0, null);
    }
}
