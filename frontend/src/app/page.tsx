import Link from "next/link";
import { cx } from "@/components/ui";

/**
 * 랜딩 = 디자인 캔버스의 아트보드를 그대로 옮긴 것.
 *
 * 슬라이드 9장이고 히어로 다음부터 흰색↔파란색이 한 장마다 반전된다.
 * 스크롤하면 한 장씩 딱 걸리도록 scroll-snap을 건다.
 *
 * 히어로는 데스크톱과 모바일이 서로 다른 조판이다 (캔버스의 Main / Mobile 아트보드).
 * 데스크톱은 가로로 눕히고, 모바일은 학과명·InfoSys·HACKATHON을 세로로 세운다.
 * 하나를 축소해 쓰는 게 아니라 둘을 각각 그린다.
 */

const HERO_BG =
  "radial-gradient(115% 85% at 20% 32%,#6f97ee 0%,rgba(111,151,238,0) 60%)," +
  "radial-gradient(90% 70% at 96% 4%,#e8f0ff 0%,rgba(232,240,255,0) 55%)," +
  "radial-gradient(130% 105% at 92% 100%,#dcf2fd 0%,rgba(220,242,253,0) 62%)," +
  "linear-gradient(158deg,#a6c0f5 0%,#b5cdf8 40%,#cfe4fa 72%,#dceef9 100%)";

const DEPT = "한양대학교 정보시스템학과";
const WORDMARK: ReadonlyArray<readonly [string, string]> = [
  ["I", "nfo"],
  ["S", "ys"],
];
const NAV = [
  { label: "Tracks", href: "#tracks" },
  { label: "Schedule", href: "#schedule" },
  { label: "Professor", href: "#professor" },
  { label: "Join", href: "#join" },
];

const TRACKS_INTRO = {
  title: "Three Tracks",
  lede: "산출물의 완성도 단계에 따라 제출물과 평가 기준이 다른 세 트랙으로 나뉩니다.",
  items: [
    { num: "01", name: "SPARK", sub: "아이디어톤 · 1일차" },
    { num: "02", name: "SPRINT", sub: "기초 개발 · 2일차" },
    { num: "03", name: "SUMMIT", sub: "완성형 개발 · 2일차" },
  ],
};

const TRACKS = [
  {
    num: "01",
    name: "SPARK",
    kicker: "아이디어톤 · DAY 1",
    lede: "제시된 문제를 해결하는 아이디어를 제시합니다. 구현된 코드는 제출할 수 없고, 순수한 기획과 UX 논리로만 겨룹니다.",
    metas: [
      { label: "필수 제출물", values: ["서비스 기획서", "프로토타입 (목업·와이어프레임)"] },
      { label: "평가", values: ["학생 투표 100%", "발표 종료 직후 현장 채점"] },
      { label: "제출 마감", values: ["1일차 19:00", "마감 후 자동 잠금"] },
    ],
    note: "소스코드 · 구동 프로그램 제출 전면 금지",
  },
  {
    num: "02",
    name: "SPRINT",
    kicker: "기초 개발 · DAY 2",
    lede: "문제를 해결하는 기초적인 프로그램을 만듭니다. 핵심 기능이 실제로 동작하는지, 만든 것이 기획한 문제를 해결하는지를 봅니다.",
    metas: [
      { label: "필수 제출물", values: ["소스코드", "발표자료", "핵심 기능 시연"] },
      { label: "평가", values: ["학생 투표 100%", "동작성 · 기획 적합성 · 발표"] },
      { label: "제출 마감", values: ["2일차 18:00", "마감 직후 심사 시작"] },
    ],
    note: null,
  },
  {
    num: "03",
    name: "SUMMIT",
    kicker: "완성형 개발 · DAY 2",
    lede: "실제로 배포되어 접속 가능한 서비스를 만듭니다. 기술적 완성도와 아키텍처, 상용화 가능성까지 교수 심사위원이 함께 평가합니다.",
    metas: [
      {
        label: "필수 제출물",
        values: ["배포 링크", "전체 소스코드", "시스템 아키텍처 다이어그램", "기술 명세서 · 발표자료"],
      },
      { label: "평가", values: ["교수 평가 70%", "학생 투표 30%"] },
      {
        label: "배정 기준",
        values: ["실무 경험 · 수상 이력 · 배포 서비스", "또는 자가진단 4개 중 3개 이상"],
      },
    ],
    note: null,
  },
] as const;

const DAYS = [
  {
    title: "DAY 1",
    kicker: "SPARK 트랙",
    lede: "Spark 트랙은 1일차에만 진행되는 별도 트랙입니다.",
    rows: [
      { time: "10:00", label: "시작", hi: false },
      { time: "13:00", label: "점심 식사", hi: false },
      { time: "~19:00", label: "Spark 트랙 산출물 제출 마감", hi: true },
      { time: "19:00", label: "저녁 식사 · 발표 · 학생 투표", hi: true },
      { time: "21:00", label: "Spark 트랙 시상", hi: false },
      { time: "22:00", label: "해산", hi: false },
    ],
  },
  {
    title: "DAY 2",
    kicker: "SPRINT · SUMMIT 트랙",
    lede: "Sprint와 Summit 트랙은 2일차 일정으로 진행됩니다.",
    rows: [
      { time: "10:00", label: "시작", hi: false },
      { time: "13:00", label: "점심 식사", hi: false },
      { time: "~18:00", label: "Sprint · Summit 제출 마감 (직후 심사 시작)", hi: true },
      { time: "18:00", label: "저녁 식사", hi: false },
      { time: "19:00", label: "Sprint 프레젠테이션", hi: false },
      { time: "20:00", label: "Summit 프레젠테이션", hi: false },
      { time: "21:00", label: "Sprint · Summit 평가 및 시상", hi: true },
      { time: "22:00", label: "해산", hi: false },
    ],
  },
] as const;

/** 실제 교수님 정보는 학생회에서 확정해야 하므로 대괄호 자리표시자로 둔다. */
const PROFESSORS = [
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
];

const JOIN = {
  title: "어느 트랙에 참가해야 할까요?",
  lede: "실무 경험이나 수상 이력이 있으면 곧바로 Summit으로, 그렇지 않으면 체크리스트 4개 중 3개 이상 해당할 때 Summit으로 배정됩니다. 30초면 확인할 수 있습니다.",
  footer: [
    "한양대학교 정보시스템학과 학생회",
    "참가 자격 · @hanyang.ac.kr 계정",
    "문의 · [오픈채팅 링크]",
  ],
};

export default function HomePage() {
  return (
    // 이 요소가 스크롤 컨테이너다. 한 장씩 걸리게 하려면 스냅을 여기에 건다.
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll overscroll-y-none">
      <Hero />
      <ThreeTracks />
      {TRACKS.map((track, i) => (
        <TrackSlide key={track.name} track={track} inverted={i % 2 === 0} />
      ))}
      {DAYS.map((day, i) => (
        <DaySlide key={day.title} day={day} inverted={i % 2 === 1} first={i === 0} />
      ))}
      <Professors />
      <Join />
    </div>
  );
}

/** 슬라이드 한 장. inverted면 파란 배경에 흰 글씨, 아니면 흰 배경에 파란 글씨. */
function Slide({
  id,
  inverted,
  children,
}: {
  id?: string;
  inverted: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cx(
        "relative flex min-h-screen snap-start flex-col justify-center overflow-hidden",
        "px-6 py-16 sm:px-12 lg:px-[72px]",
        inverted ? "bg-brand-600 text-white" : "bg-white text-brand-600",
      )}
    >
      <div className="mx-auto w-full max-w-[1296px]">{children}</div>
    </section>
  );
}

function HeroNav() {
  return (
    <nav className="absolute inset-x-6 top-6 z-20 flex items-center justify-between sm:inset-x-12 lg:inset-x-[72px] lg:top-11">
      <span className="font-display text-[13px] tracking-tight lg:text-[19px]">
        IS HACKATHON
      </span>
      <span className="flex items-center gap-[9px] text-[11px] font-bold lg:gap-6 lg:text-[15px]">
        {NAV.map((n) =>
          n.label === "Join" ? (
            <a
              key={n.label}
              href={n.href}
              className="rounded-full bg-brand-600 px-3 py-1.5 text-white lg:px-4 lg:py-2"
            >
              {n.label}
            </a>
          ) : (
            <a key={n.label} href={n.href} className="hover:opacity-70">
              {n.label}
            </a>
          ),
        )}
      </span>
    </nav>
  );
}

function Hero() {
  return (
    <section
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden px-6 py-16 sm:px-12 lg:px-[72px]"
      style={{ background: HERO_BG, color: "#16308f" }}
    >
      <HeroNav />

      {/* 사자는 배경, 글씨는 항상 그 앞. 프레임 안쪽에 두어 잘리지 않게 한다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lion.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3.5 right-3.5 z-0 w-[250px] opacity-80 lg:bottom-7 lg:right-[72px] lg:w-[470px] lg:opacity-85"
      />

      {/* 모바일 — 학과명·InfoSys·HACKATHON을 세로로 세워 가운데 모은다 */}
      <div className="relative z-10 flex items-center justify-center gap-[26px] md:hidden">
        <span className="vertical whitespace-nowrap text-[24px] font-bold leading-[1.15] tracking-[0.04em] opacity-80">
          {DEPT}
        </span>
        <span className="font-display vertical whitespace-nowrap leading-none text-brand-600">
          {WORDMARK.map(([cap, sub]) => (
            <span key={cap}>
              <span className="text-[83px]">{cap}</span>
              <span className="text-[42px] tracking-[0.02em]">{sub}</span>
            </span>
          ))}
        </span>
        <span className="font-display vertical whitespace-nowrap text-[90px] leading-none tracking-[0.04em] text-brand-600">
          HACKATHON
        </span>
      </div>

      {/* 데스크톱 — 가로 조판 */}
      <div className="relative z-10 mx-auto hidden w-full max-w-[1296px] md:block">
        <p className="font-bold tracking-[0.02em] opacity-80" style={{ fontSize: "min(1.53vw, 22px)" }}>
          {DEPT}
        </p>
        {/* 대문자 I·S 아래로 nfo·ys를 아래첨자처럼 붙인다 */}
        <p
          className="font-display mt-2.5 leading-[1.15] tracking-[-0.01em] text-brand-600"
          style={{ fontSize: "min(10.03vw, 150px)" }}
        >
          {WORDMARK.map(([cap, sub]) => (
            <span key={cap}>
              <span>{cap}</span>
              <span className="inline-block translate-y-[0.28em] text-[0.5em] tracking-[-0.01em]">
                {sub}
              </span>
            </span>
          ))}
        </p>
        <p
          className="font-display mt-3.5 leading-none tracking-[0.01em] text-brand-600"
          style={{ fontSize: "min(9.9vw, 148px)" }}
        >
          HACKATHON
        </p>
      </div>
    </section>
  );
}

function ThreeTracks() {
  return (
    <Slide id="tracks" inverted={false}>
      <h2 className="font-display text-[52px] leading-[0.95] tracking-tight sm:text-[80px] lg:text-[112px]">
        {TRACKS_INTRO.title}
      </h2>
      <p className="mt-6 max-w-[660px] text-base leading-[1.65] opacity-80 sm:text-[21px]">
        {TRACKS_INTRO.lede}
      </p>

      <hr className="mt-12 h-0.5 border-0 bg-current opacity-20 lg:mt-[70px]" />

      <div className="mt-9 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-8 lg:gap-14">
        {TRACKS_INTRO.items.map((t) => (
          <div key={t.name}>
            <p className="text-[13px] font-bold tracking-[0.2em] opacity-45 lg:text-[15px]">
              {t.num}
            </p>
            <p className="font-display mt-2 text-[34px] tracking-tight lg:text-[46px]">
              {t.name}
            </p>
            <p className="mt-1 text-[15px] opacity-65 lg:text-[17px]">{t.sub}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function TrackSlide({
  track,
  inverted,
}: {
  track: (typeof TRACKS)[number];
  inverted: boolean;
}) {
  return (
    <Slide inverted={inverted}>
      <div className="flex items-center gap-6">
        <p className="text-[13px] font-bold tracking-[0.2em] opacity-55 lg:text-[15px]">
          {track.num}
        </p>
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
          {track.kicker}
        </p>
      </div>

      <h2
        className="font-display mt-5 leading-[0.86] tracking-[-0.04em]"
        style={{ fontSize: "clamp(2.8rem, 13.2vw, 11.875rem)" }}
      >
        {track.name}
      </h2>

      <p className="mt-7 max-w-[660px] text-base leading-[1.65] opacity-80 sm:text-[21px]">
        {track.lede}
      </p>

      <hr className="mt-10 h-0.5 border-0 bg-current opacity-20 lg:mt-[60px]" />

      <div className="mt-9 grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-8 lg:gap-14">
        {track.metas.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-50 lg:text-xs">
              {m.label}
            </p>
            <p className="mt-3 text-[15px] leading-[1.6] lg:text-[17px]">
              {m.values.map((v) => (
                <span key={v} className="block">
                  {v}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {track.note && (
        <p className="mt-9 self-start rounded-full border-2 border-current/35 px-5 py-3 text-[13px] font-bold lg:mt-11 lg:text-[15px]">
          {track.note}
        </p>
      )}
    </Slide>
  );
}

function DaySlide({
  day,
  inverted,
  first,
}: {
  day: (typeof DAYS)[number];
  inverted: boolean;
  first: boolean;
}) {
  return (
    <Slide id={first ? "schedule" : undefined} inverted={inverted}>
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
        SCHEDULE
      </p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-7 gap-y-1">
        <h2 className="font-display text-[62px] leading-[0.95] tracking-[-0.02em] sm:text-[100px] lg:text-[132px]">
          {day.title}
        </h2>
        <p className="text-[17px] font-bold opacity-60 lg:text-2xl">{day.kicker}</p>
      </div>

      <p className="mt-5 text-[15px] opacity-80 lg:text-xl">{day.lede}</p>

      <div className="mt-8 lg:mt-11">
        {day.rows.map((r) => (
          <div
            key={r.time + r.label}
            className="flex items-center gap-5 border-b border-current/20 py-3 sm:gap-[30px] lg:py-[15px]"
          >
            <span className="w-16 shrink-0 text-[15px] font-bold sm:w-24 lg:text-[19px]">
              {r.time}
            </span>
            <span
              className={cx(
                "text-sm leading-snug lg:text-[18px]",
                r.hi ? "font-bold opacity-95" : "opacity-70",
              )}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Professors() {
  return (
    <Slide id="professor" inverted={false}>
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
        JUDGES
      </p>
      <h2 className="font-display mt-4 text-[52px] leading-[0.95] tracking-tight sm:text-[80px] lg:text-[112px]">
        Professor
      </h2>

      <hr className="mt-8 h-0.5 border-0 bg-current opacity-20 lg:mt-12" />

      {/* 네모 칸 세 개를 같은 간격·같은 높이로 */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:mt-11 lg:gap-14">
        {PROFESSORS.map((p, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-3xl border-2 border-current px-5 py-7 text-center lg:min-h-[360px] lg:px-7 lg:py-10"
          >
            <svg
              viewBox="0 0 64 64"
              role="img"
              aria-label="사진 자리"
              className="block size-[84px] rounded-full opacity-15 lg:size-[132px]"
            >
              <circle cx="32" cy="24" r="12" fill="currentColor" />
              <path d="M8 62c0-13 11-22 24-22s24 9 24 22z" fill="currentColor" />
            </svg>
            <p className="font-display mt-5 text-[24px] tracking-tight lg:mt-6 lg:text-[34px]">
              {p.name}
            </p>
            <p className="mt-3 text-[14px] font-bold opacity-75 lg:text-base">{p.field}</p>
            <p className="mt-1 text-[14px] opacity-60 lg:text-base">{p.email}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Join() {
  return (
    <Slide id="join" inverted>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lion.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3.5 right-3.5 z-0 w-[280px] opacity-[0.09] lg:bottom-10 lg:right-[72px] lg:w-[520px]"
      />

      <div className="relative z-10">
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
          JOIN
        </p>
        <h2
          className="font-display mt-4 max-w-4xl leading-[1.02] tracking-tight"
          style={{ fontSize: "clamp(2.2rem, 6vw, 5.5rem)" }}
        >
          {JOIN.title}
        </h2>
        <p className="mt-7 max-w-[660px] text-base leading-[1.65] opacity-80 sm:text-[21px]">
          {JOIN.lede}
        </p>

        <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:gap-3.5">
          <Link
            href="/self-check"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-[15px] font-bold text-brand-600 transition-opacity hover:opacity-90 lg:h-[60px] lg:text-[17px]"
          >
            자가진단 시작하기
          </Link>
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 px-10 text-[15px] font-bold transition-colors hover:bg-white/10 lg:h-[60px] lg:text-[17px]"
          >
            팀 등록하기
          </Link>
        </div>

        <hr className="mt-12 h-0.5 border-0 bg-current opacity-20 lg:mt-16" />

        <div className="mt-5 flex flex-col gap-1.5 text-[13px] opacity-60 sm:flex-row sm:gap-14 lg:text-[15px]">
          {JOIN.footer.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
    </Slide>
  );
}
