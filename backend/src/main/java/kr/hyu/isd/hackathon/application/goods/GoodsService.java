package kr.hyu.isd.hackathon.application.goods;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.GoodsOrder;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.GoodsOrderRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.UserRepository;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsItemResponse;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsOrderRequest;
import kr.hyu.isd.hackathon.web.goods.dto.GoodsOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * 학과 굿즈 사전 신청.
 *
 * 해커톤 신청자만 낼 수 있다. 돈은 여기서 받지 않고 수량만 모은다 — 가격이 수량에
 * 따라 조정되기 때문에, 확정 금액과 입금은 신청 마감 뒤 단톡방에서 안내한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoodsService {

    private final GoodsOrderRepository goodsOrderRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventService eventService;

    /** 품목과 예상 가격. 로그인 없이도 볼 수 있다. */
    @Transactional(readOnly = true)
    public List<GoodsItemResponse> getItems() {
        return Arrays.stream(GoodsItem.values()).map(GoodsItemResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public GoodsOrderResponse getMyOrder(Long userId) {
        HackathonEvent event = eventService.getActiveEvent();
        return goodsOrderRepository.findByEventIdAndUserId(event.getId(), userId)
                .map(GoodsOrderResponse::from)
                .orElseGet(GoodsOrderResponse::empty);
    }

    /**
     * 신청을 저장한다. 같은 사람이 다시 내면 수량을 덮어쓴다.
     *
     * 아무것도 고르지 않고 저장하면 신청을 거둔 것으로 본다.
     */
    @Transactional
    public GoodsOrderResponse save(Long userId, GoodsOrderRequest request) {
        HackathonEvent event = eventService.getActiveEvent();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.USER_NOT_FOUND));

        // 굿즈는 해커톤 신청자에게 판다. 운영진과 교수는 팀을 만들 수 없으므로
        // 팀 소속을 따지면 영영 살 수 없게 된다 — 그 둘은 그냥 통과시킨다.
        if (user.getRole() == Role.STUDENT
                && teamRepository.findByEventIdAndMemberUserId(event.getId(), userId).isEmpty()) {
            throw new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                    "해커톤에 참가 신청한 분만 굿즈를 신청할 수 있습니다.");
        }

        GoodsOrder order = goodsOrderRepository.findByEventIdAndUserId(event.getId(), userId)
                .orElseGet(() -> goodsOrderRepository.save(GoodsOrder.create(event, user)));

        order.updateQuantities(request.quantities());
        log.info("굿즈 신청: user={}, 비었나={}", user.getEmail(), order.isEmpty());

        return GoodsOrderResponse.from(order);
    }
}
