"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/form";
import { Alert, Card, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { formatFee } from "@/lib/fee";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { GoodsItem, GoodsItemInfo, GoodsOption, GoodsOrder } from "@/lib/types";

/**
 * 굿즈 사전 신청.
 *
 * 품목을 체크해야 수량을 고를 수 있다. 체크를 풀면 수량 버튼이 잠기고 0으로 돌아간다 —
 * 체크하지 않은 품목에 수량만 남아 있으면 신청한 것인지 아닌지 알 수 없다.
 *
 * 키캡 키링만 결이 다르다. 한 세트에 1구와 3구가 있고 도안이 다섯 가지라, 수량 하나로는
 * 무엇을 몇 개 만들지 정해지지 않는다. 구성과 세트 수는 품목 칸에서 고르고, 도안은
 * 아래 넓은 칸에서 따로 고른다 — 다섯 개를 품목 칸에 밀어 넣으면 그림이 너무 작아진다.
 *
 * 품목 사진은 public/goods/에 같은 이름으로 넣으면 자리에 들어간다.
 * 아직 없으면 빈 칸에 품목 이름만 보인다.
 */
const MAX_QUANTITY = 20;

/**
 * 품목 칸 아래에 따로 붙는 주의 문구.
 *
 * 쿠션 키링은 공동구매로 들여오므로 수량이 모자라면 아예 들어오지 않는다.
 * 신청해 놓고 나중에 취소를 통보받으면 당황하므로, 고르는 자리에서 미리 적어 둔다.
 */
const ITEM_NOTES: Partial<Record<GoodsItem, string>> = {
  KEYRING: "최소주문수량 미달시 공동구매가 취소될 수 있습니다.",
};

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
  const [keycapSlots, setKeycapSlots] = useState<number | null>(
    () => order?.keycapSlots ?? null,
  );
  const [keycapDesigns, setKeycapDesigns] = useState<Record<number, number>>(
    () => ({ ...(order?.keycapDesigns ?? {}) }),
  );
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const keycapInfo = items.find((i) => i.options.length > 0);
  const keycapSets = keycapInfo ? (quantities[keycapInfo.item] ?? 0) : 0;
  const chosenOption = keycapInfo?.options.find((o) => o.slots === keycapSlots) ?? null;

  // 고를 수 있는 도안 칸 수와 지금 고른 개수. 둘이 같아야 신청이 성립한다.
  const designSlots = chosenOption ? chosenOption.slots * keycapSets : 0;
  const designPicked = Object.values(keycapDesigns).reduce((sum, n) => sum + n, 0);
  const keycapReady = keycapSets === 0 || (chosenOption !== null && designPicked === designSlots);

  const mutation = useApiMutation(async (override?: Record<string, number>) => {
    if (!token) throw new Error("no token");
    const next = override ?? quantities;
    // 비우는 저장이면 키캡 구성도 같이 비운다
    const clearing = override !== undefined;
    return api.saveGoodsOrder(
      token,
      next as Record<GoodsItem, number>,
      clearing
        ? { slots: null, designs: {} }
        : { slots: keycapSets > 0 ? keycapSlots : null, designs: keycapSets > 0 ? keycapDesigns : {} },
    );
  });

  const quantityOf = (item: GoodsItem) => quantities[item] ?? 0;

  const setQuantity = (item: GoodsItem, next: number) => {
    setQuantities((prev) => ({ ...prev, [item]: Math.max(0, Math.min(MAX_QUANTITY, next)) }));
    setSaved(false);
  };

  // 키캡 체크를 풀면 구성과 도안도 같이 지운다. 남겨 두면 다시 체크했을 때
  // 보이지 않는 선택이 되살아나 금액이 어긋난다.
  const setKeycapQuantity = (item: GoodsItem, next: number) => {
    setQuantity(item, next);
    if (next <= 0) {
      setKeycapSlots(null);
      setKeycapDesigns({});
    }
  };

  const setDesign = (no: number, next: number) => {
    setKeycapDesigns((prev) => {
      const updated = { ...prev };
      if (next <= 0) delete updated[no];
      else updated[no] = next;
      return updated;
    });
    setSaved(false);
  };

  const priceOf = (info: GoodsItemInfo) => {
    if (info.options.length === 0) return info.price;
    return chosenOption?.price ?? 0;
  };

  const total = items.reduce((sum, i) => sum + priceOf(i) * quantityOf(i.item), 0);
  const picked = items.filter((i) => quantityOf(i.item) > 0);
  // 이미 접수된 신청이 있는가. 처음 들어온 사람에게 "신청 취소"를 띄우면 안 된다.
  const ordered = Object.values(order?.quantities ?? {}).some((q) => q > 0);
  const changed =
    ordered &&
    (items.some((i) => quantityOf(i.item) !== (order?.quantities?.[i.item] ?? 0)) ||
      keycapSlots !== (order?.keycapSlots ?? null) ||
      JSON.stringify(keycapDesigns) !== JSON.stringify(order?.keycapDesigns ?? {}));

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
              slots={keycapSlots}
              onZoom={setZoomed}
              onChange={(next) =>
                info.options.length > 0
                  ? setKeycapQuantity(info.item, next)
                  : setQuantity(info.item, next)
              }
              onPickOption={(next) => {
                setKeycapSlots(next);
                setSaved(false);
              }}
            />
          </li>
        ))}
      </ul>

      {keycapInfo && keycapSets > 0 && chosenOption && (
        <div className="mt-6">
          <KeycapDesignPicker
            designCount={keycapInfo.designCount}
            designs={keycapDesigns}
            slots={designSlots}
            picked={designPicked}
            onChange={setDesign}
            onZoom={setZoomed}
          />
        </div>
      )}

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
                : picked
                    .map((i) =>
                      i.options.length > 0
                        ? `${i.label} ${chosenOption?.label ?? ""} ${quantityOf(i.item)}세트`
                        : `${i.label} ${quantityOf(i.item)}개`,
                    )
                    .join(" · ")}
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
                  setKeycapSlots(null);
                  setKeycapDesigns({});
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
              disabled={picked.length === 0 || (ordered && !changed) || !keycapReady}
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

        {!keycapReady && (
          <p className="mt-3 text-sm text-amber-600">
            {chosenOption === null
              ? "키캡 키링의 1구 / 3구를 골라 주세요."
              : `키캡 도안을 ${designSlots}개 골라 주세요. (지금 ${designPicked}개)`}
          </p>
        )}

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

      {zoomed && <Lightbox {...zoomed} onClose={() => setZoomed(null)} />}
    </div>
  );
}

function GoodsCard({
  info,
  quantity,
  slots,
  onChange,
  onPickOption,
  onZoom,
}: {
  info: GoodsItemInfo;
  quantity: number;
  slots: number | null;
  onChange: (next: number) => void;
  onPickOption: (slots: number) => void;
  onZoom: (image: { src: string; alt: string }) => void;
}) {
  const checked = quantity > 0;
  const checkboxId = `goods-${info.item}`;
  const hasOptions = info.options.length > 0;
  const note = ITEM_NOTES[info.item];

  return (
    <Card className={cx("flex h-full flex-col", checked && "border-[var(--accent)]")}>
      <GoodsImage src={`/goods/${info.item.toLowerCase()}.png`} label={info.label} onZoom={onZoom} />

      <div className="mt-4 flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <label htmlFor={checkboxId} className="cursor-pointer">
          <span className="block font-bold">{info.label}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {hasOptions
              ? info.options.map((o) => `${o.label} ${formatFee(o.price)}`).join(" · ")
              : formatFee(info.price)}
          </span>
        </label>
      </div>

      {/* 구성을 먼저 고르고 세트 수를 센다. 순서가 바뀌면 "몇 개"의 뜻이 흔들린다. */}
      {hasOptions && (
        <div className="mt-4">
          <OptionPicker
            options={info.options}
            value={slots}
            disabled={!checked}
            onChange={onPickOption}
          />
        </div>
      )}

      <div className="mt-4">
        <QuantityStepper
          label={hasOptions ? `${info.label} 세트 수` : `${info.label} 수량`}
          unit={hasOptions ? "세트" : "개"}
          value={quantity}
          disabled={!checked}
          onChange={onChange}
        />
      </div>

      {/* 별표만 강조색으로 띄운다 — 굿즈 화면 위쪽 "꼭 읽어 주세요" 상자와 같은 모양이다 */}
      {note && (
        <p className="mt-3 flex gap-1.5 text-[13px] leading-relaxed text-subtle">
          <span aria-hidden="true" className="text-[var(--accent)]">
            *
          </span>
          <span>{note}</span>
        </p>
      )}
    </Card>
  );
}

/** 1구 / 3구. 고르기 전에는 금액이 정해지지 않아 어느 쪽도 눌린 모양이 아니다. */
function OptionPicker({
  options,
  value,
  disabled,
  onChange,
}: {
  options: GoodsOption[];
  value: number | null;
  disabled: boolean;
  onChange: (slots: number) => void;
}) {
  return (
    <div role="group" aria-label="키캡 구성" className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = value === o.slots;
        return (
          <button
            key={o.slots}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(o.slots)}
            className={cx(
              "h-10 rounded-full border-2 text-sm font-bold transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                : "border-current/15 hover:bg-current/5",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 도안 고르기.
 *
 * 같은 도안을 여러 개 담을 수 있어 체크가 아니라 개수로 센다. 칸을 다 채우기 전에는
 * 남은 수를 계속 보여 준다 — 저장을 눌러서야 모자란 걸 알게 되면 위로 되돌아가야 한다.
 */
function KeycapDesignPicker({
  designCount,
  designs,
  slots,
  picked,
  onChange,
  onZoom,
}: {
  designCount: number;
  designs: Record<number, number>;
  slots: number;
  picked: number;
  onChange: (no: number, next: number) => void;
  onZoom: (image: { src: string; alt: string }) => void;
}) {
  const left = slots - picked;
  const numbers = Array.from({ length: designCount }, (_, i) => i + 1);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold">키캡 도안 고르기</h3>
        <p
          className={cx(
            "text-sm font-bold tabular-nums",
            picked === slots ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {picked} / {slots}개
          {left > 0 && <span className="ml-2 font-medium">{left}개 더 고르세요</span>}
          {left < 0 && <span className="ml-2 font-medium">{-left}개 빼 주세요</span>}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        같은 도안을 여러 개 담아도 됩니다. 사진을 누르면 크게 볼 수 있습니다.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {numbers.map((no) => {
          const count = designs[no] ?? 0;
          return (
            <li key={no}>
              <div
                className={cx(
                  "rounded-xl border-2 p-2.5 transition-colors",
                  count > 0 ? "border-[var(--accent)]" : "border-current/10",
                )}
              >
                <GoodsImage
                  src={`/goods/keycap_${no}.png`}
                  label={`${no}안`}
                  onZoom={onZoom}
                />
                <p className="mt-2 text-center text-sm font-bold">{no}안</p>
                <div className="mt-2">
                  <QuantityStepper
                    label={`키캡 ${no}안`}
                    unit="개"
                    value={count}
                    min={0}
                    max={Math.max(slots, count)}
                    disabled={false}
                    onChange={(next) => onChange(no, next)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * 품목 사진 자리.
 *
 * public/goods/에 같은 이름의 png를 넣으면 그 사진이 들어간다. 아직 없을 때 깨진
 * 이미지가 보이지 않도록, 불러오기에 실패하면 품목 이름만 남긴다. 사진이 있을 때만
 * 누를 수 있게 둔다 — 빈 자리를 눌렀는데 아무 일도 안 나면 고장으로 읽힌다.
 */
function GoodsImage({
  src,
  label,
  onZoom,
}: {
  src: string;
  label: string;
  onZoom: (image: { src: string; alt: string }) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-current/10">
        <span className="px-3 text-center text-sm text-subtle">{label} 사진</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onZoom({ src, alt: label })}
      aria-label={`${label} 사진 크게 보기`}
      className="group block aspect-square w-full overflow-hidden rounded-xl border-2 border-current/10 bg-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        ref={(el) => {
          // 서버가 그린 img는 React가 onError를 걸기 전에 이미 실패해 있을 수 있다.
          // 그 경우 이벤트가 오지 않으므로, 붙는 순간 다 불러왔는데 크기가 0인지 직접 본다.
          if (el && el.complete && el.naturalWidth === 0) setFailed(true);
        }}
        onError={() => setFailed(true)}
        className="size-full object-contain transition-transform duration-200 group-hover:scale-105"
      />
    </button>
  );
}

/**
 * 사진 크게 보기. 어디를 눌러도, Esc를 눌러도 닫힌다.
 *
 * body에 직접 붙인다(포털). fixed는 화면을 기준으로 잡히는 게 보통이지만, 위쪽 어딘가에
 * transform이 걸린 요소가 하나라도 있으면 기준이 그 요소로 바뀐다. 화면 전환 효과를 주는
 * .page-enter가 바로 그런 요소라, 그 효과가 도는 동안 열면 확대 창이 화면이 아니라 페이지
 * 전체에 맞춰져 아래로 밀려났다. 배경을 잠가 둬서 내려 볼 수도 없었다.
 */
function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  // 서버에는 document가 없다. 붙을 자리가 생긴 뒤에 그린다.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // 뒤 배경이 같이 밀리면 닫고 나서 엉뚱한 위치에 서 있게 된다
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!host) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 사진`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      {/*
        크기를 화면에 맞춰 직접 묶는다. 바깥 칸에 맞추라고만 하면(max-h-full) 그 칸의
        높이를 사진이 정하는 구조라 기준이 돌고 돌아 아무 데도 걸리지 않고, 사진이
        화면을 넘겨 버린다. 넘긴 뒤에는 뒤 배경을 잠가 둬서 내려 볼 수도 없다.
        dvh를 쓰는 이유는 휴대폰에서 주소창이 접혔다 펴져도 기준이 흔들리지 않게 하려고.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[80dvh] w-auto max-w-[min(90vw,30rem)] rounded-2xl bg-white object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="fixed right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-2xl font-bold text-white backdrop-blur hover:bg-white/25"
      >
        ×
      </button>
    </div>,
    host,
  );
}

/** 수량 조절. 체크하지 않은 품목에서는 잠긴다. */
function QuantityStepper({
  label,
  unit = "개",
  value,
  min = 1,
  max = MAX_QUANTITY,
  disabled,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
  min?: number;
  max?: number;
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
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </StepButton>

      <span aria-live="polite" className="text-sm font-bold tabular-nums">
        <span className="sr-only">{label} </span>
        {value}
        {unit}
      </span>

      <StepButton
        label={`${label} 늘리기`}
        disabled={disabled || value >= max}
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
