"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCard } from "@/components/form";
import { Alert, Card, Section, TrackBadge, cx, trackStyle } from "@/components/ui";
import {
  CHECKLIST_ITEMS,
  CHECKLIST_THRESHOLD,
  EMPTY_SELF_CHECK,
  INSTANT_SUMMIT_ITEMS,
  TRACK_EVALUATION,
  TRACK_GOAL,
  TRACK_LABEL,
  evaluateSelfCheck,
} from "@/lib/track-rules";
import type { SelfCheckPayload } from "@/lib/types";

/**
 * 트랙 자가진단.
 *
 * 계산은 전부 클라이언트에서 즉시 이뤄진다(track-rules.ts). 서버 왕복이 없어야
 * 체크할 때마다 결과가 바로 바뀌는 경험이 나온다. 실제 배정은 팀 등록 시
 * 서버가 같은 규칙으로 다시 계산하므로, 이 화면의 결과는 안내값이다.
 */
export default function SelfCheckPage() {
  const [check, setCheck] = useState<SelfCheckPayload>(EMPTY_SELF_CHECK);
  const [touched, setTouched] = useState(false);

  const result = useMemo(() => evaluateSelfCheck(check), [check]);

  const update = (key: keyof SelfCheckPayload) => (value: boolean) => {
    setCheck((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const style = trackStyle(result.resolvedTrack);

  return (
    <Section
      eyebrow="Track Assignment"
      title="트랙 자가진단"
      description="Sprint와 Summit 중 어느 트랙에 배정될지 확인합니다. Spark(아이디어톤) 트랙을 선택할 경우 자가진단 없이 바로 등록할 수 있습니다."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <fieldset>
            <legend className="text-base font-bold">
              1. 즉시 Summit 배정 사유
            </legend>
            <p className="mt-1.5 text-sm text-muted">
              아래 중 <strong>하나라도</strong> 해당하면 체크리스트와 관계없이 Summit 트랙으로
              배정됩니다.
            </p>
            <div className="mt-4 space-y-2">
              {INSTANT_SUMMIT_ITEMS.map((item) => (
                <CheckCard
                  key={item.key}
                  checked={check[item.key]}
                  onChange={update(item.key)}
                  label={item.label}
                />
              ))}
            </div>
          </fieldset>

          <fieldset
            // 즉시 배정 사유가 있으면 체크리스트는 결과에 영향을 주지 않는다
            className={cx(
              "transition-opacity",
              result.instantSummit && "opacity-50",
            )}
          >
            <legend className="text-base font-bold">2. 자가 진단 체크리스트</legend>
            <p className="mt-1.5 text-sm text-muted">
              아래 {CHECKLIST_ITEMS.length}개 중{" "}
              <strong>{CHECKLIST_THRESHOLD}개 이상</strong> 해당하면 Summit 트랙으로 배정됩니다.
            </p>
            {result.instantSummit && (
              <p className="mt-2 text-xs font-medium text-crimson-600">
                이미 즉시 배정 사유에 해당하여 이 항목은 결과에 반영되지 않습니다.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {CHECKLIST_ITEMS.map((item) => (
                <CheckCard
                  key={item.key}
                  checked={check[item.key]}
                  onChange={update(item.key)}
                  label={item.label}
                  description={item.description}
                />
              ))}
            </div>
          </fieldset>
        </div>

        {/* 결과 패널. 데스크톱에서는 스크롤을 따라온다 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className={cx("ring-1", style.ring)}>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              진단 결과
            </p>

            <div className="mt-3 flex items-center gap-2">
              <TrackBadge track={result.resolvedTrack} />
              <span className={cx("text-2xl font-black", style.accent)}>
                {TRACK_LABEL[result.resolvedTrack]}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              {TRACK_GOAL[result.resolvedTrack]}
            </p>

            <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">배정 근거</dt>
                <dd className="text-right font-medium">
                  {result.instantSummit
                    ? "즉시 배정 사유 해당"
                    : `체크리스트 ${result.checkedCount}/4`}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">평가 방식</dt>
                <dd className="text-right font-medium">
                  {TRACK_EVALUATION[result.resolvedTrack]}
                </dd>
              </div>
            </dl>

            {touched && (
              <div className="mt-4">
                <Alert tone="info">{result.reason}</Alert>
              </div>
            )}

            <Link
              href="/register"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-crimson-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-crimson-700"
            >
              이 트랙으로 팀 등록하기
            </Link>

            <p className="mt-3 text-xs leading-relaxed text-subtle">
              최종 트랙은 팀 등록 시 서버에서 동일한 기준으로 다시 확정됩니다. 등록 폼에서
              자가진단을 한 번 더 입력하게 됩니다.
            </p>
          </Card>

          <Card className="mt-4">
            <p className="text-sm font-semibold">Spark 트랙으로 참가하려면</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Spark는 1일차에만 진행되는 아이디어톤입니다. 자가진단과 무관하게 직접 선택할 수
              있으며, 구현된 코드는 제출할 수 없습니다.
            </p>
          </Card>
        </div>
      </div>
    </Section>
  );
}
