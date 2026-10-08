package kr.hyu.isd.hackathon.domain.goods;

/**
 * 학과 굿즈 품목.
 *
 * 가격은 수량에 따라 조정될 수 있어 확정값이 아니다. 신청 화면에 적어 두고,
 * 정확한 금액은 신청 마감 뒤 단톡방에서 안내한다.
 *
 * 키캡 키링은 1구·3구가 따로라 여기 적힌 값이 금액을 정하지 못한다.
 * 그 품목의 금액은 {@link KeycapOption}이 정하고, 여기 값은 "2,500원부터"를
 * 보여줄 때 쓰는 최저가다.
 */
public enum GoodsItem {

    STICKER("스티커", 2_000),
    KEYRING("쿠션 키링", 8_000),
    KEYCAP("키캡 키링", KeycapOption.ONE.getPrice());

    private final String label;
    private final int price;

    GoodsItem(String label, int price) {
        this.label = label;
        this.price = price;
    }

    public String getLabel() {
        return label;
    }

    /** 예상 가격(원). 수량에 따라 소폭 조정될 수 있다. */
    public int getPrice() {
        return price;
    }

    /** 1구·3구처럼 고를 것이 더 있는 품목인가 */
    public boolean hasOptions() {
        return this == KEYCAP;
    }
}
