package kr.hyu.isd.hackathon.web.goods.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import kr.hyu.isd.hackathon.domain.goods.GoodsItem;

import java.util.Map;

/**
 * 굿즈 사전 신청.
 *
 * 품목마다 수량을 담는다. 체크를 풀었으면 0으로 보내거나 빼면 된다.
 */
public record GoodsOrderRequest(
        Map<GoodsItem, @Min(0) @Max(20) Integer> quantities
) {
}
