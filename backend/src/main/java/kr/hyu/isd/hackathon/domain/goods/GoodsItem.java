package kr.hyu.isd.hackathon.domain.goods;

/**
 * 학과 굿즈 품목.
 *
 * 가격은 수량에 따라 조정될 수 있어 확정값이 아니다. 신청 화면에 적어 두고,
 * 정확한 금액은 신청 마감 뒤 단톡방에서 안내한다.
 */
public enum GoodsItem {

    HOODIE("후드집업", 35_000),
    STICKER("스티커", 3_000),
    KEYRING("쿠션 키링", 8_000);

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
}
