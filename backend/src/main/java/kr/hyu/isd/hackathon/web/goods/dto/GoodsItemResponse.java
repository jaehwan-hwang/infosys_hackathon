package kr.hyu.isd.hackathon.web.goods.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;

/** 굿즈 한 품목. 가격은 수량에 따라 조정될 수 있는 예상값이다. */
public record GoodsItemResponse(
        GoodsItem item,
        String label,
        int price
) {

    public static GoodsItemResponse from(GoodsItem item) {
        return new GoodsItemResponse(item, item.getLabel(), item.getPrice());
    }
}
