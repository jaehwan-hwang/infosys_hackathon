"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { FILLED, HAIRLINE, cx } from "./ui";

// ---- 버튼 ----

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * 버튼 모양은 홈과 같다 — 알약, 강조는 파란 그라데이션 한 가지뿐.
 * 홈의 "자가진단 시작하기"(채운 알약)와 "팀 등록하기"(선만 있는 알약)가 그대로 1차·2차다.
 */
const BUTTON_VARIANTS = {
  primary: `${FILLED} hover:opacity-90`,
  secondary: `${HAIRLINE} bg-transparent hover:bg-current/5`,
  ghost: "hover:bg-current/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const BUTTON_SIZES = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-opacity",
        "disabled:cursor-not-allowed disabled:opacity-40",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    >
      {loading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

// ---- 입력 ----

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
};

/**
 * 라벨·힌트·에러를 한 묶음으로 관리한다.
 * 스크린리더가 힌트와 에러를 읽도록 aria-describedby를 자동으로 연결한다.
 */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
        {required && <span className="ml-1 text-brand-600">*</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-subtle">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children(id, describedBy)}</div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL_CLASS =
  `w-full rounded-xl ${HAIRLINE} bg-[var(--bg)] px-4 py-2.5 text-sm ` +
  "placeholder:text-[var(--text-subtle)] focus:border-brand-600 focus:outline-none " +
  "disabled:opacity-50";

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_CLASS, invalid && "border-red-500", className)}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_CLASS, "min-h-24 resize-y", invalid && "border-red-500", className)}
    />
  );
}

/**
 * 체크박스 카드. 자가진단처럼 설명이 함께 붙는 항목에 쓴다.
 * 카드 전체가 클릭 영역이라 모바일에서 누르기 쉽다.
 */
export function CheckCard({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors",
        checked
          ? "border-brand-600 bg-brand-600/5"
          : "border-current/15 hover:bg-current/5",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-brand-600"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * 점수 선택 라디오 그룹.
 *
 * 평가 화면은 대부분 휴대폰에서 쓰이므로, 드롭다운 대신 한 번에 누를 수 있는
 * 큼직한 버튼 줄로 만든다.
 */
export function ScoreSelector({
  name,
  value,
  maxScore,
  onChange,
  readOnly = false,
}: {
  name: string;
  value: number | null;
  maxScore: number;
  onChange: (score: number) => void;
  /** 이미 제출한 평가처럼 더는 고칠 수 없는 경우 */
  readOnly?: boolean;
}) {
  const options = Array.from({ length: maxScore + 1 }, (_, i) => i);

  return (
    <div role="radiogroup" aria-label={`${name} 점수`} className="flex flex-wrap gap-1.5">
      {options.map((score) => {
        const selected = value === score;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={readOnly}
            onClick={() => onChange(score)}
            className={cx(
              "h-11 min-w-11 rounded-full border-2 text-sm font-bold transition-colors",
              selected
                ? "border-transparent bg-grad-brand text-white"
                : "border-current/15",
              readOnly
                ? "cursor-default disabled:opacity-50"
                : !selected && "hover:bg-current/5",
            )}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
