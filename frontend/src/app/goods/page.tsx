"use client";

import { AuthGate } from "@/components/auth-gate";
import { GoodsOrderForm } from "@/components/goods-order-form";
import { Alert, Section, Spinner } from "@/components/ui";
import { api, publicApi } from "@/lib/api";
import { useApiQuery, useAuth } from "@/lib/use-auth";

export default function GoodsPage() {
  return (
    <AuthGate>
      <GoodsContent />
    </AuthGate>
  );
}

/**
 * 해커톤 굿즈.
 *
 * 돈은 여기서 받지 않는다. 가격이 수량에 따라 조정되기 때문에 수량만 모으고,
 * 확정 금액과 입금은 신청 마감 뒤 단톡방에서 안내한다.
 */
function GoodsContent() {
  const { token } = useAuth();

  const itemsQuery = useApiQuery((signal) => publicApi.getGoodsItems(signal), []);
  const orderQuery = useApiQuery(
    token ? (signal) => api.getGoodsOrder(token, signal) : null,
    [token],
  );

  if (itemsQuery.loading || orderQuery.loading) return <Spinner />;
  if (itemsQuery.error) return <Alert tone="error">{itemsQuery.error}</Alert>;

  return (
    <Section eyebrow="Goods" title="해커톤 굿즈">
      <p className="text-[15px] leading-relaxed text-muted sm:text-[17px]">
        해커톤 신청자에 한해 학과 굿즈 사전 신청 및 현장 구매가 가능합니다.
      </p>

      {/* 나중에 "못 들었다"가 나오는 두 가지라 눈에 띄게 둘러싼다 */}
      <div className="mt-6 rounded-2xl border-2 border-[var(--accent)]/40 px-5 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          꼭 읽어 주세요
        </p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-[var(--accent)]">
              *
            </span>
            <span>현장 구매는 한정 수량으로 진행되어, 조기 마감될 수 있습니다.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-[var(--accent)]">
              *
            </span>
            <span>
              굿즈 가격은 수량에 따라 소폭 조정될 수 있습니다. 신청 마감 후 개설될
              단톡방에서 정확한 가격 및 입금에 대한 내용을 안내드리겠습니다.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-10">
        <GoodsOrderForm
          items={itemsQuery.data ?? []}
          order={orderQuery.data ?? null}
          error={orderQuery.error ?? null}
          onSaved={orderQuery.reload}
        />
      </div>
    </Section>
  );
}
