"use client";

import { useState } from "react";
import { Button } from "@/components/form";
import { Alert, Card, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { formatFee } from "@/lib/fee";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { GoodsItem, GoodsItemInfo, GoodsOrder } from "@/lib/types";

/**
 * 굿즈 사전 신청.
 *
 * 품목을 체크해야 수량을 고를 수 있다. 체크를 풀면 수량 버튼이 잠기고 0으로 돌아간다 —
 * 체크하지 않은 품목에 수량만 남아 있으면 신청한 것인지 아닌지 알 수 없다.
 *
 * 품목 사진은 public/goods/에 같은 이름으로 넣으면 자리에 들어간다.
 * 아직 없으면 빈 칸에 품목 이름만 보인다.
 */
const MAX_QUANTITY = 20;

export function GoodsOrderForm({
  items,
  order,
  error,
  onSaved,
}: {
  items: GoodsItemInfo[];
  order: GoodsOrder | null;
  error: string | null;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => ({ ...(order?.quantities ?? {}) }),
  );
  const [saved, setSaved] = useState(false);

  const mutation = useApiMutation(async (override?: Record<string, number>) => {
    if (!token) throw new Error("no token");
    return api.saveGoodsOrder(
      token,
      (override ?? quantities) as Record<GoodsItem, number>,
    );
  });

  const quantityOf = (item: GoodsItem) => quantities[item] ?? 0;

  const setQuantity = (item: GoodsItem, next: number) => {
    setQuantities((prev) => ({ ...prev, [item]: Math.max(0, Math.min(MAX_QUANTITY, next)) }));
    setSaved(false);
  };

  const total = items.reduce((sum, i) => sum + i.price * quantityOf(i.item), 0);
  const picked = items.filter((i) => quantityOf(i.item) > 0);
  // 이미 접수된 신청이 있는가. 처음 들어온 사람에게 "신청 취소"를 띄우면 안 된다.
  const ordered = Object.values(order?.quantities ?? {}).some((q) => q > 0);
  const changed =
    ordered && items.some((i) => quantityOf(i.item) !== (order?.quantities?.[i.item] ?? 0));

  // 참가 신청을 하지 않았으면 서버가 막는다. 그 안내를 그대로 보여준다.
  if (error) return <Alert tone="warning">{error}</Alert>;

  return (
    <div>
      {/* 세 품목이 같은 너비를 차지한다 */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {items.map((info) => (
          <li key={info.item}>
            <GoodsCard
              info={info}
              quantity={quantityOf(info.item)}
              onChange={(next) => setQuantity(info.item, next)}
            />
          </li>
        ))}
      </ul>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-subtle">
              예상 금액
            </p>
            <p className="font-display mt-1 text-3xl tabular-nums tracking-tight">
              {formatFee(total)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {picked.length === 0
                ? ordered
                  ? "품목을 모두 비웠습니다. 신청 취소를 누르면 접수가 취소됩니다."
                  : "신청할 품목을 골라 주세요."
                : picked.map((i) => `${i.label} ${quantityOf(i.item)}개`).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {saved && <span className="text-sm text-emerald-600">저장했습니다</span>}

            {/* 아직 신청하지 않았으면 "신청하기" 하나만 둔다.
                접수된 뒤에야 수량 변경과 신청 취소가 의미를 가진다. */}
            {ordered && (
              <Button
                variant="secondary"
                loading={mutation.pending}
                onClick={async () => {
                  setQuantities({});
                  const result = await mutation.run({});
                  if (result) {
                    setSaved(true);
                    onSaved();
                  }
                }}
              >
                신청 취소
              </Button>
            )}

            <Button
              size="lg"
              loading={mutation.pending}
              disabled={picked.length === 0 || (ordered && !changed)}
              onClick={async () => {
                const result = await mutation.run();
                if (result) {
                  setSaved(true);
                  onSaved();
                }
              }}
            >
              {ordered ? "수량 변경 저장" : "신청하기"}
            </Button>
          </div>
        </div>

        {mutation.error && (
          <div className="mt-4">
            <Alert tone="error">{mutation.error.message}</Alert>
          </div>
        )}

        <p className="mt-4 border-t-2 border-current/10 pt-3 text-xs leading-relaxed text-subtle">
          금액은 예상값입니다. 수량에 따라 조정될 수 있고, 확정 금액과 입금 방법은 신청
          마감 뒤 단톡방에서 안내합니다. 마감 전까지 몇 번이든 고칠 수 있습니다.
        </p>
      </Card>
    </div>
  );
}

function GoodsCard({
  info,
  quantity,
  onChange,
}: {
  info: GoodsItemInfo;
  quantity: number;
  onChange: (next: number) => void;
}) {
  const checked = quantity > 0;
  const checkboxId = `goods-${info.item}`;

  return (
    <Card className={cx("h-full", checked && "border-brand-600")}>
      <GoodsImage item={info.item} label={info.label} />

      <div className="mt-4 flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          className="mt-1 size-4 shrink-0 accent-brand-600"
        />
        <label htmlFor={checkboxId} className="cursor-pointer">
          <span className="block font-bold">{info.label}</span>
          <span className="mt-0.5 block text-sm text-muted">{formatFee(info.price)}</span>
        </label>
      </div>

      <div className="mt-4">
        <QuantityStepper
          label={`${info.label} 수량`}
          value={quantity}
          disabled={!checked}
          onChange={onChange}
        />
      </div>
    </Card>
  );
}

/**
 * 품목 사진 자리.
 *
 * public/goods/<item>.jpg를 넣으면 그 사진이 들어간다. 아직 없을 때 깨진 이미지가
 * 보이지 않도록, 불러오기에 실패하면 품목 이름만 남긴다.
 */
function GoodsImage({ item, label }: { item: GoodsItem; label: string }) {
  const [failed, setFailed] = useState(false);
  const src = `/goods/${item.toLowerCase()}.jpg`;

  return (
    <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-current/10">
      {failed ? (
        <span className="px-3 text-center text-sm text-subtle">{label} 사진</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

/** 수량 조절. 체크하지 않은 품목에서는 잠긴다. */
function QuantityStepper({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between rounded-full border-2 px-2 py-1",
        disabled ? "border-current/10 opacity-40" : "border-current/15",
      )}
    >
      <StepButton
        label={`${label} 줄이기`}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </StepButton>

      <span aria-live="polite" className="text-sm font-bold tabular-nums">
        <span className="sr-only">{label} </span>
        {value}개
      </span>

      <StepButton
        label={`${label} 늘리기`}
        disabled={disabled || value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-lg font-bold transition-colors hover:bg-current/5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
