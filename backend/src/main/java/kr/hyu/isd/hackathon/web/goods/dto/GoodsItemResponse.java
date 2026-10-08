package kr.hyu.isd.hackathon.web.goods.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.KeycapOption;

import java.util.Arrays;
import java.util.List;

/**
 * 굿즈 한 품목. 가격은 수량에 따라 조정될 수 있는 예상값이다.
 *
 * @param price   한 개 값. 고를 것이 더 있는 품목에서는 최저가다.
 * @param options 1구·3구처럼 값이 갈리는 구성. 없으면 빈 목록.
 *                값을 프론트에 또 적어 두지 않으려고 서버가 내려준다.
 * @param designCount 고를 수 있는 도안 수. 도안이 없는 품목은 0.
 */
public record GoodsItemResponse(
        GoodsItem item,
        String label,
        int price,
        List<OptionResponse> options,
        int designCount
) {

    /** 한 세트에 키캡이 몇 개 달리고 얼마인지 */
    public record OptionResponse(int slots, String label, int price) {
    }

    public static GoodsItemResponse from(GoodsItem item) {
        if (!item.hasOptions()) {
            return new GoodsItemResponse(item, item.getLabel(), item.getPrice(), List.of(), 0);
        }
        List<OptionResponse> options = Arrays.stream(KeycapOption.values())
                .map(o -> new OptionResponse(o.getSlots(), o.getLabel(), o.getPrice()))
                .toList();
        return new GoodsItemResponse(item, item.getLabel(), item.getPrice(),
                options, KeycapOption.DESIGN_COUNT);
    }
}
