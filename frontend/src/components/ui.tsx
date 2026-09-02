import type { ReactNode } from "react";
import type { Track } from "@/lib/types";
import { TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";

/** 클래스 이름을 조건부로 합친다. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---- 레이아웃 ----

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx("mx-auto w-full max-w-5xl px-5 py-16 sm:py-20", className)}>
      {(eyebrow || title || description) && (
        <header className="mb-10">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-crimson-600">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          )}
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
              {description}
            </p>
          )}
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
    <Tag className={cx("surface rounded-xl p-5", className)}>{children}</Tag>
  );
}

// ---- 트랙 표시 ----

const TRACK_STYLES: Record<Track, { badge: string; accent: string; ring: string }> = {
  SPARK: {
    badge: "bg-spark-soft text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  SPRINT: {
    badge: "bg-sprint-soft text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    accent: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
  },
  SUMMIT: {
    badge: "bg-summit-soft text-violet-900 dark:bg-violet-950 dark:text-violet-200",
    accent: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/30",
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
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TRACK_STYLES[track].badge,
        className,
      )}
    >
      {TRACK_LABEL[track]}
      {showTagline && (
        <span className="font-normal opacity-70">{TRACK_TAGLINE[track]}</span>
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
    neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
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
    error:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("rounded-lg border px-4 py-3 text-sm", tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
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
    <div className="surface rounded-xl px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-14">
      <span className="size-4 animate-spin rounded-full border-2 border-crimson-500 border-t-transparent" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
