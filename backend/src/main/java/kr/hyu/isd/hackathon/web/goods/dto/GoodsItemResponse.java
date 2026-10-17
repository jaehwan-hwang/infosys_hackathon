package kr.hyu.isd.hackathon.web.goods.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.KeycapDesign;
import kr.hyu.isd.hackathon.domain.goods.KeycapOption;

import java.util.Arrays;
import java.util.List;

/**
 * 굿즈 한 품목. 가격은 수량에 따라 조정될 수 있는 예상값이다.
 *
 * @param price   한 개 값. 고를 것이 더 있는 품목에서는 최저가다.
 * @param options 1구·3구처럼 값이 갈리는 구성. 없으면 빈 목록.
 *                값을 프론트에 또 적어 두지 않으려고 서버가 내려준다.
 * @param designs 고를 수 있는 도안. 도안이 없는 품목은 빈 목록. 이 순서대로 보여 준다.
 */
public record GoodsItemResponse(
        GoodsItem item,
        String label,
        int price,
        List<OptionResponse> options,
        List<DesignResponse> designs
) {

    /** 한 세트에 키캡이 몇 개 달리고 얼마인지 */
    public record OptionResponse(int slots, String label, int price) {
    }

    /**
     * @param no    저장에 쓰는 번호. 신청할 때 이 번호로 보낸다.
     * @param image public/goods/ 아래 사진 파일 이름
     */
    public record DesignResponse(int no, String name, String image) {
    }

    public static GoodsItemResponse from(GoodsItem item) {
        if (!item.hasOptions()) {
            return new GoodsItemResponse(item, item.getLabel(), item.getPrice(), List.of(), List.of());
        }
        List<OptionResponse> options = Arrays.stream(KeycapOption.values())
                .map(o -> new OptionResponse(o.getSlots(), o.getLabel(), o.getPrice()))
                .toList();
        List<DesignResponse> designs = Arrays.stream(KeycapDesign.values())
                .map(d -> new DesignResponse(d.getNo(), d.getLabel(), d.getImage()))
                .toList();
        return new GoodsItemResponse(item, item.getLabel(), item.getPrice(), options, designs);
    }
}
