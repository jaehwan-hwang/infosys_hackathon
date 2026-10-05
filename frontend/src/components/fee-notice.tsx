import { ENTRY_FEE, FEE_ACCOUNT, depositName, formatFee } from "@/lib/fee";
import { Card, cx } from "@/components/ui";

/**
 * 참가비 입금 안내.
 *
 * 학생회비 미납자와 휴학생만 해당한다. 입금자명을 틀리면 운영진이 누가 낸 돈인지
 * 알 수 없으므로, 규칙과 함께 해당자 이름으로 만든 예시를 그대로 보여준다.
 */
export function FeeNotice({
  names,
  className,
}: {
  /** 참가비를 내야 하는 사람들의 이름 */
  names: string[];
  className?: string;
}) {
  if (names.length === 0) return null;

  return (
    <Card className={cx("border-brand-500/40", className)}>
      <p className="font-bold">
        참가비 {formatFee(ENTRY_FEE)} 대상 {names.length}명
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        학생회비 미납자와 휴학생은 1인당 {formatFee(ENTRY_FEE)}을 입금해 주세요. 학생회비를
        납부한 재학생은 참가비가 없습니다.
      </p>

      <dl className="mt-4 space-y-2 border-t-2 border-current/10 pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">입금 계좌</dt>
          <dd className="text-right font-bold tabular-nums">
            {FEE_ACCOUNT.bank} {FEE_ACCOUNT.number}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">예금주</dt>
          <dd className="text-right font-medium">{FEE_ACCOUNT.holder}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">입금자명</dt>
          <dd className="text-right font-bold">이름 + 해커톤</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-xl border-2 border-current/10 px-4 py-3">
        <p className="text-xs font-bold text-subtle">이렇게 입금해 주세요</p>
        <ul className="mt-1.5 space-y-0.5 text-sm">
          {names.map((name) => (
            <li key={name}>
              <span className="text-muted">{name} →</span>{" "}
              <strong>{depositName(name)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
