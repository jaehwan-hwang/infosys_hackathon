package kr.hyu.isd.hackathon.web.goods.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.GoodsOrder;
import kr.hyu.isd.hackathon.domain.goods.KeycapOption;

import java.time.Instant;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

/**
 * 내 굿즈 신청 현황.
 *
 * @param estimatedTotal 예상 금액. 가격이 확정되기 전의 어림값이라 그대로 청구되지 않는다.
 * @param keycapSlots    키캡 한 세트의 구 수(1 또는 3). 신청하지 않았으면 null.
 * @param keycapDesigns  도안 번호별 개수
 */
public record GoodsOrderResponse(
        Map<GoodsItem, Integer> quantities,
        Integer keycapSlots,
        Map<Integer, Integer> keycapDesigns,
        int estimatedTotal,
        Instant updatedAt
) {

    public static GoodsOrderResponse from(GoodsOrder order) {
        Map<GoodsItem, Integer> quantities = new EnumMap<>(GoodsItem.class);
        for (GoodsItem item : GoodsItem.values()) {
            quantities.put(item, order.quantityOf(item));
        }
        KeycapOption option = order.keycapOption();
        return new GoodsOrderResponse(
                quantities,
                option == null ? null : option.getSlots(),
                new HashMap<>(order.getKeycapDesigns()),
                order.estimatedTotal(),
                order.getUpdatedAt());
    }

    /** 아직 신청하지 않은 상태 */
    public static GoodsOrderResponse empty() {
        Map<GoodsItem, Integer> quantities = new EnumMap<>(GoodsItem.class);
        for (GoodsItem item : GoodsItem.values()) {
            quantities.put(item, 0);
        }
        return new GoodsOrderResponse(quantities, null, Map.of(), 0, null);
    }
}
