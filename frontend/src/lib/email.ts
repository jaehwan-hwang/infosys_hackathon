/**
 * 학교 메일 확인.
 *
 * 로그인은 학교 계정으로만 되므로, 다른 메일로 적힌 팀원 자리는 영영 계정과 이어지지
 * 않는다. 서버도 막지만, 적는 자리에서 바로 알려야 다 채우고 나서 거절당하지 않는다.
 */
export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

export function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** 적다 만 칸에는 아무 말도 하지 않는다. "@"까지 쳤는데 학교 메일이 아닐 때만 알린다. */
export function emailDomainHint(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) return undefined;
  const domain = trimmed.split("@")[1] ?? "";
  // 도메인을 아직 치는 중이면 기다린다 (hanyang.ac. 까지만 친 상태 등)
  if (`${ALLOWED_EMAIL_DOMAIN}`.startsWith(domain.toLowerCase())) return undefined;
  return isAllowedEmail(trimmed) ? undefined : `한양대학교 메일(@${ALLOWED_EMAIL_DOMAIN})만 적을 수 있습니다.`;
}
