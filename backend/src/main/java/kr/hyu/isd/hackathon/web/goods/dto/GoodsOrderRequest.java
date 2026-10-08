package kr.hyu.isd.hackathon.web.goods.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import kr.hyu.isd.hackathon.domain.goods.GoodsItem;

import java.util.Map;

/**
 * 굿즈 사전 신청.
 *
 * 품목마다 수량을 담는다. 체크를 풀었으면 0으로 보내거나 빼면 된다.
 * 키캡 키링은 수량이 세트 수이고, 세트 구성과 도안은 아래 두 칸으로 따로 받는다.
 *
 * @param keycapSlots   한 세트에 달리는 키캡 수(1 또는 3)
 * @param keycapDesigns 도안 번호(1~5)별 개수. 같은 도안을 여러 개 담을 수 있다.
 *                      합이 세트 수 × 구 수와 같아야 하며, 그 검사는 도메인이 한다.
 */
public record GoodsOrderRequest(
        Map<GoodsItem, @Min(0) @Max(20) Integer> quantities,
        @Min(1) @Max(3) Integer keycapSlots,
        Map<Integer, @Min(0) @Max(60) Integer> keycapDesigns
) {
}
