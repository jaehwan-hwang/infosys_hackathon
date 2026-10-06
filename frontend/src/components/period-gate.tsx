"use client";

import type { ReactNode } from "react";
import { Badge, EmptyState, Section } from "@/components/ui";
import { useAuth } from "@/lib/use-auth";

/**
 * 아직 쓸 때가 아닌 화면을 가린다.
 *
 * 결과물 제출·평가·리더보드는 각각 정해진 때에만 열린다. 그 전에 빈 화면을 띄워 두면
 * 지금 해도 되는 줄 알고 들어왔다가 되돌아간다. 언제 열리는지만 알려 주고 막는다.
 *
 * 운영진과 교수는 언제든 통과한다 — 행사 전에 화면이 제대로 도는지 미리 봐야 한다.
 */
export function PeriodGate({
  open,
  title,
  description,
  children,
}: {
  /** 지금 참가자에게 열려 있는가 */
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { isStaff, role } = useAuth();
  const staffPreview = !open && (isStaff || role === "PROFESSOR");

  if (!open && !staffPreview) {
    return (
      <Section title={title}>
        <EmptyState title="이용 기간이 아닙니다" description={description} />
      </Section>
    );
  }

  return (
    <>
      {staffPreview && (
        <div className="mx-auto w-full max-w-5xl px-5 pt-8">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-500/40 px-5 py-3">
            <Badge tone="warning">운영진 미리보기</Badge>
            <p className="text-sm text-muted">
              참가자에게는 &ldquo;이용 기간이 아닙니다&rdquo;로 보입니다.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
