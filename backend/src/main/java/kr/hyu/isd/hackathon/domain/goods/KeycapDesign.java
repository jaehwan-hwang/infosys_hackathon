package kr.hyu.isd.hackathon.domain.goods;

import java.util.Arrays;

/**
 * 키캡 키링 도안.
 *
 * 선언 순서가 화면과 내보내기 파일의 순서다.
 *
 * 저장은 이름이 아니라 {@code no}로 한다. 이 번호는 한 번 붙으면 바꾸지 않는다 — 도안이
 * 다섯 개이던 때 들어온 신청이 1~5번으로 저장돼 있어서, 번호를 새 순서대로 다시 매기면
 * 그 사람들이 고른 도안이 엉뚱한 것으로 바뀐다. 새 도안은 뒤 번호를 받는다.
 *
 * @param image public/goods/ 아래 사진 파일 이름
 */
public enum KeycapDesign {

    CLEAR_BLUE_LOGO(3, "투명배경+파란로고", "투명배경파란로고.png"),
    WHITE_BLUE_LOGO(6, "흰배경+파란로고", "흰배경파란로고.png"),
    BLUE_DOTTED_LOGO(4, "파란배경+도트무늬흰로고", "파란배경도트무늬흰로고.png"),
    BLUE_CLEAN_LOGO(7, "파란배경+깔끔한흰로고", "파란배경깔끔한흰로고.png"),
    TTALKKAK(2, "딸깍!", "딸깍!.png"),
    I_LOVE_INFOSYS(1, "ILoveInfosys", "ILoveInfosys.png"),
    SUDO(5, "sudo", "sudo.png");

    private final int no;
    private final String label;
    private final String image;

    KeycapDesign(int no, String label, String image) {
        this.no = no;
        this.label = label;
        this.image = image;
    }

    public int getNo() {
        return no;
    }

    public String getLabel() {
        return label;
    }

    public String getImage() {
        return image;
    }

    /** 저장된 번호를 되살린다. 없는 번호면 null. */
    public static KeycapDesign ofNo(Integer no) {
        if (no == null) return null;
        return Arrays.stream(values()).filter(d -> d.no == no).findFirst().orElse(null);
    }
}
