# -*- coding: utf-8 -*-
"""
모바일 아트보드 렌더러.

원칙: PC에 있는 글자는 하나도 빼지 않는다. 자리가 좁으면 크기와 배치로 해결한다.
"""
import content as C
from build import HERO_BG, WHITE, BLUE_TXT, e, avatar, nav_links

SLIDE = "min-height:780px;justify-content:center;padding:60px 26px"


def _vertical(spans):
    """세로쓰기 컬럼. 글자를 눕히지 않고 위에서 아래로 쌓는다."""
    inner = "".join(spans)
    return (f'<span style="writing-mode:vertical-rl;text-orientation:upright;white-space:nowrap;'
            f'display:inline-block;line-height:1">{inner}</span>')


def hero():
    # InfoSys 세로 조판: I·nfo·S·ys 를 위에서 아래로 한 줄에 쌓는다.
    # 대문자는 크게, 소문자는 절반 크기로 대소 관계를 유지한다.
    letters = "".join(
        f'<span style="font-size:83px">{e(cap)}</span>'
        f'<span style="font-size:42px;letter-spacing:.02em">{e(sub)}</span>'
        for cap, sub in C.HERO["wordmark"])
    infosys = (f'<span class="t1" style="writing-mode:vertical-rl;text-orientation:upright;'
               f'white-space:nowrap;display:inline-block;line-height:1;color:var(--blue)">'
               f'{letters}</span>')

    hack = (f'<span style="writing-mode:vertical-rl;text-orientation:upright;white-space:nowrap;'
            f'display:inline-block;line-height:1;font-size:90px;letter-spacing:.04em">'
            f'{e(C.HERO["hackathon"])}</span>')

    # 학과명도 세로로 쭉 세워 워드마크와 결을 맞춘다
    dept = (f'<span style="writing-mode:vertical-rl;text-orientation:upright;white-space:nowrap;'
            f'display:inline-block;line-height:1.15;font-size:24px;letter-spacing:.04em;'
            f'opacity:.8">{e(C.HERO["dept"])}</span>')

    meta = "".join(f'<span>{e(m)}</span>' for m in C.HERO["meta"])
    nav = nav_links(gap=9, size=11)
    meta_row = (f'<div class="stack t2" style="gap:4px;margin-top:22px;font-size:14px">{meta}</div>'
                if C.HERO["meta"] else "")
    return f"""
  <section class="sec" style="min-height:1040px;justify-content:center;
      padding:26px 24px 40px;color:#16308f;background:{HERO_BG}">
    <img class="lion" src="lion.png" alt="" style="right:14px;bottom:14px;width:250px;opacity:.8">
    <div class="row t2 fg" style="position:absolute;top:22px;left:24px;right:24px;
        justify-content:space-between;font-size:11px">
      <span class="t1" style="font-size:13px;letter-spacing:-.01em">{e(C.BRAND)}</span>
      {nav}
    </div>
    <div class="fg" style="display:flex;align-items:center;justify-content:center;gap:26px">
      <p class="t2" style="margin:0">{dept}</p>
      {infosys}
      <p class="t1" style="margin:0;color:var(--blue)">{hack}</p>
    </div>
    {meta_row}
  </section>"""


def _sec(bg, fg, inner, pad=SLIDE, extra=""):
    return f'<section class="sec" style="{pad};background:{bg};color:{fg}"{extra}>{inner}</section>'


def tracks_intro():
    d = C.TRACKS_INTRO
    cards = "".join(
        f'<div class="stack" style="gap:3px">'
        f'<p class="t2" style="margin:0;font-size:12px;letter-spacing:.2em;opacity:.45">{e(n)}</p>'
        f'<p class="t1" style="margin:0;font-size:34px;letter-spacing:-.02em">{e(name)}</p>'
        f'<p class="t3" style="margin:0;font-size:15px;opacity:.65">{e(sub)}</p></div>'
        for n, name, sub in d["items"])
    eyebrow = (f'<p class="t2" style="margin:0;font-size:11px;letter-spacing:.2em;opacity:.55">{e(d["eyebrow"])}</p>'
               if d["eyebrow"] else "")
    return _sec(WHITE, BLUE_TXT, eyebrow +
                f'<h2 class="t1" style="margin:0 0 0;font-size:52px;line-height:.98;letter-spacing:-.03em">{e(d["title"])}</h2>'
                f'<p class="t3" style="margin:20px 0 0;font-size:16px;line-height:1.65;opacity:.82">{e(d["lede"])}</p>'
                '<hr class="rule" style="margin-top:38px">'
                f'<div class="stack" style="gap:22px;margin-top:26px">{cards}</div>',
                extra=' id="tracks"')


def track(t, bg, fg):
    metas = "".join(
        f'<div><p class="t2" style="margin:0 0 6px;font-size:11px;letter-spacing:.15em;opacity:.5">{e(lab)}</p>'
        f'<p class="t3" style="margin:0;font-size:15px;line-height:1.55">' +
        "<br>".join(e(x) for x in vals) + '</p></div>'
        for lab, vals in t["metas"])
    note = (f'<p class="t2" style="margin:26px 0 0;font-size:12px;padding:11px 16px;'
            f'border:2px solid rgba(255,255,255,.35);border-radius:999px;align-self:flex-start">'
            f'{e(t["note"])}</p>') if t["note"] else ""
    return _sec(bg, fg,
                f'<div class="row" style="gap:14px">'
                f'<p class="t2" style="margin:0;font-size:12px;letter-spacing:.2em;opacity:.55">{e(t["num"])}</p>'
                f'<p class="t2" style="margin:0;font-size:11px;letter-spacing:.2em;opacity:.55">{e(t["kicker"])}</p></div>'
                f'<h2 class="t1" style="margin:14px 0 0;font-size:56px;line-height:.95;letter-spacing:-.04em">{e(t["name"])}</h2>'
                f'<p class="t3" style="margin:18px 0 0;font-size:16px;line-height:1.65;opacity:.82">{e(t["lede"])}</p>'
                '<hr class="rule" style="margin-top:32px">'
                f'<div class="stack" style="gap:18px;margin-top:22px">{metas}</div>{note}')


def day(d, bg, fg, first):
    rows = "".join(
        f'<div class="row" style="gap:16px;padding:11px 0;border-bottom:1px solid currentColor">'
        f'<span class="t2" style="width:66px;font-size:15px;flex:none">{e(tm)}</span>'
        f'<span class="{"t2" if hi else "t3"}" style="font-size:14px;line-height:1.4;opacity:{".95" if hi else ".72"}">{e(lb)}</span></div>'
        for tm, lb, hi in d["rows"])
    return _sec(bg, fg,
                f'<p class="t2" style="margin:0;font-size:11px;letter-spacing:.2em;opacity:.55">{e(d["eyebrow"])}</p>'
                f'<div class="stack" style="gap:2px;margin-top:12px">'
                f'<h2 class="t1" style="margin:0;font-size:62px;line-height:.98;letter-spacing:-.02em">{e(d["title"])}</h2>'
                f'<p class="t2" style="margin:0;font-size:17px;opacity:.6">{e(d["kicker"])}</p></div>'
                f'<p class="t3" style="margin:16px 0 0;font-size:15px;opacity:.8">{e(d["lede"])}</p>'
                f'<div style="margin-top:24px">{rows}</div>',
                extra=' id="schedule"' if first else "")


def professors(bg, fg):
    p = C.PROFESSORS
    cards = "".join(
        f'<div class="row" style="gap:18px;border:2px solid currentColor;'
        f'border-radius:16px;padding:20px 18px">{avatar(66)}'
        f'<div class="stack" style="gap:2px">'
        f'<p class="t1" style="margin:0;font-size:24px;letter-spacing:-.02em">{e(x["name"])}</p>'
        f'<p class="t2" style="margin:0;font-size:14px;opacity:.75">{e(x["field"])}</p>'
        f'<p class="t3" style="margin:0;font-size:14px;opacity:.6">{e(x["email"])}</p></div></div>'
        for x in p["people"])
    return _sec(bg, fg,
                f'<p class="t2" style="margin:0;font-size:11px;letter-spacing:.2em;opacity:.55">{e(p["eyebrow"])}</p>'
                f'<h2 class="t1" style="margin:14px 0 0;font-size:52px;line-height:.98;letter-spacing:-.03em">{e(p["title"])}</h2>'
                + (f'<p class="t3" style="margin:18px 0 0;font-size:16px;line-height:1.65;opacity:.82">{e(p["lede"])}</p>' if p["lede"] else "")
                + '<hr class="rule" style="margin-top:26px">'
                f'<div class="stack" style="gap:24px;margin-top:28px">{cards}</div>',
                extra=' id="professor"')


def join(bg, fg):
    j = C.JOIN
    btns = "".join(
        f'<a href="#" class="t2" style="display:flex;align-items:center;justify-content:center;'
        f'height:54px;border-radius:999px;font-size:15px;'
        + ('background:#fff;color:var(--blue)' if i == 0 else 'border:2px solid rgba(255,255,255,.4)')
        + f'">{e(b)}</a>' for i, b in enumerate(j["buttons"]))
    foot = "".join(f'<span>{e(x)}</span>' for x in j["footer"])
    return _sec(bg, fg,
                '<img class="lion" src="lion.png" alt="" style="right:14px;bottom:14px;width:280px;opacity:.09">'
                f'<div class="fg"><p class="t2" style="margin:0;font-size:11px;letter-spacing:.2em;opacity:.55">{e(j["eyebrow"])}</p>'
                f'<h2 class="t1" style="margin:14px 0 0;font-size:44px;line-height:1.05;letter-spacing:-.03em">{e(j["title"])}</h2>'
                f'<p class="t3" style="margin:18px 0 0;font-size:16px;line-height:1.65;opacity:.82">{e(j["lede"])}</p>'
                f'<div class="stack" style="gap:10px;margin-top:28px">{btns}</div>'
                '<hr class="rule" style="margin-top:40px">'
                f'<div class="stack t3" style="gap:5px;margin-top:18px;font-size:13px;opacity:.62">{foot}</div></div>',
                extra=' id="join"')


def body():
    s = [hero(), tracks_intro()]
    pairs = [(BLUE_TXT, WHITE), (WHITE, BLUE_TXT)]
    flip = 0
    for t in C.TRACKS:
        bg, fg = pairs[flip % 2]; s.append(track(t, bg, fg)); flip += 1
    for i, d in enumerate(C.DAYS):
        bg, fg = pairs[flip % 2]; s.append(day(d, bg, fg, i == 0)); flip += 1
    bg, fg = pairs[flip % 2]; s.append(professors(bg, fg)); flip += 1
    bg, fg = pairs[flip % 2]; s.append(join(bg, fg))
    return "\n".join(s)
