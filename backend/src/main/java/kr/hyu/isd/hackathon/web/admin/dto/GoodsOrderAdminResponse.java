package kr.hyu.isd.hackathon.web.admin.dto;

import kr.hyu.isd.hackathon.domain.goods.GoodsItem;
import kr.hyu.isd.hackathon.domain.goods.GoodsOrder;
import kr.hyu.isd.hackathon.domain.goods.KeycapDesign;
import kr.hyu.isd.hackathon.domain.goods.KeycapOption;
import kr.hyu.isd.hackathon.domain.user.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 운영진이 보는 굿즈 신청 한 건.
 *
 * 물건을 받으러 온 사람을 확인하고 입금을 대조해야 하므로, 참가자 화면과 달리
 * 학번·전화번호를 가리지 않는다. 이 응답은 운영진 경로에서만 나간다.
 *
 * @param lines 품목 한 줄씩. 화면이 품목 순서나 가격 규칙을 다시 알 필요가 없도록
 *              이름·수량·금액을 서버가 다 계산해 넘긴다.
 */
public record GoodsOrderAdminResponse(
        Long userId,
        String name,
        String studentId,
        String phone,
        String email,
        List<Line> lines,
        /** 고른 키캡 도안과 개수. 도안 목록 순서대로, 고르지 않은 도안은 뺀다. */
        List<DesignCount> keycapDesigns,
        int estimatedTotal,
        Instant updatedAt
) {

    /**
     * @param option 1구·3구처럼 품목 안에서 갈리는 구성. 없으면 null.
     * @param unit   한 개(세트) 값
     */
    public record Line(String label, String option, int quantity, int unit, int amount) {
    }

    /** 도안 이름까지 실어 보낸다 — 화면이 번호를 이름으로 다시 바꿀 필요가 없도록 */
    public record DesignCount(String name, int count) {
    }

    public static GoodsOrderAdminResponse from(GoodsOrder order) {
        User user = order.getUser();
        KeycapOption keycap = order.keycapOption();

        List<Line> lines = new ArrayList<>();
        for (GoodsItem item : GoodsItem.values()) {
            int quantity = order.quantityOf(item);
            if (quantity <= 0) continue;

            boolean optioned = item.hasOptions();
            int unit = optioned ? (keycap == null ? 0 : keycap.getPrice()) : item.getPrice();
            lines.add(new Line(
                    item.getLabel(),
                    optioned && keycap != null ? keycap.getLabel() : null,
                    quantity,
                    unit,
                    unit * quantity));
        }

        return new GoodsOrderAdminResponse(
                user.getId(),
                user.getName(),
                user.getStudentId(),
                user.getPhone(),
                user.getEmail(),
                lines,
                designCounts(order.getKeycapDesigns()),
                order.estimatedTotal(),
                order.getUpdatedAt());
    }

    private static List<DesignCount> designCounts(Map<Integer, Integer> picked) {
        List<DesignCount> result = new ArrayList<>();
        for (KeycapDesign d : KeycapDesign.values()) {
            int count = picked.getOrDefault(d.getNo(), 0);
            if (count > 0) result.add(new DesignCount(d.getLabel(), count));
        }
        return result;
    }
}
