import Link from "next/link";
import { publicApi } from "@/lib/api";
import type { HackathonEvent, Track } from "@/lib/types";
import {
  TRACK_EVALUATION,
  TRACK_GOAL,
  TRACK_LABEL,
  TRACK_TAGLINE,
  SUBMISSION_FIELDS,
} from "@/lib/track-rules";
import { formatDate, formatDateTime } from "@/lib/format";
import { Card, Section, TrackBadge, trackStyle, cx } from "@/components/ui";
import { Countdown } from "@/components/countdown";

// 마감 시각과 개방 상태가 수시로 바뀌므로 캐시하지 않는다.
export const dynamic = "force-dynamic";

const TRACKS: Track[] = ["SPARK", "SPRINT", "SUMMIT"];

/** 기획서 3장의 당일 진행표 */
const TIMELINE = [
  {
    day: 1,
    title: "1일차 — Spark 트랙",
    note: "Spark 트랙은 1일차에만 진행되는 별도 트랙입니다.",
    items: [
      { time: "10:00", label: "시작" },
      { time: "13:00", label: "점심 식사" },
      { time: "~19:00", label: "Spark 트랙 산출물 제출 마감", highlight: true },
      { time: "19:00", label: "저녁 식사 + 발표 및 학생 투표" },
      { time: "21:00", label: "Spark 트랙 시상" },
      { time: "22:00", label: "해산" },
    ],
  },
  {
    day: 2,
    title: "2일차 — Sprint / Summit 트랙",
    note: null,
    items: [
      { time: "10:00", label: "시작" },
      { time: "13:00", label: "점심 식사" },
      { time: "~18:00", label: "Sprint · Summit 제출 마감 (직후 심사 시작)", highlight: true },
      { time: "18:00", label: "저녁 식사" },
      { time: "19:00", label: "Sprint 프레젠테이션" },
      { time: "20:00", label: "Summit 프레젠테이션" },
      { time: "21:00", label: "평가 및 시상" },
      { time: "22:00", label: "해산" },
    ],
  },
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
      <Overview event={event} />
      <Tracks />
      <SelfCheckTeaser />
      <Timeline />
      <Submissions />
      <Evaluation />
      <Contact event={event} />
    </>
  );
}

function Hero({ event }: { event: HackathonEvent | null }) {
  const nextDeadline = event?.submissionOpen.SPARK
    ? { at: event.sparkSubmitDeadline, label: "Spark 제출 마감까지" }
    : event?.submissionOpen.SPRINT
      ? { at: event.devSubmitDeadline, label: "Sprint · Summit 제출 마감까지" }
      : null;

  return (
    <div className="relative overflow-hidden border-b border-[var(--border)]">
      {/* 배경 그라디언트. 장식이므로 스크린리더에서 감춘다 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-crimson-50 via-transparent to-transparent dark:from-crimson-950/40"
      />
      <div className="relative mx-auto w-full max-w-5xl px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold text-crimson-600">
          한양대학교 정보시스템학과 학생회
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
          {event?.title ?? "정보시스템학과 해커톤"}
        </h1>
        {event?.theme && (
          <p className="mt-4 text-lg text-muted sm:text-xl">{event.theme}</p>
        )}
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">
          아이디어부터 배포된 서비스까지. 실력에 맞는 트랙을 골라 2일 동안 하나의 문제를
          끝까지 풀어봅니다. Spark·Sprint·Summit 세 트랙으로 나뉘어 진행됩니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/self-check"
            className="inline-flex h-12 items-center rounded-lg bg-crimson-600 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-crimson-700"
          >
            내 트랙 찾기
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center rounded-lg border border-[var(--border-strong)] px-6 text-[15px] font-semibold transition-colors hover:bg-[var(--bg-muted)]"
          >
            팀 등록하기
          </Link>
        </div>

        {event && nextDeadline?.at && (
          <div className="mt-12 inline-block rounded-xl border border-[var(--border)] bg-[var(--bg)]/80 px-6 py-4 backdrop-blur">
            <Countdown
              deadline={nextDeadline.at}
              serverTime={event.serverTime}
              label={nextDeadline.label}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Overview({ event }: { event: HackathonEvent | null }) {
  const facts = [
    { label: "주최", value: "정보시스템학과 학생회" },
    { label: "진행 기간", value: "2일 (1일차 / 2일차)" },
    {
      label: "참가 신청",
      value: event?.registerEndsAt
        ? `${formatDate(event.registerStartsAt)} ~ ${formatDate(event.registerEndsAt)}`
        : "추후 공지",
    },
    { label: "장소", value: event?.location ?? "추후 공지" },
    {
      label: "팀 인원",
      value: event ? `${event.minTeamSize}~${event.maxTeamSize}명` : "추후 공지",
    },
    { label: "참가 자격", value: "한양대학교 이메일(@hanyang.ac.kr) 보유자" },
  ];

  return (
    <Section
      id="overview"
      eyebrow="Overview"
      title="한눈에 보는 해커톤"
      description="세 개의 트랙, 두 개의 일정. 자신의 개발 경험에 맞는 트랙에서 겨룹니다."
    >
      <dl className="grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-[var(--bg)] p-5">
            <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
              {fact.label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {event && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DeadlineCard
            title="Spark 제출 마감"
            at={event.sparkSubmitDeadline}
            open={event.submissionOpen.SPARK}
          />
          <DeadlineCard
            title="Sprint · Summit 제출 마감"
            at={event.devSubmitDeadline}
            open={event.submissionOpen.SPRINT}
          />
        </div>
      )}
    </Section>
  );
}

function DeadlineCard({
  title,
  at,
  open,
}: {
  title: string;
  at: string | null;
  open: boolean;
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{formatDateTime(at)}</p>
      </div>
      <span
        className={cx(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
          open
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        )}
      >
        {open ? "제출 가능" : "마감"}
      </span>
    </Card>
  );
}

function Tracks() {
  return (
    <Section
      id="tracks"
      eyebrow="Tracks"
      title="세 개의 트랙"
      description="산출물의 완성도 단계에 따라 트랙이 나뉘고, 트랙마다 제출물과 평가 기준이 다릅니다."
      className="border-t border-[var(--border)]"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {TRACKS.map((track) => {
          const style = trackStyle(track);
          const required = SUBMISSION_FIELDS[track].filter((f) => f.required);

          return (
            <Card key={track} as="article" className={cx("flex flex-col ring-1", style.ring)}>
              <div className="flex items-center justify-between">
                <TrackBadge track={track} />
                <span className="text-xs font-medium text-subtle">
                  {track === "SPARK" ? "1일차" : "2일차"}
                </span>
              </div>

              <h3 className={cx("mt-4 text-xl font-bold", style.accent)}>
                {TRACK_LABEL[track]}
                <span className="ml-2 text-sm font-medium text-muted">
                  {TRACK_TAGLINE[track]}
                </span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{TRACK_GOAL[track]}</p>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  필수 제출물
                </p>
                <ul className="mt-2 space-y-1.5">
                  {required.map((field) => (
                    <li key={field.field} className="flex gap-2 text-sm">
                      <span aria-hidden="true" className={style.accent}>
                        ·
                      </span>
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto border-t border-[var(--border)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  평가
                </p>
                <p className="mt-1.5 text-sm font-medium">{TRACK_EVALUATION[track]}</p>
              </div>

              {track === "SPARK" && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  구현된 코드·구동 프로그램 제출은 <strong>전면 금지</strong>됩니다. 순수
                  기획과 UX 논리로만 평가합니다.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

function SelfCheckTeaser() {
  return (
    <Section className="border-t border-[var(--border)]">
      <div className="rounded-2xl bg-gradient-to-br from-crimson-600 to-crimson-800 px-6 py-10 text-white sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson-200">
          Track Assignment
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          어느 트랙에 참가해야 할까요?
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-crimson-50">
          Sprint와 Summit 중 어디에 배정될지는 자가진단으로 정해집니다. 실무 경험이나 수상
          이력이 있으면 곧바로 Summit으로, 그렇지 않으면 체크리스트 4개 중 3개 이상 해당할 때
          Summit으로 배정됩니다. 30초면 확인할 수 있습니다.
        </p>
        <Link
          href="/self-check"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-bold text-crimson-700 transition-colors hover:bg-crimson-50"
        >
          자가진단 시작하기
        </Link>
      </div>
    </Section>
  );
}

function Timeline() {
  return (
    <Section
      id="timeline"
      eyebrow="Schedule"
      title="당일 진행 일정"
      className="border-t border-[var(--border)]"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {TIMELINE.map((day) => (
          <Card key={day.day} as="article">
            <h3 className="font-bold">{day.title}</h3>
            {day.note && <p className="mt-1.5 text-xs text-subtle">{day.note}</p>}

            <ol className="mt-5 space-y-0">
              {day.items.map((item, index) => (
                <li key={index} className="flex gap-4 pb-4 last:pb-0">
                  {/* 시간축 */}
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        item.highlight ? "bg-crimson-600" : "bg-[var(--border-strong)]",
                      )}
                    />
                    {index < day.items.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="mt-1 w-px flex-1 bg-[var(--border)]"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="w-16 shrink-0 text-sm font-semibold tabular-nums">
                      {item.time}
                    </span>
                    <span
                      className={cx(
                        "text-sm",
                        item.highlight ? "font-semibold text-crimson-700 dark:text-crimson-400" : "text-muted",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function Submissions() {
  return (
    <Section
      id="submissions"
      eyebrow="Deliverables"
      title="트랙별 제출 항목"
      description="제출 폼은 팀에 배정된 트랙에 맞춰 자동으로 바뀝니다. 마감 시각이 지나면 잠깁니다."
      className="border-t border-[var(--border)]"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">트랙별 제출 항목 비교표</caption>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <th scope="col" className="py-3 pr-4 text-left font-semibold">
                항목
              </th>
              {TRACKS.map((track) => (
                <th key={track} scope="col" className="px-3 py-3 text-center font-semibold">
                  {TRACK_LABEL[track]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_DELIVERABLES.map((row) => (
              <tr key={row.label} className="border-b border-[var(--border)]">
                <th scope="row" className="py-3 pr-4 text-left font-normal">
                  {row.label}
                </th>
                {TRACKS.map((track) => (
                  <td key={track} className="px-3 py-3 text-center">
                    <DeliverableMark value={row[track]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

type Mark = "required" | "optional" | "forbidden" | "none";

const ALL_DELIVERABLES: {
  label: string;
  SPARK: Mark;
  SPRINT: Mark;
  SUMMIT: Mark;
}[] = [
  { label: "서비스 기획서", SPARK: "required", SPRINT: "optional", SUMMIT: "optional" },
  { label: "프로토타입 (목업·와이어프레임)", SPARK: "required", SPRINT: "none", SUMMIT: "none" },
  { label: "소스코드", SPARK: "forbidden", SPRINT: "required", SUMMIT: "required" },
  { label: "배포 링크", SPARK: "forbidden", SPRINT: "none", SUMMIT: "required" },
  { label: "시스템 아키텍처 다이어그램", SPARK: "none", SPRINT: "none", SUMMIT: "required" },
  { label: "기술 명세서", SPARK: "none", SPRINT: "none", SUMMIT: "required" },
  { label: "발표자료", SPARK: "optional", SPRINT: "required", SUMMIT: "required" },
  { label: "핵심 기능 시연", SPARK: "none", SPRINT: "required", SUMMIT: "optional" },
];

function DeliverableMark({ value }: { value: Mark }) {
  const config = {
    required: { symbol: "●", label: "필수", className: "text-crimson-600" },
    optional: { symbol: "○", label: "선택", className: "text-muted" },
    forbidden: { symbol: "✕", label: "제출 금지", className: "text-red-600 font-bold" },
    none: { symbol: "–", label: "해당 없음", className: "text-subtle" },
  }[value];

  return (
    <span className={config.className}>
      <span aria-hidden="true">{config.symbol}</span>
      <span className="sr-only">{config.label}</span>
    </span>
  );
}

function Evaluation() {
  return (
    <Section
      id="evaluation"
      eyebrow="Judging"
      title="평가 방식"
      description="발표가 끝나면 각자의 기기에서 평가 페이지에 접속해 채점합니다."
      className="border-t border-[var(--border)]"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {TRACKS.map((track) => (
          <Card key={track}>
            <TrackBadge track={track} />
            <p className="mt-3 text-sm font-semibold">{TRACK_EVALUATION[track]}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {track === "SUMMIT"
                ? "교수 심사위원이 별도 페이지에서 채점하고, 학생 투표 결과와 가중 합산합니다."
                : "발표 종료 직후 참가 학생들이 개인 기기에서 채점합니다."}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <h3 className="text-sm font-semibold">공정성 장치</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-crimson-600">
              ·
            </span>
            자신이 속한 팀은 평가 목록에 아예 표시되지 않고, 서버에서도 차단됩니다.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-crimson-600">
              ·
            </span>
            한 사람이 같은 팀을 여러 번 평가해도 마지막 한 번만 반영됩니다.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-crimson-600">
              ·
            </span>
            학생 투표는 본인이 참가한 트랙 안에서만 가능합니다.
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-crimson-600">
              ·
            </span>
            순위와 점수는 시상식 발표 전까지 비공개로 유지됩니다.
          </li>
        </ul>
      </Card>
    </Section>
  );
}

function Contact({ event }: { event: HackathonEvent | null }) {
  return (
    <Section className="border-t border-[var(--border)]">
      <Card className="text-center">
        <h2 className="text-lg font-bold">문의</h2>
        <p className="mt-2 text-sm text-muted">
          참가 관련 문의는 학생회로 연락해 주세요.
        </p>
        {event?.contactUrl ? (
          <a
            href={event.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-semibold hover:bg-[var(--bg-muted)]"
          >
            문의하기
          </a>
        ) : (
          <p className="mt-4 text-sm text-subtle">문의처는 추후 공지됩니다.</p>
        )}
      </Card>
    </Section>
  );
}
