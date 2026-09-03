import Link from "next/link";
import { publicApi } from "@/lib/api";
import type { HackathonEvent, Track } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { Countdown } from "@/components/countdown";
import { cx } from "@/components/ui";

// 마감 시각과 개방 상태가 수시로 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

/**
 * 랜딩은 슬라이드 9장으로 이뤄지고, 히어로 다음부터 흰색↔파란색이 한 장마다 반전된다.
 * 색은 파랑 하나뿐이라 트랙 구분은 번호와 타이포그래피가 맡는다.
 */

const HERO_BG =
  "radial-gradient(115% 85% at 20% 32%,#6f97ee 0%,rgba(111,151,238,0) 60%)," +
  "radial-gradient(90% 70% at 96% 4%,#e8f0ff 0%,rgba(232,240,255,0) 55%)," +
  "radial-gradient(130% 105% at 92% 100%,#dcf2fd 0%,rgba(220,242,253,0) 62%)," +
  "linear-gradient(158deg,#a6c0f5 0%,#b5cdf8 40%,#cfe4fa 72%,#dceef9 100%)";

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

export default async function HomePage() {
  let event: HackathonEvent | null = null;
  try {
    event = await publicApi.getEvent();
  } catch {
    // 백엔드가 아직 뜨지 않았어도 소개 내용은 보여준다
  }

  return (
    <>
      <Hero event={event} />
      <ThreeTracks event={event} />
      {TRACKS.map((track, i) => (
        <TrackSlide key={track.name} track={track} inverted={i % 2 === 0} />
      ))}
      {DAYS.map((day, i) => (
        <DaySlide key={day.title} day={day} inverted={i % 2 === 1} first={i === 0} />
      ))}
      <Professors />
      <Join event={event} />
    </>
  );
}

/**
 * 슬라이드 한 장. inverted면 파란 배경에 흰 글씨, 아니면 흰 배경에 파란 글씨.
 * 이 반전이 페이지 전체를 관통하는 규칙이다.
 */
function Slide({
  id,
  inverted,
  children,
  className,
}: {
  id?: string;
  inverted: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cx(
        "relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-20 sm:px-12 lg:px-[72px]",
        inverted ? "bg-brand-600 text-white" : "bg-white text-brand-600",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1296px]">{children}</div>
    </section>
  );
}

function Hero({ event }: { event: HackathonEvent | null }) {
  const nextDeadline = event?.submissionOpen.SPARK
    ? { at: event.sparkSubmitDeadline, label: "Spark 제출 마감까지" }
    : event?.submissionOpen.SPRINT
      ? { at: event.devSubmitDeadline, label: "Sprint · Summit 제출 마감까지" }
      : null;

  return (
    <section
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-24 sm:px-12 lg:px-[72px]"
      style={{ background: HERO_BG, color: "#16308f" }}
    >
      {/* 사자는 배경, 글씨는 항상 그 앞. 프레임 안쪽에 두어 잘리지 않게 한다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lion.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 right-6 z-0 w-[280px] opacity-85 sm:right-12 sm:w-[380px] lg:right-[72px] lg:w-[470px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1296px]">
        <p className="font-display text-lg tracking-tight sm:text-xl">
          한양대학교 정보시스템학과
        </p>

        {/* InfoSys — 대문자 I·S 아래로 nfo·ys를 아래첨자처럼 붙인다 */}
        <p className="font-display mt-2 leading-[1.15] tracking-tight text-brand-600"
          style={{ fontSize: "clamp(3.4rem, 10.4vw, 9.4rem)" }}>
          <span>I</span>
          <span className="inline-block translate-y-[0.28em] text-[0.5em] tracking-tight">
            nfo
          </span>
          <span>S</span>
          <span className="inline-block translate-y-[0.28em] text-[0.5em] tracking-tight">
            ys
          </span>
        </p>

        {/* 해커톤이 중점이므로 HACKATHON이 폭을 채운다 */}
        <p className="font-display mt-3 leading-none tracking-[0.01em] text-brand-600"
          style={{ fontSize: "clamp(1.9rem, 9.6vw, 8.6rem)" }}>
          HACKATHON
        </p>

        {event && nextDeadline?.at && (
          <div className="mt-12 inline-block rounded-2xl bg-white/70 px-6 py-4 backdrop-blur">
            <Countdown
              deadline={nextDeadline.at}
              serverTime={event.serverTime}
              label={nextDeadline.label}
            />
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/self-check"
            className="inline-flex h-12 items-center rounded-full bg-brand-600 px-7 text-[15px] font-bold text-white transition-colors hover:bg-brand-700"
          >
            내 트랙 찾기
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center rounded-full border-2 border-brand-600/40 px-7 text-[15px] font-bold text-brand-700 transition-colors hover:bg-white/50"
          >
            팀 등록하기
          </Link>
        </div>
      </div>
    </section>
  );
}

function ThreeTracks({ event }: { event: HackathonEvent | null }) {
  return (
    <Slide id="tracks" inverted={false}>
      <h2 className="font-display leading-[0.98] tracking-tight"
        style={{ fontSize: "clamp(2.6rem, 7.8vw, 7rem)" }}>
        Three Tracks
      </h2>
      <p className="mt-6 max-w-2xl text-base leading-relaxed opacity-80 sm:text-xl">
        산출물의 완성도 단계에 따라 제출물과 평가 기준이 다른 세 트랙으로 나뉩니다.
      </p>

      <hr className="mt-12 h-0.5 border-0 bg-current opacity-20" />

      <div className="mt-9 grid gap-8 lg:grid-cols-3 lg:gap-14">
        {TRACKS.map((t) => (
          <div key={t.name}>
            <p className="text-[13px] font-bold tracking-[0.2em] opacity-45">{t.num}</p>
            <p className="font-display mt-1 text-[34px] tracking-tight lg:text-[42px]">
              {t.name}
            </p>
            <p className="mt-1 text-[15px] opacity-65 sm:text-[17px]">{t.kicker}</p>
          </div>
        ))}
      </div>

      {event && (
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          <DeadlineRow
            title="Spark 제출 마감"
            at={event.sparkSubmitDeadline}
            open={event.submissionOpen.SPARK}
          />
          <DeadlineRow
            title="Sprint · Summit 제출 마감"
            at={event.devSubmitDeadline}
            open={event.submissionOpen.SPRINT}
          />
        </div>
      )}
    </Slide>
  );
}

function DeadlineRow({
  title,
  at,
  open,
}: {
  title: string;
  at: string | null;
  open: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-current/20 px-5 py-4">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-sm opacity-70">{formatDateTime(at)}</p>
      </div>
      <span
        className={cx(
          "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
          open ? "bg-brand-600 text-white" : "bg-current/10",
        )}
      >
        {open ? "제출 가능" : "마감"}
      </span>
    </div>
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
      <div className="flex items-center gap-5">
        <p className="text-[13px] font-bold tracking-[0.2em] opacity-55 sm:text-[15px]">
          {track.num}
        </p>
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 sm:text-[13px]">
          {track.kicker}
        </p>
      </div>

      <h2 className="font-display mt-4 leading-[0.88] tracking-tight"
        style={{ fontSize: "clamp(2.8rem, 13.6vw, 11.9rem)" }}>
        {track.name}
      </h2>

      <p className="mt-7 max-w-2xl text-base leading-relaxed opacity-80 sm:text-xl">
        {track.lede}
      </p>

      <hr className="mt-11 h-0.5 border-0 bg-current opacity-20" />

      <div className="mt-9 grid gap-7 sm:grid-cols-3 sm:gap-14">
        {track.metas.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-50 sm:text-xs">
              {m.label}
            </p>
            <p className="mt-2 text-[15px] leading-relaxed sm:text-[17px]">
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
        <p className="mt-9 self-start rounded-full border-2 border-current/35 px-5 py-3 text-[13px] font-bold sm:text-[15px]">
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
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 sm:text-[13px]">
        SCHEDULE
      </p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-7 gap-y-1">
        <h2 className="font-display leading-[0.95] tracking-tight"
          style={{ fontSize: "clamp(3.2rem, 9vw, 8.25rem)" }}>
          {day.title}
        </h2>
        <p className="text-[17px] font-bold opacity-60 sm:text-2xl">{day.kicker}</p>
      </div>

      <p className="mt-5 text-[15px] opacity-80 sm:text-xl">{day.lede}</p>

      <div className="mt-10">
        {day.rows.map((r) => (
          <div
            key={r.time + r.label}
            className="flex items-center gap-5 border-b border-current/20 py-3 sm:gap-8 sm:py-4"
          >
            <span className="w-16 shrink-0 text-[15px] font-bold sm:w-24 sm:text-[19px]">
              {r.time}
            </span>
            <span
              className={cx(
                "text-sm leading-snug sm:text-[18px]",
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
      <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 sm:text-[13px]">
        JUDGES
      </p>
      <h2 className="font-display mt-4 leading-[0.98] tracking-tight"
        style={{ fontSize: "clamp(2.6rem, 7.8vw, 7rem)" }}>
        Professor
      </h2>

      <hr className="mt-10 h-0.5 border-0 bg-current opacity-20" />

      {/* 네모 칸 세 개를 같은 간격·같은 높이로 */}
      <div className="mt-11 grid gap-6 sm:grid-cols-3 sm:gap-14">
        {PROFESSORS.map((p, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-3xl border-2 border-current px-7 py-10 text-center sm:min-h-[360px]"
          >
            <svg
              width="132"
              height="132"
              viewBox="0 0 64 64"
              role="img"
              aria-label="사진 자리"
              className="block rounded-full opacity-15"
            >
              <circle cx="32" cy="24" r="12" fill="currentColor" />
              <path d="M8 62c0-13 11-22 24-22s24 9 24 22z" fill="currentColor" />
            </svg>
            <p className="font-display mt-6 text-[28px] tracking-tight sm:text-[34px]">
              {p.name}
            </p>
            <p className="mt-3 text-[15px] font-bold opacity-75 sm:text-base">{p.field}</p>
            <p className="mt-1 text-[15px] opacity-60 sm:text-base">{p.email}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Join({ event }: { event: HackathonEvent | null }) {
  return (
    <Slide id="join" inverted>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lion.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-6 z-0 w-[300px] opacity-[0.09] sm:right-12 sm:w-[420px] lg:right-[72px] lg:w-[520px]"
      />

      <div className="relative z-10">
        <p className="text-[11px] font-bold tracking-[0.22em] opacity-55 sm:text-[13px]">
          JOIN
        </p>
        <h2 className="font-display mt-4 max-w-4xl leading-[1.02] tracking-tight"
          style={{ fontSize: "clamp(2.2rem, 6vw, 5.5rem)" }}>
          어느 트랙에 참가해야 할까요?
        </h2>
        <p className="mt-7 max-w-2xl text-base leading-relaxed opacity-80 sm:text-xl">
          실무 경험이나 수상 이력이 있으면 곧바로 Summit으로, 그렇지 않으면 체크리스트 4개 중
          3개 이상 해당할 때 Summit으로 배정됩니다. 30초면 확인할 수 있습니다.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/self-check"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-[15px] font-bold text-brand-600 transition-opacity hover:opacity-90 sm:text-[17px]"
          >
            자가진단 시작하기
          </Link>
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 px-10 text-[15px] font-bold transition-colors hover:bg-white/10 sm:text-[17px]"
          >
            팀 등록하기
          </Link>
        </div>

        <hr className="mt-16 h-0.5 border-0 bg-current opacity-20" />

        <div className="mt-6 flex flex-col gap-1.5 text-[13px] opacity-60 sm:flex-row sm:gap-14 sm:text-[15px]">
          <span>한양대학교 정보시스템학과 학생회</span>
          <span>참가 자격 · @hanyang.ac.kr 계정</span>
          <span>
            참가 신청 ·{" "}
            {event?.registerEndsAt
              ? `${formatDate(event.registerStartsAt)} ~ ${formatDate(event.registerEndsAt)}`
              : "추후 공지"}
          </span>
        </div>
      </div>
    </Slide>
  );
}
