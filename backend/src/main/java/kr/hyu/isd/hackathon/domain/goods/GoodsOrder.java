package kr.hyu.isd.hackathon.domain.goods;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.user.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.EnumMap;
import java.util.HashMap;
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

    /**
     * 키캡 키링 한 세트에 달리는 키캡 수(1 또는 3). 키캡을 신청하지 않았으면 null.
     * 열 이름이 숫자인 이유는 {@link KeycapOption} 주석에 적었다.
     */
    @Column(name = "keycap_slots")
    private Integer keycapSlots;

    /**
     * 도안별 신청 개수. 키 1~5는 keycap_1 ~ keycap_5에 대응한다.
     * 같은 도안을 여러 개 담을 수 있어 개수로 센다.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "tb_goods_order_keycap",
            joinColumns = @JoinColumn(name = "goods_order_id"))
    @MapKeyColumn(name = "design_no")
    @Column(name = "quantity", nullable = false)
    private Map<Integer, Integer> keycapDesigns = new HashMap<>();

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

    /**
     * 키캡 구성을 통째로 바꾼다. 세트 수는 {@link #updateQuantities}가 이미 넣은
     * KEYCAP 수량을 쓴다. 키캡을 신청하지 않았으면 구성도 비운다 — 수량만 0으로
     * 두고 도안이 남아 있으면 집계에서 유령 수요가 잡힌다.
     *
     * 넘어온 값이 규칙에 맞는지는 {@link #validateKeycap()}가 따로 본다.
     */
    public void updateKeycap(Integer slots, Map<Integer, Integer> designs) {
        if (quantityOf(GoodsItem.KEYCAP) <= 0) {
            this.keycapSlots = null;
            this.keycapDesigns.clear();
            return;
        }
        this.keycapSlots = slots;
        this.keycapDesigns.clear();
        if (designs == null) return;
        designs.forEach((no, count) -> {
            if (no != null && count != null && count > 0) {
                this.keycapDesigns.put(no, count);
            }
        });
    }

    /**
     * 키캡 구성이 앞뒤가 맞는가. 맞지 않으면 사유를, 맞으면 null을 돌려준다.
     *
     * 고른 도안 수가 세트가 담을 수 있는 칸 수와 정확히 같아야 한다. 모자라면 빈 칸이
     * 생기고 넘치면 넣을 자리가 없는데, 어느 쪽이든 받아 두면 제작 단계에서 사람이
     * 하나씩 되물어야 한다.
     */
    public String validateKeycap() {
        int sets = quantityOf(GoodsItem.KEYCAP);
        if (sets <= 0) return null;

        KeycapOption option = KeycapOption.ofSlots(this.keycapSlots);
        if (option == null) return "키캡 키링은 1구 또는 3구를 골라 주세요.";

        for (Map.Entry<Integer, Integer> e : this.keycapDesigns.entrySet()) {
            int no = e.getKey();
            if (no < 1 || no > KeycapOption.DESIGN_COUNT) {
                return "없는 키캡 도안입니다.";
            }
        }

        int wanted = option.getSlots() * sets;
        int picked = pickedKeycapCount();
        if (picked != wanted) {
            return "키캡 도안을 %d개 골라 주세요. (지금 %d개)".formatted(wanted, picked);
        }
        return null;
    }

    /** 고른 도안 개수의 합 */
    public int pickedKeycapCount() {
        return this.keycapDesigns.values().stream().mapToInt(Integer::intValue).sum();
    }

    public KeycapOption keycapOption() {
        return KeycapOption.ofSlots(this.keycapSlots);
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
                .mapToInt(e -> priceOf(e.getKey()) * e.getValue())
                .sum();
    }

    /** 한 개(키캡은 한 세트) 값. 키캡은 1구·3구에 따라 다르다. */
    private int priceOf(GoodsItem item) {
        if (item != GoodsItem.KEYCAP) return item.getPrice();
        KeycapOption option = keycapOption();
        return option == null ? 0 : option.getPrice();
    }
}
