/**
 * 표시용 포맷터.
 *
 * 백엔드는 모든 시각을 UTC로 내려주므로, 화면에 그릴 때 한국 시간으로 바꾼다.
 * timeZone을 명시하지 않으면 사용자의 기기 설정에 따라 다른 시각이 보인다.
 */

const KST = "Asia/Seoul";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** 점수를 소수 둘째 자리까지 보여준다. */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "-";
  return score.toFixed(2);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 순위를 메달 이모지 또는 숫자로 표시한다. */
export function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

/**
 * 구글 계정 표시 이름에서 사람 이름만 남긴다.
 *
 * 한양대 계정은 "황재환 | 정보시스템학과 | 한양대(서울)"처럼 소속을 덧붙여 내려주고,
 * 앞에 보이지 않는 제어 문자(소프트 하이픈 등)가 섞여 오기도 한다.
 * 참가자 명단과 시상에 그대로 쓸 수 없으므로 첫 구분자 앞까지만 취한다.
 */
export function cleanPersonName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    // 폭 없는 공백·소프트 하이픈처럼 눈에 안 보이는 문자를 먼저 걷어낸다
    .replace(/[\u00ad\u200b-\u200f\ufeff]/g, "")
    .split(/[|/·,(]/)[0]
    .trim();
}
