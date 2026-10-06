import type { ReactNode } from "react";
import type { Track } from "@/lib/types";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";

/** 클래스 이름을 조건부로 합친다. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * 하위 페이지의 생김새는 홈과 같은 규칙을 따른다.
 *
 *   - 바탕은 흰색, 글씨는 검정. 회색 면으로 영역을 나누지 않는다.
 *   - 영역은 2px 선과 큰 모서리로 구분한다 (홈 교수 카드·태그와 같은 방식)
 *   - 제목은 RiaSans Bold(font-display), 위에 자간 넓은 작은 영문 머리말
 *   - 누르는 것은 전부 알약 모양. 강조는 홈의 파란 그라데이션 한 가지뿐이다.
 *
 * 흔한 카드 UI를 쓰면 다른 학과 행사 사이트와 구분이 되지 않는다는 지적이 있어,
 * 색과 모양을 홈 디자인 쪽으로 모두 끌어왔다.
 */

/** 2px 선으로 둘러싼 면. 카드·입력·알약이 모두 같은 선 색을 쓴다. */
export const HAIRLINE = "border-2 border-current/15";

/**
 * 이름 옆에 붙는 작은 태그의 공통 치수.
 *
 * 트랙 배지와 상태 배지가 나란히 놓이는 자리가 많아, 크기가 다르면 줄이 울퉁불퉁해진다.
 * 테두리 두께까지 같아야 높이가 맞으므로 채운 배지에도 투명한 선을 둔다.
 */
export const TAG_SIZE =
  "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 text-xs font-bold";

/** 강조 면 — 홈의 파란 그라데이션 */
export const FILLED = "bg-grad-brand text-white";

// ---- 레이아웃 ----

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  nested = false,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** 다른 Section 안에 들어가는 묶음. 제목을 한 단 낮추고 바깥 여백을 뺀다. */
  nested?: boolean;
}) {
  return (
    <section
      id={id}
      className={cx(
        nested ? "w-full" : "mx-auto w-full max-w-5xl px-5 py-14 sm:py-20",
        className,
      )}
    >
      {(eyebrow || title || description) && (
        <header className={nested ? "mb-6" : "mb-10"}>
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">
              {eyebrow}
            </p>
          )}
          {title &&
            (nested ? (
              <h3 className="font-display mt-2 text-[26px] leading-tight tracking-[-0.02em] sm:text-[32px]">
                {title}
              </h3>
            ) : (
              <h1 className="font-display mt-3 text-[clamp(2.1rem,8vw,3.5rem)] leading-[0.95] tracking-[-0.03em]">
                {title}
              </h1>
            ))}
          {description && (
            <p
              className={cx(
                "max-w-2xl leading-relaxed text-muted",
                nested ? "mt-2.5 text-sm" : "mt-4 text-[15px] sm:text-[17px]",
              )}
            >
              {description}
            </p>
          )}
          {!nested && <hr className="mt-8 h-0.5 border-0 bg-current opacity-15" />}
        </header>
      )}
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <Tag className={cx("rounded-2xl bg-[var(--bg)] p-5 sm:p-6", HAIRLINE, className)}>
      {children}
    </Tag>
  );
}

// ---- 탭·필터 ----

/**
 * 알약 묶음. 탭과 필터가 같은 모양을 쓴다.
 * 고른 칸만 파란 그라데이션으로 채우고, 나머지는 선만 둔다.
 */
export function PillTabs<T extends string>({
  label,
  items,
  value,
  onChange,
  size = "md",
}: {
  label: string;
  items: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              "rounded-full font-bold transition-colors",
              size === "sm" ? "h-9 px-4 text-[13px]" : "h-11 px-6 text-sm",
              active ? FILLED : cx(HAIRLINE, "text-muted hover:text-[var(--text)]"),
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** 트랙 필터. "전체"를 포함한 네 칸으로, 팀 목록과 운영진 화면이 함께 쓴다. */
export const TRACK_FILTER_ITEMS = [
  { value: "ALL", label: "전체" },
  { value: "SPARK", label: TRACK_LABEL.SPARK },
  { value: "SPRINT", label: TRACK_LABEL.SPRINT },
  { value: "SUMMIT", label: TRACK_LABEL.SUMMIT },
] as const;

export type TrackFilterValue = Track | "ALL";

export function TrackFilter({
  value,
  onChange,
  label = "트랙으로 걸러보기",
}: {
  value: TrackFilterValue;
  onChange: (value: TrackFilterValue) => void;
  label?: string;
}) {
  return (
    <PillTabs<TrackFilterValue>
      label={label}
      items={TRACK_FILTER_ITEMS}
      value={value}
      onChange={onChange}
      size="sm"
    />
  );
}

// ---- 트랙 표시 ----

/**
 * 트랙 표시는 파랑 한 계열 안에서 농도로만 구분한다.
 * 홈이 흰색·파란색 반전 단색 체계라, 트랙마다 다른 색을 쓰면 규칙이 무너진다.
 */
const TRACK_STYLES: Record<Track, { badge: string; accent: string; ring: string }> = {
  SPARK: {
    badge: "border-transparent bg-grad-brand text-white",
    accent: "text-brand-500 dark:text-brand-300",
    ring: "ring-2 ring-brand-400/40",
  },
  SPRINT: {
    badge: "border-transparent bg-grad-brand text-white",
    accent: "text-brand-600 dark:text-brand-300",
    ring: "ring-2 ring-brand-500/50",
  },
  SUMMIT: {
    badge: "border-transparent bg-grad-brand text-white",
    accent: "text-brand-700 dark:text-brand-200",
    ring: "ring-2 ring-brand-600/60",
  },
};

export function trackStyle(track: Track) {
  return TRACK_STYLES[track];
}

export function TrackBadge({
  track,
  showTagline = false,
  className,
}: {
  track: Track;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={cx(TAG_SIZE, TRACK_STYLES[track].badge, className)}>
      {TRACK_LABEL[track]}
      {showTagline && (
        <span className="font-medium opacity-70">{TRACK_TAGLINE[track]}</span>
      )}
    </span>
  );
}

// ---- 상태 표시 ----

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "border-current/20 text-muted",
    success: "border-emerald-500/50 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/50 text-amber-700 dark:text-amber-300",
    danger: "border-red-500/50 text-red-700 dark:text-red-300",
    info: "border-brand-500/40 text-brand-600 dark:text-brand-300",
  };
  return <span className={cx(TAG_SIZE, tones[tone])}>{children}</span>;
}

/** 실패·주의 안내. 폼 상단에 에러 메시지를 띄울 때 쓴다. */
export function Alert({
  tone = "error",
  title,
  children,
}: {
  tone?: "error" | "warning" | "info" | "success";
  title?: string;
  children?: ReactNode;
}) {
  const tones = {
    error: "border-red-500/40 text-red-800 dark:text-red-200",
    warning: "border-amber-500/50 text-amber-800 dark:text-amber-200",
    info: "border-brand-500/40 text-brand-700 dark:text-brand-200",
    success: "border-emerald-500/50 text-emerald-800 dark:text-emerald-200",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("rounded-2xl border-2 px-5 py-4 text-sm leading-relaxed", tones[tone])}
    >
      {title && <p className="font-bold">{title}</p>}
      {children && <div className={title ? "mt-1.5" : undefined}>{children}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cx("rounded-2xl px-6 py-14 text-center", HAIRLINE)}>
      <p className="font-display text-xl tracking-tight">{title}</p>
      {description && (
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-14">
      <span className="size-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
