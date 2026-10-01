import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { SlideFit } from "@/components/slide-fit";
import { cx } from "@/components/ui";

/**
 * 랜딩 = web design.svg.
 *
 * 히어로는 디자인 파일을 그대로 옮겼다.
 *   - 흰 바탕에 파란 그라데이션 원 세 개가 45%로 깔린다 (디자인 파일의 #ECECEC는 흰색으로 올렸다)
 *   - 큰 제목은 검정이되, 원과 겹치는 부분만 파란 그라데이션으로 바뀐다
 *   - 사자는 검정으로 첫 줄(INFOSYS) 오른쪽 빈자리에 들어간다
 * 아래 슬라이드 여덟 장은 짜임새를 그대로 두고 색만 새 팔레트로 바꿨다.
 *
 * 글씨는 Inter(라틴·숫자) + Freesentation(한글). 디자인 파일의 제목은 폭이 좁은
 * 서체라 같은 글자 높이에서 Inter보다 38%쯤 좁다. Inter를 눌러 담는 대신
 * 제목이 단 너비를 꽉 채우도록 크기를 맞췄다 — 두 줄의 가로 비율은 디자인과 같다.
 *
 * 스냅이 제대로 걸리려면 모든 슬라이드가 "정확히 한 화면"이어야 한다.
 * 한 장이라도 화면보다 높으면 그 안에서 스냅이 풀려 넘어가다 중간에 멈춘다.
 */

const EYEBROW = "2026 정보시스템학과 제16대 학생회 ‘휘연’";

/**
 * 제목 글자 크기. 100cqw = 본문 단 너비이고, Inter 28pt Black·자간 -0.03em으로 짠
 * "HACKATHON"의 가로폭을 재 보면 글자 크기의 6.22배다. 100/6.22 ≈ 16.08cqw면
 * 제목이 단을 정확히 채운다 — 디자인 파일에서 제목이 단 끝까지 가는 것과 같다.
 * 화면이 아주 낮을 때만 걸리도록 dvh 상한을 느슨하게 둔다.
 */
const HEADLINE_SIZE = "min(16.08cqw, 40dvh)";

const TRACKS_INTRO = {
  title: "Three Tracks",
  lede: "결과물의 완성도 단계에 따라 제출물과 평가 기준이 다른 세 트랙으로 나뉩니다.",
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
    lede: "제시된 문제를 해결하는 아이디어를 제시합니다. 실제 개발은 금지되지만, 아이디어와 기획, 예상되는 효과를 자유롭게 발표하면 됩니다.",
    metas: [
      { label: "필수 제출물", values: ["발표 자료"] },
      { label: "평가", values: ["해커톤 참가자 투표 100%"] },
      { label: "제출 마감", values: ["11월 7일 1일차 19:00", "마감 후 자동 잠금"] },
    ],
    tags: ["아이디어톤", "개발 결과물 제출 금지"],
  },
  {
    num: "02",
    name: "SPRINT",
    kicker: "기초 개발 · DAY 2",
    lede: "문제를 해결하는 기초적인 프로그램을 만듭니다. 핵심 기능이 실제로 동작하는지, 만든 것이 기획한 문제를 해결하는지를 봅니다.",
    metas: [
      { label: "필수 제출물", values: ["프로토타입", "발표 자료"] },
      { label: "평가", values: ["해커톤 참가자 투표 100%"] },
      { label: "제출 마감", values: ["11월 8일 2일차 18:00", "마감 직후 심사 시작"] },
    ],
    tags: ["해커톤", "MVP", "기초 개발"],
  },
  {
    num: "03",
    name: "SUMMIT",
    kicker: "완성형 개발 · DAY 2",
    lede: "실제로 배포되어 접속 가능한 서비스를 만듭니다. 기술적 완성도와 아키텍처, 상용화 가능성까지 교수 심사위원이 함께 평가합니다.",
    metas: [
      { label: "필수 제출물", values: ["프로덕트", "소스코드", "발표 자료"] },
      { label: "평가", values: ["교수 평가 70%", "참가자 투표 30%"] },
      { label: "제출 마감", values: ["11월 8일 2일차 18:00", "마감 직후 심사 시작"] },
    ],
    tags: ["해커톤", "교수 평가", "개발 완성도"],
  },
] as const;

/** DAY 1·2 진행 순서는 같다. 트랙만 다르다. */
const DAY_ROWS = [
  { time: "10:00", label: "시작", hi: false },
  { time: "13:00", label: "점심 식사", hi: false },
  { time: "18:00", label: "결과물 제출 마감 및 저녁 식사", hi: true },
  { time: "19:00", label: "발표 및 투표", hi: false },
  { time: "21:00", label: "시상", hi: true },
  { time: "22:00", label: "해산", hi: false },
] as const;

const DAYS = [
  {
    title: "DAY 1",
    kicker: "SPARK 트랙",
    lede: "Spark 트랙은 1일차에만 진행되는 별도 트랙입니다.",
    rows: DAY_ROWS,
  },
  {
    title: "DAY 2",
    kicker: "SPRINT · SUMMIT 트랙",
    lede: "Sprint와 Summit 트랙은 2일차 일정으로 진행됩니다.",
    rows: DAY_ROWS,
  },
] as const;

/** 실제 교수님 정보는 학생회에서 확정해야 하므로 대괄호 자리표시자로 둔다. */
const PROFESSORS = [
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
  { name: "[교수님 성함]", field: "[전공 분야]", email: "[이메일]" },
];

const JOIN = {
  title: "어느 트랙에 참가해야 할까요",
  lede: "SPARK, SPRINT, SUMMIT 중 무엇에 참가해야 할지 몇 가지 설문을 통해 확인할 수 있습니다.",
  footer: [
    "한양대학교 정보시스템학과 학생회",
    "참가 자격 · @hanyang.ac.kr 계정",
    "문의 · [오픈채팅 링크]",
  ],
};

export default function HomePage() {
  return (
    <>
      {/* 이 요소가 스크롤 컨테이너다. relative여야 슬라이드 offsetTop이 이 기준으로 잡힌다. */}
      <div
        data-snap-root
        className="relative h-dvh snap-y snap-mandatory overflow-y-scroll overscroll-y-none"
      >
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
      <LandingNav />
    </>
  );
}

/**
 * 슬라이드 공통 틀.
 * - h-dvh 고정 + snap-always: 한 번 스크롤에 정확히 한 장씩 넘어간다
 * - 아래 여백은 하단 내비가 가리지 않도록 내비 높이만큼 비운다
 */
const SLIDE_BOX = "relative flex h-dvh snap-start snap-always flex-col overflow-hidden";
/** 좌우·아래 여백. 히어로의 그라데이션 덧판도 같은 값을 써야 글자가 정확히 겹쳐진다. */
const SLIDE_PAD = "px-6 pb-[80px] sm:px-12 md:pb-[104px] lg:px-[72px]";

const SLIDE_FRAME = `${SLIDE_BOX} ${SLIDE_PAD} pt-[max(20px,4dvh)]`;

/**
 * 히어로 본문이 시작하는 높이.
 *
 * 배경 원은 디자인 아트보드(5000×6102)를 cover로 깔기 때문에, 화면 비율에 따라
 * 가로가 기준이 되기도 하고 세로가 기준이 되기도 한다. 글자가 항상 디자인과
 * 같은 자리의 원 위에 오도록, 아트보드에서 제목이 시작하는 y(828)를 같은 식으로 환산한다.
 *   828/5000 = 16.56vw,  828/6102 = 13.57dvh → 둘 중 큰 쪽이 cover의 실제 배율
 */
const HERO_PAD_TOP = "pt-[max(16.56vw,13.57dvh)]";

function Slide({
  id,
  nav,
  inverted,
  children,
}: {
  id?: string;
  nav: string;
  inverted: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-nav={nav}
      className={cx(
        SLIDE_FRAME,
        // 디자인 파일의 두 색: 흰 바탕 + 검정 글씨 ↔ 파란 그라데이션 + 흰 글씨
        inverted ? "bg-grad-brand text-white" : "bg-[var(--bg)] text-black",
      )}
    >
      <SlideFit className="mx-auto w-full max-w-[1296px]">{children}</SlideFit>
    </section>
  );
}

/**
 * 사자. 디자인 파일에서는 검정이고 첫 줄(INFOSYS) 오른쪽 빈자리를 채운다.
 * 파란 슬라이드 위에서는 흰색이어야 보이므로 두 벌을 둔다.
 */
function Lion({
  tone = "white",
  className,
  faint = false,
}: {
  tone?: "white" | "black";
  className?: string;
  faint?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "black" ? "/infosys-lion-black.svg" : "/infosys-lion.svg"}
      alt=""
      aria-hidden="true"
      className={cx("pointer-events-none h-auto select-none", faint && "opacity-[0.09]", className)}
    />
  );
}

/**
 * 히어로 본문. 검정 한 벌, 그 위에 파란 그라데이션 한 벌을 똑같이 깔고
 * 원 모양으로 오려내 "원과 겹치는 글자만 파랗다"를 만든다.
 * 두 벌이 한 픽셀도 어긋나면 안 되므로 같은 컴포넌트를 두 번 그린다.
 */
function HeroContent({ gradient = false }: { gradient?: boolean }) {
  const tint = gradient
    ? {
        backgroundImage: "var(--grad-brand)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : undefined;

  return (
    <div className="w-full">
      <p
        className="font-hero font-bold leading-none tracking-[-0.01em]"
        style={{ fontSize: "min(2.8cqw, 7dvh)", ...tint }}
      >
        {EYEBROW}
      </p>

      {/* 첫 줄은 단의 68%쯤에서 끝나고, 남는 오른쪽을 사자가 채운다 (디자인 그대로) */}
      <div
        className="font-hero-display mt-[0.6cqw] leading-[0.77] tracking-[-0.03em]"
        style={{ fontSize: HEADLINE_SIZE }}
      >
        <p className="whitespace-nowrap" style={tint}>
          INFOSYS
        </p>
        <p className="whitespace-nowrap" style={tint}>
          HACKATHON
        </p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="about"
      data-nav="about"
      className={cx(SLIDE_BOX, SLIDE_PAD, HERO_PAD_TOP, "bg-[var(--bg)] text-black")}
    >
      {/* 배경 원 세 개. 세로로 긴 디자인 아트보드를 위쪽에 맞춰 잘라 쓴다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[url('/hero-circles.svg')] bg-cover bg-top bg-no-repeat"
      />

      {/* cqw는 이 상자(본문 단)를 기준으로 잰다 — 글자도 사자도 단 너비에 맞춰 커진다.
          바탕에 깔리는 쪽이 파란 그라데이션이고, 원 안에서만 검정으로 바뀐다. */}
      <div className="relative z-10 mx-auto w-full max-w-[1296px] [container-type:inline-size]">
        <HeroContent gradient />
        {/* 첫 줄 오른쪽 빈자리. 디자인에서 사자는 INFOSYS와 같은 높이에 선다. */}
        {/* 디자인에서 사자 높이는 첫 줄 글자 높이와 거의 같다(769:728).
            Inter는 같은 폭에서 글자가 더 낮으므로, 단 너비가 아니라 제목 크기를 기준으로 맞춘다. */}
        <Lion tone="black" className="absolute right-[7.9cqw] top-[3.4cqw] w-[17.2cqw]" />
      </div>

      {/* 같은 글자를 검정으로 한 벌 더 올리고 원 모양으로만 남긴다 — 원 안의 글자만 검정이 된다.
          원 배경과 마스크가 같은 상자(=화면 전체)에 같은 규칙(cover·위 정렬)으로
          깔려야 자리가 맞으므로, 덧판은 섹션과 똑같은 여백·정렬을 다시 쓴다. */}
      <div
        aria-hidden="true"
        className={cx("pointer-events-none absolute inset-0 z-20 flex flex-col", SLIDE_PAD, HERO_PAD_TOP)}
        style={{
          maskImage: "url('/hero-circles-mask.svg')",
          WebkitMaskImage: "url('/hero-circles-mask.svg')",
          maskSize: "cover",
          WebkitMaskSize: "cover",
          maskPosition: "center top",
          WebkitMaskPosition: "center top",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <div className="mx-auto w-full max-w-[1296px] [container-type:inline-size]">
          <HeroContent />
        </div>
      </div>
    </section>
  );
}

function ThreeTracks() {
  return (
    <Slide id="tracks" nav="tracks" inverted={false}>
      <h2
        className="font-display leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(2.4rem, min(7.8vw, 12.5dvh), 7rem)" }}
      >
        {TRACKS_INTRO.title}
      </h2>
      <p className="mt-[min(24px,3dvh)] max-w-[660px] text-[15px] leading-[1.65] opacity-80 sm:text-[21px]">
        {TRACKS_INTRO.lede}
      </p>

      <hr className="mt-[min(70px,6dvh)] h-0.5 border-0 bg-current opacity-20" />

      <div className="mt-[min(36px,4dvh)] grid gap-5 sm:grid-cols-3 sm:gap-8 lg:gap-14">
        {TRACKS_INTRO.items.map((t) => (
          <div key={t.name}>
            <p className="text-[12px] font-bold tracking-[0.2em] opacity-45 lg:text-[15px]">
              {t.num}
            </p>
            {/* sm 3단 칸 폭에서 6글자(SPRINT)가 넘치지 않는 크기. RiaSans 6글자 폭 = 5.747 × 글자크기 */}
            <p className="font-display mt-1 text-[34px] tracking-tight sm:mt-2 sm:text-[clamp(1.5rem,min(3.4vw,6dvh),2.875rem)]">
              {t.name}
            </p>
            <p className="mt-0.5 text-[15px] opacity-65 sm:mt-1 lg:text-[17px]">{t.sub}</p>
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
    <Slide nav="tracks" inverted={inverted}>
      <div className="flex items-center gap-6">
        <p className="text-[13px] font-bold tracking-[0.2em] opacity-55 lg:text-[15px]">
          {track.num}
        </p>
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
          {track.kicker}
        </p>
      </div>

      <h2
        className="font-display mt-[min(20px,2.2dvh)] leading-[0.86] tracking-[-0.04em]"
        style={{ fontSize: "clamp(2.6rem, min(13.2vw, 21dvh), 11.875rem)" }}
      >
        {track.name}
      </h2>

      <p className="mt-[min(28px,3dvh)] max-w-[660px] text-[15px] leading-[1.6] opacity-80 sm:text-[21px] sm:leading-[1.65]">
        {track.lede}
      </p>

      <hr className="mt-[min(60px,5.5dvh)] h-0.5 border-0 bg-current opacity-20" />

      {/* 모바일은 첫 칸을 가로로 넓게 쓰고 값을 한 줄로 이어 붙여 높이를 아낀다 */}
      <div className="mt-[min(36px,3.5dvh)] grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 sm:gap-8 lg:gap-14">
        {track.metas.map((m, i) => (
          <div key={m.label} className={cx(i === 0 && "col-span-2 sm:col-span-1")}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-50 lg:text-xs">
              {m.label}
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.55] sm:mt-3 sm:text-[15px] sm:leading-[1.6] lg:text-[17px]">
              {m.values.map((v, j) => (
                <span key={v} className="sm:block">
                  {v}
                  {j < m.values.length - 1 && <span className="sm:hidden"> · </span>}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {track.tags.length > 0 && (
        <div className="mt-[min(44px,4dvh)] flex flex-wrap gap-2 sm:gap-3">
          {track.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border-2 border-current/35 px-4 py-2.5 text-[12px] font-bold sm:px-5 sm:py-3 lg:text-[15px]"
            >
              {tag}
            </span>
          ))}
        </div>
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
    <Slide id={first ? "schedule" : undefined} nav="schedule" inverted={inverted}>
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
        SCHEDULE
      </p>

      <div className="mt-[min(16px,2dvh)] flex flex-wrap items-baseline gap-x-7 gap-y-1">
        <h2
          className="font-display leading-[0.95] tracking-[-0.02em]"
          style={{ fontSize: "clamp(2.8rem, min(9vw, 14dvh), 8.25rem)" }}
        >
          {day.title}
        </h2>
        <p className="text-[17px] font-bold opacity-60 lg:text-2xl">{day.kicker}</p>
      </div>

      <p className="mt-[min(20px,2.4dvh)] text-[15px] opacity-80 lg:text-xl">{day.lede}</p>

      <div className="mt-[min(44px,4dvh)]">
        {day.rows.map((r) => (
          <div
            key={r.time + r.label}
            className="flex items-center gap-5 border-b border-current/20 py-[min(15px,1.6dvh)] sm:gap-[30px]"
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
    <Slide id="professor" nav="professor" inverted={false}>
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
        JUDGES
      </p>
      <h2
        className="font-display mt-[min(16px,2dvh)] leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(2.4rem, min(7.8vw, 12.5dvh), 7rem)" }}
      >
        Professor
      </h2>

      <hr className="mt-[min(48px,4.5dvh)] h-0.5 border-0 bg-current opacity-20" />

      {/* 네모 칸 세 개를 같은 간격·같은 높이로. 모바일은 캔버스처럼 사진 옆에 글을 둔 가로 카드. */}
      <div className="mt-[min(44px,4dvh)] grid gap-3 sm:grid-cols-3 sm:gap-6 lg:gap-14">
        {PROFESSORS.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border-2 border-current px-4 py-3.5 sm:flex-col sm:gap-0 sm:rounded-3xl sm:px-6 sm:py-[min(40px,4dvh)] sm:text-center lg:min-h-[min(360px,38dvh)] lg:justify-center"
          >
            <svg
              viewBox="0 0 64 64"
              role="img"
              aria-label="사진 자리"
              className="block size-14 shrink-0 rounded-full opacity-15 sm:size-[min(132px,13dvh)]"
            >
              <circle cx="32" cy="24" r="12" fill="currentColor" />
              <path d="M8 62c0-13 11-22 24-22s24 9 24 22z" fill="currentColor" />
            </svg>
            <div>
              <p className="font-display text-[20px] tracking-tight sm:mt-5 sm:text-[26px] lg:text-[34px]">
                {p.name}
              </p>
              <p className="mt-0.5 text-[13px] font-bold opacity-75 sm:mt-2.5 lg:text-base">
                {p.field}
              </p>
              <p className="text-[13px] opacity-60 sm:mt-1 lg:text-base">{p.email}</p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Join() {
  return (
    <section
      id="join"
      data-nav="join"
      className={cx(SLIDE_FRAME, "bg-grad-brand text-white")}
    >
      <Lion
        faint
        className="absolute z-0 right-4 bottom-[76px] w-[min(230px,56vw)] md:right-10 md:bottom-[100px] md:w-[min(340px,30vw)] xl:right-8 xl:bottom-6 xl:w-[min(360px,24vw)] 2xl:right-12 2xl:w-[min(460px,28vw)]"
      />
      <SlideFit className="relative z-10 mx-auto w-full max-w-[1296px]">
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">REGISTER</p>
        <h2
          className="font-display mt-[min(16px,2dvh)] max-w-4xl leading-[1.02] tracking-tight"
          style={{ fontSize: "clamp(2rem, min(6vw, 10dvh), 5.5rem)" }}
        >
          {JOIN.title}
        </h2>
        <p className="mt-[min(28px,3dvh)] max-w-[660px] text-[15px] leading-[1.6] opacity-80 sm:text-[21px] sm:leading-[1.65]">
          {JOIN.lede}
        </p>

        <div className="mt-[min(36px,3.5dvh)] flex flex-col gap-2.5 sm:flex-row sm:gap-3.5">
          <Link
            href="/self-check"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-10 text-[15px] font-bold text-brand-600 transition-opacity hover:opacity-90 sm:h-14 lg:h-[60px] lg:text-[17px]"
          >
            자가진단 시작하기
          </Link>
          <Link
            href="/team"
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/40 px-10 text-[15px] font-bold transition-colors hover:bg-white/10 sm:h-14 lg:h-[60px] lg:text-[17px]"
          >
            팀 등록하기
          </Link>
        </div>

        <hr className="mt-[min(64px,5dvh)] h-0.5 border-0 bg-current opacity-20" />

        <div className="mt-[min(20px,2.4dvh)] flex flex-col gap-1 text-[13px] opacity-60 sm:flex-row sm:gap-14 lg:text-[15px]">
          {JOIN.footer.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </SlideFit>
    </section>
  );
}
