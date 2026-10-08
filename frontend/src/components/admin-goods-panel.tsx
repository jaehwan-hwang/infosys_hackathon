"use client";

import { api } from "@/lib/api";
import { formatFee } from "@/lib/fee";
import { useApiQuery, useAuth } from "@/lib/use-auth";
import { Alert, Card, EmptyState, Spinner } from "@/components/ui";
import type { AdminGoodsOrder } from "@/lib/types";

/**
 * 굿즈 신청 내역.
 *
 * 물건을 건넬 때 쓰는 화면이라 신청자의 이름·학번·전화번호·이메일을 가리지 않는다.
 * 참가자끼리 보는 화면에서는 학번 뒷자리를 가리지만, 여기서는 본인 확인과 입금 대조를
 * 해야 해서 가리면 쓸 수가 없다.
 *
 * 맨 위에 품목별·도안별 총합을 둔다 — 실제로 발주할 때 필요한 건 한 사람씩이 아니라
 * 전부 몇 개인지라, 그 숫자를 사람이 더하게 두면 틀린다.
 */
export function AdminGoodsPanel() {
  const { token } = useAuth();
  const ordersQuery = useApiQuery(
    token ? () => api.admin.getGoodsOrders(token) : null,
    [token],
  );

  if (ordersQuery.loading) return <Spinner />;
  if (ordersQuery.error) return <Alert tone="error">{ordersQuery.error}</Alert>;

  return <GoodsOrdersView orders={ordersQuery.data ?? []} />;
}

/** 받아 온 내역을 그리는 부분. 가져오기와 떼어 둬 따로 확인할 수 있다. */
export function GoodsOrdersView({ orders }: { orders: AdminGoodsOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="아직 굿즈 신청이 없습니다"
        description="참가자가 굿즈 탭에서 신청하면 여기에 바로 뜹니다."
      />
    );
  }

  return (
    <div className="space-y-6">
      <GoodsSummary orders={orders} />

      <div>
        <h2 className="text-base font-bold">신청자 {orders.length}명</h2>
        <ul className="mt-3 space-y-3">
          {orders.map((order) => (
            <li key={order.userId}>
              <GoodsOrderCard order={order} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 발주에 쓰는 총합. 품목은 수량으로, 키캡은 도안별로 센다. */
function GoodsSummary({ orders }: { orders: AdminGoodsOrder[] }) {
  const byItem = new Map<string, number>();
  const byDesign = new Map<number, number>();
  let total = 0;

  for (const order of orders) {
    total += order.estimatedTotal;
    for (const line of order.lines) {
      const key = line.option ? `${line.label} ${line.option}` : line.label;
      byItem.set(key, (byItem.get(key) ?? 0) + line.quantity);
    }
    for (const [no, count] of Object.entries(order.keycapDesigns)) {
      byDesign.set(Number(no), (byDesign.get(Number(no)) ?? 0) + count);
    }
  }

  const designs = [...byDesign.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">합계</h2>
        <p className="font-display text-2xl tabular-nums tracking-tight">
          {formatFee(total)}
        </p>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {[...byItem.entries()].map(([label, quantity]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt className="text-muted">{label}</dt>
            <dd className="font-bold tabular-nums">{quantity}</dd>
          </div>
        ))}
      </dl>

      {designs.length > 0 && (
        <div className="mt-4 border-t-2 border-current/10 pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-subtle">
            키캡 도안별
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {designs.map(([no, count]) => (
              <div key={no} className="flex items-baseline gap-2">
                <dt className="text-muted">{no}안</dt>
                <dd className="font-bold tabular-nums">{count}개</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Card>
  );
}

function GoodsOrderCard({ order }: { order: AdminGoodsOrder }) {
  const designs = Object.entries(order.keycapDesigns)
    .map(([no, count]) => [Number(no), count] as const)
    .sort((a, b) => a[0] - b[0]);

  return (
    <Card>
      {/* 신청자 */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-bold">{order.name}</span>
        <span className="text-sm tabular-nums text-muted">{order.studentId ?? "학번 없음"}</span>
        <span className="text-sm tabular-nums text-muted">{order.phone ?? "전화번호 없음"}</span>
        <span className="text-sm text-muted">{order.email}</span>
      </div>

      {/* 신청 내역 */}
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-current/20 text-left">
            <th scope="col" className="py-2 pr-3 font-semibold">품목</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">단가</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">수량</th>
            <th scope="col" className="py-2 text-right font-semibold">금액</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.label} className="border-b border-current/10">
              <td className="py-2 pr-3">
                {line.label}
                {line.option && (
                  <span className="ml-2 text-xs font-bold text-[var(--accent)]">
                    {line.option}
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-muted">
                {formatFee(line.unit)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{line.quantity}</td>
              <td className="py-2 text-right tabular-nums font-bold">
                {formatFee(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="py-2.5 pr-3 text-right font-bold">
              합산 금액
            </td>
            <td className="py-2.5 text-right font-display text-lg tabular-nums">
              {formatFee(order.estimatedTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {designs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t-2 border-current/10 pt-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-subtle">
            키캡 도안
          </span>
          {designs.map(([no, count]) => (
            <span key={no}>
              <span className="text-muted">{no}안</span>{" "}
              <span className="font-bold tabular-nums">{count}개</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
