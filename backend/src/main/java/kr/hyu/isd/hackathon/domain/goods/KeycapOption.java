package kr.hyu.isd.hackathon.domain.goods;

import java.util.Arrays;

/**
 * 키캡 키링의 구성. 한 세트에 키캡이 몇 개 달리는지로 값이 갈린다.
 *
 * DB에는 이 이름이 아니라 {@code slots} 숫자를 저장한다. 문자열로 저장하면
 * 열이 "('ONE','THREE')만 허용"하는 타입으로 만들어져, 나중에 5구를 더할 때
 * 이미 데이터가 들어 있는 운영 DB의 스키마 변경이 막힌다. 숫자에는 그 제약이 없다.
 */
public enum KeycapOption {

    ONE(1, "1구", 2_500),
    THREE(3, "3구", 7_000);

    /** 고를 수 있는 도안 수. 프론트의 keycap_1 ~ keycap_5 이미지와 짝이다. */
    public static final int DESIGN_COUNT = 5;

    /** 한 세트에 담기는 키캡 수 */
    private final int slots;
    private final String label;
    private final int price;

    KeycapOption(int slots, String label, int price) {
        this.slots = slots;
        this.label = label;
        this.price = price;
    }

    public int getSlots() {
        return slots;
    }

    public String getLabel() {
        return label;
    }

    /** 한 세트 가격(원) */
    public int getPrice() {
        return price;
    }

    /** 저장된 숫자를 되살린다. 없는 구성이면 null. */
    public static KeycapOption ofSlots(Integer slots) {
        if (slots == null) return null;
        return Arrays.stream(values())
                .filter(o -> o.slots == slots)
                .findFirst()
                .orElse(null);
    }
}
