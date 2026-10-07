/**
 * 입력 길이 제한.
 *
 * 화면에 나오는 자리를 기준으로 잡았다. 팀명은 트랙·모집 태그와 한 줄에 서므로
 * 20자를 넘기면 좁은 화면에서 상자를 밀어낸다. 서버(@Size)와 같은 값을 쓰므로
 * 한쪽만 고치면 등록이 막힌다.
 */
export const LIMITS = {
  teamName: 20,
  recruitNote: 150,
  joinMessage: 300,
  memberName: 20,
  projectName: 40,
  summary: 200,
} as const;

/** 남은 글자 수 안내. 넘치기 전에 보이도록 70%부터 띄운다. */
export function remainingHint(value: string, max: number): string | undefined {
  if (value.length < max * 0.7) return undefined;
  return `${value.length} / ${max}자`;
}
