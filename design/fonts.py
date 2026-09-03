# -*- coding: utf-8 -*-
"""
로컬 폰트를 실제 쓰는 글자만 남겨 woff2로 줄이고 @font-face data URI로 만든다.

캔버스는 자기 출처 밖으로 네트워크 요청을 못 하므로 폰트를 인라인해야 한다.
Freesentation 원본은 한 벌에 2.6MB라 그대로는 못 싣는다. 서브셋이 필수다.
"""
import base64, io, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent

FACES = [
    # (CSS family, weight, 원본 경로)
    ("RiaSans",       700, ROOT / "RiaSans/RiaSans-Bold.otf"),
    ("Freesentation", 700, ROOT / "Freesentation/Freesentation-7Bold.ttf"),
    ("Freesentation", 500, ROOT / "Freesentation/Freesentation-5Medium.ttf"),
]

# 자리표시자를 나중에 실제 문구로 바꿔도 글자가 빠지지 않도록 넉넉히 깔아둔다.
ALWAYS = (
    "0123456789"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    " .,·:;!?~%&/()[]<>@#'\"-–—+=*"
    "가나다라마바사아자차카타파하"
    "월화수목금토일년시분초점명개차"
)


def _subset(src: pathlib.Path, chars: str) -> bytes:
    """폰트를 주어진 글자만 남기고 woff2로 압축한다."""
    font = TTFont(str(src), lazy=True)
    opts = subset.Options()
    opts.layout_features = ["*"]          # 커닝·합자 유지
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.drop_tables += ["DSIG"]
    sub = subset.Subsetter(options=opts)
    sub.populate(text=chars)
    sub.subset(font)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    font.close()
    return buf.getvalue()


def build_css(text: str, report=None) -> str:
    """@font-face 블록을 만들어 돌려준다. text 안의 글자만 포함된다."""
    chars = "".join(sorted(set(text) | set(ALWAYS)))
    blocks = []
    for family, weight, path in FACES:
        if not path.exists():
            raise FileNotFoundError(path)
        data = _subset(path, chars)
        if report is not None:
            report.append((path.name, path.stat().st_size, len(data)))
        b64 = base64.b64encode(data).decode()
        blocks.append(
            "@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
            "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}"
            % (family, weight, b64)
        )
    return "\n".join(blocks)
