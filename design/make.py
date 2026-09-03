# -*- coding: utf-8 -*-
"""
Main.dc.html / Mobile.dc.html 을 만들고 PC·모바일 문구가 같은지 검증한다.

    python make.py
"""
import pathlib
import re
import sys

import build
import mobile
import fonts as F

OUT = pathlib.Path(__file__).resolve().parent

TEMPLATE = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
%(css)s
  </style>
</helmet>

<div class="page" style="--blue: {{blue}}">
%(body)s
</div>
</x-dc>

<script data-dc-script data-props='{"blue":{"editor":"color","default":"#1E3FD8","section":"Theme","options":["#1E3FD8","#0F2FA8","#2563EB","#101B4E"]},"$preview":{"width":%(w)d,"height":%(h)d}}'>
class Component extends DCLogic {
  renderVals() {
    // 파랑 하나가 슬라이드 전체를 지배한다. CSS 변수로 한 번만 내려보낸다.
    return { blue: this.props.blue ?? '#1E3FD8' };
  }
}
</script>
</body>
</html>
"""


def visible_text(html: str) -> str:
    s = re.sub(r"<style.*?</style>|<script.*?</script>|<svg.*?</svg>", " ", html, flags=re.S)
    s = re.sub(r"<[^>]+>", "\n", s)
    return s


def tokens(html: str) -> set:
    """비교용 문구 조각. 공백 차이는 무시한다."""
    out = set()
    for line in visible_text(html).split("\n"):
        t = " ".join(line.split())
        if t:
            out.add(t)
    return out


def main():
    d_body, m_body = build.desktop_body(), mobile.body()

    # --- PC에 있는 글자가 모바일에도 다 있는지 확인 ---
    d_tok, m_tok = tokens(d_body), tokens(m_body)
    missing = sorted(t for t in d_tok - m_tok if len(t) > 1)
    if missing:
        print("모바일에 빠진 문구:", file=sys.stderr)
        for t in missing:
            print("  -", t, file=sys.stderr)
        sys.exit(1)

    # --- 실제 쓰인 글자만으로 폰트 서브셋 ---
    report = []
    css = build.BASE_CSS + "\n" + F.build_css(visible_text(d_body + m_body), report)

    for name, w, h, body in (("Main.dc.html", 1440, 8400, d_body),
                             ("Mobile.dc.html", 390, 7400, m_body)):
        html = TEMPLATE % {"css": css, "body": body, "w": w, "h": h}
        (OUT / name).write_text(html, encoding="utf-8")
        print(f"{name:16s} {len(html)//1024:5d} KB")

    for n, before, after in report:
        print(f"  폰트 {n:30s} {before//1024:5d} KB → {after//1024:3d} KB")
    print(f"문구 검증: PC {len(d_tok)}개 조각 전부 모바일에 존재")


if __name__ == "__main__":
    main()
