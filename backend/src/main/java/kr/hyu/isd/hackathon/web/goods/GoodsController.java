package kr.hyu.isd.hackathon.web.goods;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.goods.GoodsService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsItemResponse;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsOrderRequest;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsOrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 학과 굿즈 사전 신청.
 *
 * 품목 목록은 공개, 신청은 해커톤 참가자만 할 수 있다.
 */
@RestController
@RequestMapping("/api/v1/goods")
@RequiredArgsConstructor
public class GoodsController {

    private final GoodsService goodsService;

    /** 품목과 예상 가격 */
    @GetMapping("/items")
    public ApiResponse<List<GoodsItemResponse>> getItems() {
        return ApiResponse.success(goodsService.getItems());
    }

    @GetMapping("/me")
    public ApiResponse<GoodsOrderResponse> getMyOrder(@CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(goodsService.getMyOrder(principal.userId()));
    }

    /** 신청 저장. 다시 내면 수량을 덮어쓴다. */
    @PutMapping("/me")
    public ApiResponse<GoodsOrderResponse> save(@CurrentUser AuthPrincipal principal,
                                                @Valid @RequestBody GoodsOrderRequest request) {
        return ApiResponse.successWithMsg(goodsService.save(principal.userId(), request),
                "굿즈 신청을 저장했습니다.");
    }
}
