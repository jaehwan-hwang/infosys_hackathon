import type { Track } from "./types";

/**
 * 참가비 안내.
 *
 * 학생회비를 낸 재학생은 참가비가 없다. 미납자와 휴학생만 낸다.
 * 금액은 트랙에 따라 다르다 — 1일차만 하는 Spark가 더 싸다.
 * 입금자명 규칙이 어긋나면 운영진이 누가 낸 돈인지 대조할 수 없어, 예시까지 함께 보여준다.
 *
 * 서버(Track.java의 entryFee)와 같은 값을 쓰므로 한쪽만 고치면 안 된다.
 */
export const ENTRY_FEE: Record<Track, number> = {
  SPARK: 5000,
  SPRINT: 10000,
  SUMMIT: 10000,
};

export const FEE_ACCOUNT = {
  bank: "신한",
  number: "100-038-124447",
  holder: "한양대학교 공과대학 정보시스템학과 학생회",
} as const;

/** 입금자명 규칙 — 이름 + "해커톤" */
export function depositName(name: string): string {
  const clean = name.replace(/\s+/g, "");
  return `${clean || "이름"}해커톤`;
}

export function formatFee(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function entryFeeOf(track: Track): number {
  return ENTRY_FEE[track];
}
