# -*- coding: utf-8 -*-
"""
Main.dc.html / Mobile.dc.html 을 content.py 한 벌에서 생성한다.

PC에 있는 글자는 모바일에도 반드시 들어가야 하므로 두 렌더러가 같은 콘텐츠를 읽는다.
문구를 고칠 때는 content.py만 고치고 이 스크립트를 다시 돌린다.
"""
import html as H
import pathlib
import re

import content as C
import fonts as F

OUT = pathlib.Path(__file__).resolve().parent

# 글자 크기 3단: RiaSans Bold(가장 큼) > Freesentation Bold > Freesentation Medium
BASE_CSS = """
body{margin:0}
a{color:inherit;text-decoration:none}
a:hover{opacity:.7}
.page{background:var(--blue);-webkit-font-smoothing:antialiased;
  font-family:'Freesentation',system-ui,sans-serif;font-weight:500;
  /* 한국어는 어절 중간에서 끊으면 "세 트/랙"처럼 어색해진다 */
  word-break:keep-all;overflow-wrap:break-word;text-wrap:pretty}
.sec{box-sizing:border-box;display:flex;flex-direction:column;position:relative;overflow:hidden}
.t1{font-family:'RiaSans','Freesentation',system-ui,sans-serif;font-weight:700}
.t2{font-family:'Freesentation',system-ui,sans-serif;font-weight:700}
.t3{font-family:'Freesentation',system-ui,sans-serif;font-weight:500}
.rule{height:2px;border:0;margin:0;background:currentColor;opacity:.22}
.stack{display:flex;flex-direction:column}
.row{display:flex;align-items:center}
/* 사자는 배경, 글씨는 항상 그 앞 */
.lion{position:absolute;pointer-events:none;z-index:0}
.fg{position:relative;z-index:2}
.avatar{display:block;border-radius:50%;background:currentColor;opacity:.12}
"""

HERO_BG = ("radial-gradient(115% 85% at 20% 32%,#6f97ee 0%,rgba(111,151,238,0) 60%),"
           "radial-gradient(90% 70% at 96% 4%,#e8f0ff 0%,rgba(232,240,255,0) 55%),"
           "radial-gradient(130% 105% at 92% 100%,#dcf2fd 0%,rgba(220,242,253,0) 62%),"
           "linear-gradient(158deg,#a6c0f5 0%,#b5cdf8 40%,#cfe4fa 72%,#dceef9 100%)")

WHITE, BLUE_TXT = "#ffffff", "var(--blue)"


def e(s):
    return H.escape(str(s), quote=False)


def nav_links(gap=14, size=15):
    """상단 메뉴. 마지막 Join만 파란 알약 버튼으로 그린다."""
    out = []
    for n in C.NAV:
        if n == "Join":
            out.append(f'<a href="#join" class="t2" style="background:var(--blue);color:#fff;'
                       f'border-radius:999px;padding:{size*0.5:.0f}px {size*1.15:.0f}px;'
                       f'line-height:1">{e(n)}</a>')
        else:
            out.append(f'<a href="#{n.lower()}">{e(n)}</a>')
    return f'<span style="display:flex;align-items:center;gap:{gap}px">' + "".join(out) + '</span>'


def avatar(size):
    """교수 사진 자리. 실제 사진이 들어오면 이 자리를 <img>로 바꾼다."""
    return (f'<svg class="avatar" width="{size}" height="{size}" viewBox="0 0 64 64" '
            f'aria-label="사진 자리" role="img">'
            f'<circle cx="32" cy="24" r="12" fill="currentColor"/>'
            f'<path d="M8 62c0-13 11-22 24-22s24 9 24 22z" fill="currentColor"/></svg>')


# ---------------------------------------------------------------- 데스크톱
def hero_desktop():
    w = "".join(
        f'<span style="font-size:1em">{e(cap)}</span>'
        f'<span style="font-size:.5em;display:inline-block;transform:translateY(.28em);'
        f'letter-spacing:-.01em">{e(sub)}</span>'
        for cap, sub in C.HERO["wordmark"])
    meta = '<span style="opacity:.45">·</span>'.join(
        f'<span>{e(m)}</span>' for m in C.HERO["meta"])
    nav = nav_links()
    meta_row = (f'<div class="row t2" style="gap:22px;margin-top:30px;font-size:19px">{meta}</div>'
                if C.HERO["meta"] else "")
    # 내비를 절대 배치로 빼고 본문을 세로 중앙에 둔다 (요청: 위로 올려 중앙 쪽으로)
    return f"""
  <section class="sec" style="min-height:900px;justify-content:center;
      padding:44px 72px 84px;color:#16308f;background:{HERO_BG}">
    <img class="lion" src="lion.png" alt="" style="right:72px;bottom:28px;width:470px;opacity:.85">
    <nav class="row t2 fg" style="position:absolute;top:44px;left:72px;right:72px;gap:24px;font-size:15px">
      <span class="t1" style="margin-right:auto;font-size:19px;letter-spacing:-.01em">{e(C.BRAND)}</span>
      {nav}
    </nav>
    <div class="stack fg" style="gap:0">
      <p class="t2" style="margin:0 0 10px;font-size:22px;letter-spacing:.02em;opacity:.8">{e(C.HERO['dept'])}</p>
      <!-- RiaSans 실측(190px): InfoSys 882 / HACKATHON 1641.
           HACKATHON은 좌우 여백 72px을 뺀 1296px에 거의 꽉 차는 크기다. -->
      <p class="t1" style="margin:0;font-size:150px;line-height:1.15;letter-spacing:-.01em;color:var(--blue)">{w}</p>
      <p class="t1" style="margin:14px 0 0;font-size:148px;line-height:1;letter-spacing:.01em;color:var(--blue)">{e(C.HERO["hackathon"])}</p>
      {meta_row}
    </div>
  </section>"""


def sec_open(bg, fg, pad="96px 100px", extra=""):
    return (f'<section class="sec" style="min-height:900px;justify-content:center;'
            f'padding:{pad};background:{bg};color:{fg}"{extra}>')


def tracks_intro_desktop():
    d = C.TRACKS_INTRO
    cards = "".join(
        f'<div class="stack" style="gap:8px">'
        f'<p class="t2" style="margin:0;font-size:15px;letter-spacing:.2em;opacity:.45">{e(n)}</p>'
        f'<p class="t1" style="margin:0;font-size:46px;letter-spacing:-.02em">{e(name)}</p>'
        f'<p class="t3" style="margin:0;font-size:17px;opacity:.65">{e(sub)}</p></div>'
        for n, name, sub in d["items"])
    eyebrow = (f'<p class="t2" style="margin:0;font-size:13px;letter-spacing:.22em;opacity:.55">{e(d["eyebrow"])}</p>'
               if d["eyebrow"] else "")
    return (sec_open(WHITE, BLUE_TXT, extra=' id="tracks"') + eyebrow +
            f'<h2 class="t1" style="margin:0 0 0;font-size:112px;line-height:.95;letter-spacing:-.03em">{e(d["title"])}</h2>'
            f'<p class="t3" style="margin:26px 0 0;font-size:21px;line-height:1.65;max-width:660px;opacity:.82">{e(d["lede"])}</p>'
            f'<hr class="rule" style="margin-top:70px">'
            f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:56px;margin-top:38px">{cards}</div>'
            '</section>')


def track_desktop(t, bg, fg):
    metas = "".join(
        f'<div><p class="t2" style="margin:0 0 12px;font-size:12px;letter-spacing:.16em;opacity:.5">{e(lab)}</p>'
        f'<p class="t3" style="margin:0;font-size:17px;line-height:1.6">' +
        "<br>".join(e(x) for x in vals) + '</p></div>'
        for lab, vals in t["metas"])
    note = (f'<p class="t2" style="margin:44px 0 0;font-size:15px;padding:14px 22px;'
            f'border:2px solid rgba(255,255,255,.35);border-radius:999px;align-self:flex-start">'
            f'{e(t["note"])}</p>') if t["note"] else ""
    return (sec_open(bg, fg) +
            f'<div class="row" style="gap:24px">'
            f'<p class="t2" style="margin:0;font-size:15px;letter-spacing:.2em;opacity:.55">{e(t["num"])}</p>'
            f'<p class="t2" style="margin:0;font-size:13px;letter-spacing:.22em;opacity:.55">{e(t["kicker"])}</p></div>'
            f'<h2 class="t1" style="margin:22px 0 0;font-size:190px;line-height:.86;letter-spacing:-.04em">{e(t["name"])}</h2>'
            f'<p class="t3" style="margin:30px 0 0;font-size:21px;line-height:1.65;max-width:660px;opacity:.82">{e(t["lede"])}</p>'
            f'<hr class="rule" style="margin-top:60px">'
            f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:56px;margin-top:38px">{metas}</div>'
            f'{note}</section>')


def day_desktop(d, bg, fg, first):
    rows = "".join(
        f'<div class="row" style="gap:30px;padding:15px 0;border-bottom:1px solid currentColor">'
        f'<span class="t2" style="width:96px;font-size:19px">{e(tm)}</span>'
        f'<span class="{"t2" if hi else "t3"}" style="font-size:18px;opacity:{".95" if hi else ".72"}">{e(lb)}</span></div>'
        for tm, lb, hi in d["rows"])
    return (sec_open(bg, fg, extra=' id="schedule"' if first else "") +
            f'<p class="t2" style="margin:0;font-size:13px;letter-spacing:.22em;opacity:.55">{e(d["eyebrow"])}</p>'
            f'<div class="row" style="gap:28px;margin-top:16px">'
            f'<h2 class="t1" style="margin:0;font-size:132px;line-height:.95;letter-spacing:-.02em">{e(d["title"])}</h2>'
            f'<p class="t2" style="margin:8px 0 0;font-size:24px;opacity:.6">{e(d["kicker"])}</p></div>'
            f'<p class="t3" style="margin:22px 0 0;font-size:20px;opacity:.8">{e(d["lede"])}</p>'
            f'<div style="margin-top:44px;opacity:.999">{rows}</div></section>')


def professors_desktop(bg, fg):
    p = C.PROFESSORS
    cards = "".join(
        f'<div class="stack" style="gap:0;align-items:center;text-align:center;'
        f'border:2px solid currentColor;border-radius:20px;padding:40px 28px;min-height:360px">'
        f'{avatar(132)}'
        f'<p class="t1" style="margin:26px 0 0;font-size:34px;letter-spacing:-.02em">{e(x["name"])}</p>'
        f'<p class="t2" style="margin:14px 0 0;font-size:16px;opacity:.75">{e(x["field"])}</p>'
        f'<p class="t3" style="margin:6px 0 0;font-size:16px;opacity:.6">{e(x["email"])}</p></div>'
        for x in p["people"])
    return (sec_open(bg, fg, extra=' id="professor"') +
            f'<p class="t2" style="margin:0;font-size:13px;letter-spacing:.22em;opacity:.55">{e(p["eyebrow"])}</p>'
            f'<h2 class="t1" style="margin:18px 0 0;font-size:112px;line-height:.95;letter-spacing:-.03em">{e(p["title"])}</h2>'
            + (f'<p class="t3" style="margin:24px 0 0;font-size:21px;line-height:1.65;max-width:660px;opacity:.82">{e(p["lede"])}</p>' if p["lede"] else "")
            + f'<hr class="rule" style="margin-top:{"62" if p["lede"] else "48"}px">'
            f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:56px;margin-top:44px">{cards}</div>'
            '</section>')


def join_desktop(bg, fg):
    j = C.JOIN
    btns = "".join(
        f'<a href="#" class="t2" style="display:inline-flex;align-items:center;justify-content:center;'
        f'height:60px;padding:0 40px;border-radius:999px;font-size:17px;'
        + (f'background:#fff;color:var(--blue)' if i == 0 else 'border:2px solid rgba(255,255,255,.4)')
        + f'">{e(b)}</a>' for i, b in enumerate(j["buttons"]))
    foot = "".join(f'<span>{e(x)}</span>' for x in j["footer"])
    return (sec_open(bg, fg, pad="84px 100px", extra=' id="join"') +
            '<img class="lion" src="lion.png" alt="" style="right:72px;bottom:40px;width:520px;opacity:.09">'
            f'<div class="fg"><p class="t2" style="margin:0;font-size:13px;letter-spacing:.22em;opacity:.55">{e(j["eyebrow"])}</p>'
            f'<h2 class="t1" style="margin:18px 0 0;font-size:88px;line-height:1.02;letter-spacing:-.03em;max-width:900px">{e(j["title"])}</h2>'
            f'<p class="t3" style="margin:26px 0 0;font-size:21px;line-height:1.65;max-width:660px;opacity:.82">{e(j["lede"])}</p>'
            f'<div class="row" style="gap:14px;margin-top:38px">{btns}</div>'
            f'<hr class="rule" style="margin-top:64px">'
            f'<div class="row t3" style="gap:56px;margin-top:22px;font-size:15px;opacity:.62">{foot}</div>'
            '</div></section>')


def desktop_body():
    s = [hero_desktop(), tracks_intro_desktop()]
    pairs = [(BLUE_TXT, WHITE), (WHITE, BLUE_TXT)]  # 파랑배경/흰글씨, 흰배경/파란글씨
    flip = 0
    for t in C.TRACKS:
        bg, fg = pairs[flip % 2]
        s.append(track_desktop(t, bg, fg)); flip += 1
    for i, d in enumerate(C.DAYS):
        bg, fg = pairs[flip % 2]
        s.append(day_desktop(d, bg, fg, i == 0)); flip += 1
    bg, fg = pairs[flip % 2]; s.append(professors_desktop(bg, fg)); flip += 1
    bg, fg = pairs[flip % 2]; s.append(join_desktop(bg, fg))
    return "\n".join(s)
