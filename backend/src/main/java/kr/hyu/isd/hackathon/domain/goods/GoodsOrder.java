package kr.hyu.isd.hackathon.domain.goods;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.user.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.EnumMap;
import java.util.Map;

/**
 * 굿즈 사전 신청.
 *
 * 참가자 한 명이 한 장만 낸다. 다시 내면 수량을 덮어쓴다 — 마감 전까지는 고칠 수
 * 있어야 하고, 신청서를 여러 장 받으면 집계가 어긋난다.
 *
 * 돈은 여기서 받지 않는다. 수량만 모으고 금액 안내와 입금은 단톡방에서 한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_goods_order", uniqueConstraints = {
        @UniqueConstraint(name = "uk_goods_event_user", columnNames = {"event_id", "user_id"})
})
public class GoodsOrder extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "goods_order_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "tb_goods_order_item",
            joinColumns = @JoinColumn(name = "goods_order_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "item", length = 20)
    @Column(name = "quantity", nullable = false)
    private Map<GoodsItem, Integer> quantities = new EnumMap<>(GoodsItem.class);

    private GoodsOrder(HackathonEvent event, User user) {
        this.event = event;
        this.user = user;
    }

    public static GoodsOrder create(HackathonEvent event, User user) {
        return new GoodsOrder(event, user);
    }

    /** 수량을 통째로 바꾼다. 0 이하인 품목은 신청하지 않은 것으로 보고 지운다. */
    public void updateQuantities(Map<GoodsItem, Integer> requested) {
        this.quantities.clear();
        if (requested == null) return;
        requested.forEach((item, quantity) -> {
            if (item != null && quantity != null && quantity > 0) {
                this.quantities.put(item, quantity);
            }
        });
    }

    public int quantityOf(GoodsItem item) {
        return this.quantities.getOrDefault(item, 0);
    }

    /** 아무것도 고르지 않았는가. 빈 신청은 "신청 취소"로 읽는다. */
    public boolean isEmpty() {
        return this.quantities.isEmpty();
    }

    /** 예상 금액(원). 가격이 확정되기 전의 어림값이다. */
    public int estimatedTotal() {
        return this.quantities.entrySet().stream()
                .mapToInt(e -> e.getKey().getPrice() * e.getValue())
                .sum();
    }
}
