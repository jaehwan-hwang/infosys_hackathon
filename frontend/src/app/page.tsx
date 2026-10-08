import Link from "next/link";
import { LandingAccountLink } from "@/components/landing-account-link";
import { LandingNav } from "@/components/landing-nav";
import { SlideFit } from "@/components/slide-fit";
import { TrackJumpList } from "@/components/track-jump";
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
    { num: "02", name: "SPRINT", sub: "기초 개발 · 1, 2일차" },
    { num: "03", name: "SUMMIT", sub: "완성형 개발 · 1, 2일차" },
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
      { label: "평가", values: ["교수 평가 40%", "참가자 투표 60%"] },
      { label: "제출 마감", values: ["11월 8일 2일차 18:00", "마감 직후 심사 시작"] },
    ],
    tags: ["해커톤", "교수 평가", "개발 완성도"],
  },
] as const;

/**
 * DAY 1·2 진행 순서는 같다. 그날 결과물을 내는 트랙만 다르므로,
 * 제출 마감 줄에는 어느 트랙이 내는 마감인지 트랙 이름을 함께 적는다.
 */
const dayRows = (tracks: string, submitAt: string, presentAt: string) => [
  { time: "10:00", label: "시작", hi: false },
  { time: "13:00", label: "점심 식사", hi: false },
  { time: submitAt, label: `${tracks} 결과물 제출 마감 및 저녁 식사`, hi: true },
  { time: presentAt, label: "발표 및 투표", hi: false },
  { time: "21:00", label: "시상", hi: true },
  { time: "22:00", label: "마무리", hi: false },
];

const DAYS = [
  {
    title: "DAY 1",
    kicker: "SPARK 트랙",
    lede: "Spark 트랙은 1일차에만 진행되는 별도 트랙입니다. 1일차 결과물은 Spark 트랙만 제출합니다.",
    rows: dayRows("SPARK", "19:00", "20:00"),
  },
  {
    title: "DAY 2",
    kicker: "SPRINT · SUMMIT 트랙",
    lede: "Sprint와 Summit 트랙은 1, 2일차 일정으로 진행됩니다. 2일차 결과물은 두 트랙이 함께 제출합니다.",
    rows: dayRows("SPRINT · SUMMIT", "18:00", "19:00"),
  },
] as const;

/**
 * 심사위원. 세 번째 자리는 아직 섭외 중이라 비워 둔다.
 * 전공 분야는 트랙 슬라이드의 태그와 같은 모양으로 늘어놓는다.
 */
const PROFESSORS = [
  {
    name: "이욱",
    email: "ooklee@hanyang.ac.kr",
    fields: [
      "정보시스템관리",
      "정보시스템과 정보기술분석",
      "정치정보시스템",
      "전자민주주의",
      "해방이론과 정보기술",
    ],
  },
  {
    name: "박현석",
    email: "hp@hanyang.ac.kr",
    fields: [
      "기술경영",
      "기술혁신",
      "제품-서비스 시스템",
      "엔지니어링 디자인",
      "특허분석 방법론",
    ],
  },
  {
    name: "김은찬",
    email: "eckim@hanyang.ac.kr",
    fields: [
      "인공지능",
      "데이터 인텔리전스",
      "비즈니스 인텔리전스",
      "지능형 시스템",
      "다학제적 융합 연구",
    ],
  },
] as const;

/**
 * 트랙별 상금. 시상 등수는 Track 열거형이 쥔 awardCount와 같아야 한다 —
 * Spark는 1등만, Sprint와 Summit은 3등까지다.
 */
const PRIZES = [
  {
    track: "Spark",
    rows: [{ rank: "1등", amount: "20만원" }],
  },
  {
    track: "Sprint",
    rows: [
      { rank: "1등", amount: "30만원" },
      { rank: "2등", amount: "15만원" },
      { rank: "3등", amount: "10만원" },
    ],
  },
  {
    track: "Summit",
    rows: [
      { rank: "1등", amount: "40만원" },
      { rank: "2등", amount: "20만원" },
      { rank: "3등", amount: "10만원" },
    ],
  },
] as const;

const JOIN = {
  title: "어느 트랙에 참가해야 할까요",
  lede: "SPARK, SPRINT, SUMMIT 중 무엇에 참가해야 할지 몇 가지 설문을 통해 확인할 수 있습니다.",
  footer: ["한양대학교 정보시스템학과 학생회", "참가 자격 · 정보시스템학과 학생"],
  contact: {
    label: "문의 · 오픈채팅",
    href: "https://open.kakao.com/o/si2uNnfi",
  },
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
        <Prizes />
        <Join />
      </div>
      <LandingAccountLink />
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
  slide,
  inverted,
  children,
}: {
  id?: string;
  nav: string;
  /** Three Tracks 목록에서 눌러 넘어올 수 있게 붙이는 표식 */
  slide?: string;
  inverted: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-nav={nav}
      data-slide={slide}
      className={cx(
        SLIDE_FRAME,
        // 디자인 파일의 두 색: 흰 바탕 + 검정 글씨 ↔ 파란 그라데이션 + 흰 글씨
        // 어두운 테마에서 글씨를 검정으로 두면 어두운 바탕에 묻혀 읽히지 않는다
        inverted ? "bg-grad-brand text-white" : "bg-[var(--bg)] text-[var(--text)]",
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
  // 색은 globals.css가 쥔다. 어두운 테마에서는 두 겹을 뒤집어야 읽히기 때문이다.
  const tint = gradient ? "hero-ink-base" : "hero-ink-circle";

  return (
    <div className="w-full">
      <p
        className={cx("font-hero font-bold leading-none tracking-[-0.01em]", tint)}
        style={{ fontSize: "min(2.8cqw, 7dvh)" }}
      >
        {EYEBROW}
      </p>

      {/* 첫 줄은 단의 68%쯤에서 끝나고, 남는 오른쪽을 사자가 채운다 (디자인 그대로) */}
      <div
        className="font-hero-display mt-[0.6cqw] leading-[0.77] tracking-[-0.03em]"
        style={{ fontSize: HEADLINE_SIZE }}
      >
        <p className={cx("whitespace-nowrap", tint)}>INFOSYS</p>
        <p className={cx("whitespace-nowrap", tint)}>HACKATHON</p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="about"
      data-nav="about"
      className={cx(SLIDE_BOX, SLIDE_PAD, HERO_PAD_TOP, "bg-[var(--bg)] text-[var(--text)]")}
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
            Inter는 같은 폭에서 글자가 더 낮으므로, 단 너비가 아니라 제목 크기를 기준으로 맞춘다.
            검정 사자는 어두운 테마에서 묻히므로 그때는 흰 사자로 바꿔 끼운다. */}
        <Lion
          tone="black"
          className="absolute right-[7.9cqw] top-[3.4cqw] w-[17.2cqw] dark:hidden"
        />
        <Lion className="absolute right-[7.9cqw] top-[3.4cqw] hidden w-[17.2cqw] dark:block" />
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

      <TrackJumpList items={TRACKS_INTRO.items} />
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
    <Slide nav="tracks" slide={track.name} inverted={inverted}>
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

      {/* 네모 칸 세 개를 같은 간격·같은 높이로. 성함 → 이메일 → 전공 분야 태그 순. */}
      <div className="mt-[min(44px,4dvh)] grid gap-3 sm:grid-cols-3 sm:gap-6 lg:gap-10">
        {PROFESSORS.map((p, i) => (
          <div
            key={i}
            className="rounded-2xl border-2 border-current px-5 py-4 sm:rounded-3xl sm:px-6 sm:py-[min(28px,3dvh)] lg:min-h-[min(360px,38dvh)]"
          >
            {p.name ? (
              <>
                <p className="font-display text-[22px] tracking-tight sm:text-[26px] lg:text-[34px]">
                  {p.name}
                </p>
                <p className="mt-1 text-[13px] opacity-60 lg:text-[15px]">{p.email}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                  {p.fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full border-2 border-current/35 px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 lg:text-[13px]"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              // 비어 있는 칸은 가운데에 안내만 둔다. 이름이 들어간 칸과 달리 읽을 것이 한 줄뿐이다.
              <div className="flex h-full items-center justify-center py-6 text-center">
                <p className="text-[14px] leading-relaxed opacity-45 lg:text-[16px]">
                  심사 교수님은 추후 변동되거나 추가될 수 있습니다.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-[min(20px,2.4dvh)] text-center text-[13px] opacity-45 lg:text-[15px]">
        심사 교수님은 추후 변동되거나 추가될 수 있습니다.
      </p>
    </Slide>
  );
}

/**
 * 상금. 교수 슬라이드가 흰 바탕이므로 이 장은 파란 바탕 차례다.
 *
 * 세 트랙을 가로로 나란히 둔다. 트랙 이름과 금액 사이에 세로선을 세워, 어느 금액이
 * 어느 트랙 것인지 눈이 한 번에 가른다. Spark는 1등만이라 칸이 비는데, 금액을 세로
 * 가운데에 맞춰 두면 빈자리가 실수로 보이지 않는다.
 */
function Prizes() {
  return (
    <Slide id="prize" nav="prize" inverted={true}>
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">
        PRIZE
      </p>
      <h2
        className="font-display mt-[min(16px,2dvh)] leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(2.4rem, min(7.8vw, 12.5dvh), 7rem)" }}
      >
        상금 안내
      </h2>

      <hr className="mt-[min(48px,4.5dvh)] h-0.5 border-0 bg-current opacity-20" />

      {/* 가로로 긴 상자 셋을 위아래로 쌓는다.
          상자를 세로선으로 정확히 반 나누고(양쪽 flex-1) 트랙 이름과 상금을 각자
          자기 칸 한가운데에 둔다 — 이름 길이가 제각각이라 왼쪽에 붙이면 선까지의
          거리가 상자마다 달라 보인다.
          등수는 한 줄로 늘어놓되, 반 칸에 셋이 들어가지 않는 좁은 화면에서는 접는다. */}
      <ul className="mt-[min(40px,3.6dvh)] space-y-3 sm:space-y-[min(20px,2.2dvh)]">
        {PRIZES.map((p) => (
          <li
            key={p.track}
            className="flex items-stretch rounded-2xl border-2 border-current/45 px-3 py-4 sm:rounded-3xl sm:px-5 sm:py-[min(22px,2.4dvh)] min-h-[min(96px,11dvh)] sm:min-h-[min(124px,14dvh)]"
          >
            <div className="flex flex-1 items-center justify-center">
              <p className="font-display whitespace-nowrap text-[20px] tracking-tight sm:text-[26px] lg:text-[34px]">
                {p.track}
              </p>
            </div>

            {/* 이름과 금액을 가르는 세로선. shrink-0이 없으면 2px가 0으로 눌려 사라진다. */}
            <span
              aria-hidden="true"
              className="w-0.5 shrink-0 self-stretch bg-current opacity-40"
            />

            <dl className="flex flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-5 md:gap-x-7 lg:gap-x-12">
              {p.rows.map((r) => (
                <div key={r.rank} className="flex items-baseline gap-1.5 sm:gap-2 lg:gap-3">
                  <dt className="text-[13px] opacity-70 sm:text-[14px] md:text-[15px] lg:text-[18px]">
                    {r.rank}
                  </dt>
                  <dd className="whitespace-nowrap text-[15px] font-bold tabular-nums sm:text-[17px] md:text-[18px] lg:text-[24px]">
                    {r.amount}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </Slide>
  );
}

function Join() {
  return (
    <section
      id="join"
      data-nav="join"
      // 상금 슬라이드가 파란 바탕이므로 이 장은 흰 바탕 차례다
      className={cx(SLIDE_FRAME, "bg-[var(--bg)] text-[var(--text)]")}
    >
      {/* 흰 바탕에서는 검은 사자라야 보인다. 어두운 테마에서는 반대로 흰 사자를 쓴다. */}
      <Lion
        faint
        tone="black"
        className="absolute z-0 right-4 bottom-[76px] w-[min(230px,56vw)] md:right-10 md:bottom-[100px] md:w-[min(340px,30vw)] xl:right-8 xl:bottom-6 xl:w-[min(360px,24vw)] 2xl:right-12 2xl:w-[min(460px,28vw)] dark:hidden"
      />
      <Lion
        faint
        className="absolute z-0 right-4 bottom-[76px] hidden w-[min(230px,56vw)] md:right-10 md:bottom-[100px] md:w-[min(340px,30vw)] xl:right-8 xl:bottom-6 xl:w-[min(360px,24vw)] 2xl:right-12 2xl:w-[min(460px,28vw)] dark:block"
      />
      <SlideFit className="relative z-10 mx-auto w-full max-w-[1296px]">
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 lg:text-[13px]">REGISTER</p>
        {/* 넓은 화면에서는 한 줄로 편다. max-w를 걸면 폭이 남아도 그 선에서 접히므로 쓰지 않는다.
            좁은 화면에서는 접혀도 된다 — 한 줄을 고집하면 글자가 읽을 수 없이 작아진다. */}
        <h2
          className="font-display mt-[min(16px,2dvh)] leading-[1.02] tracking-tight lg:whitespace-nowrap"
          style={{ fontSize: "clamp(2rem, min(6vw, 10dvh), 5.5rem)" }}
        >
          {JOIN.title}
        </h2>
        {/* 설명은 넓은 화면에서만 한 줄로 편다. 좁은 화면에서 한 줄을 고집하면
            글자가 읽을 수 없을 만큼 작아진다. */}
        <p className="mt-[min(28px,3dvh)] text-[15px] leading-[1.6] opacity-80 sm:text-[19px] sm:leading-[1.65] lg:whitespace-nowrap lg:text-[21px]">
          {JOIN.lede}
        </p>

        <p className="mt-[min(18px,2dvh)] text-[13px] leading-[1.6] opacity-70 sm:text-[15px] lg:whitespace-nowrap lg:text-[16px]">
          신청은 조장 한 명만 하면 됩니다. 팀원은 따로 신청하지 않고, 조장이 적어 넣은 한양대학교
          이메일로 로그인만 하면 자동으로 팀에 연결됩니다.
        </p>

        <div className="mt-[min(36px,3.5dvh)] flex flex-col gap-2.5 sm:flex-row sm:gap-3.5">
          {/* 색을 채운 쪽이 이 화면에서 하길 바라는 일이다 — 자가진단은 트랙을 고르는
              도움말이고, 실제로 해야 하는 것은 팀 등록이다. */}
          <Link
            href="/self-check"
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-current/35 px-10 text-[15px] font-bold transition-colors hover:bg-current/5 sm:h-14 lg:h-[60px] lg:text-[17px]"
          >
            자가진단 시작하기
          </Link>
          <Link
            href="/team"
            className="bg-grad-brand inline-flex h-12 items-center justify-center rounded-full px-10 text-[15px] font-bold text-white transition-opacity hover:opacity-90 sm:h-14 lg:h-[60px] lg:text-[17px]"
          >
            팀 등록하기
          </Link>
        </div>

        <hr className="mt-[min(64px,5dvh)] h-0.5 border-0 bg-current opacity-20" />

        {/* 세 줄을 가로로 펴고 가운데에 모은다. 좁은 화면에서는 접히되,
            접힌 뒤에도 가운데 정렬이라 줄 끝이 들쭉날쭉해 보이지 않는다. */}
        <div className="mt-[min(20px,2.4dvh)] flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5 text-center text-[13px] opacity-60 sm:gap-x-14 lg:gap-x-20 lg:text-[15px]">
          {JOIN.footer.map((f) => (
            <span key={f}>{f}</span>
          ))}
          <a
            href={JOIN.contact.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition-opacity hover:opacity-100"
          >
            {JOIN.contact.label}
          </a>
        </div>
      </SlideFit>
    </section>
  );
}
