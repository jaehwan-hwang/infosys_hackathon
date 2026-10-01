"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, CheckCard } from "@/components/form";
import { Card, Section, cx, trackStyle } from "@/components/ui";
import {
  CHECKLIST_ITEMS,
  INSTANT_SUMMIT_ITEMS,
  TRACK_EVALUATION,
  TRACK_GOAL,
  TRACK_LABEL,
  TRACK_TAGLINE,
  evaluateSelfCheck,
  EMPTY_SELF_CHECK,
} from "@/lib/track-rules";
import type { SelfCheckPayload } from "@/lib/types";

/**
 * 트랙 자가진단.
 *
 * 계산은 전부 브라우저에서 한다(track-rules.ts). 다만 결과를 체크할 때마다 보여주면
 * "이걸 켜면 Summit이구나"를 보고 답을 고르게 되므로, 다 답한 뒤 버튼을 눌러야 나온다.
 *
 * 결과는 권고일 뿐이고 실제 트랙은 팀 등록 폼에서 참가자가 고른다.
 * 그래서 등록으로 넘어갈 때 추천 트랙을 주소에 실어 보내 미리 선택된 상태로 만든다.
 */
export default function SelfCheckPage() {
  const [check, setCheck] = useState<SelfCheckPayload>(EMPTY_SELF_CHECK);
  const [result, setResult] = useState<ReturnType<typeof evaluateSelfCheck> | null>(null);

  const update = (key: keyof SelfCheckPayload) => (value: boolean) => {
    setCheck((prev) => ({ ...prev, [key]: value }));
    // 답을 고치면 이전 결과는 더 이상 맞지 않으므로 치운다
    setResult(null);
  };

  return (
    <Section
      eyebrow="Track Assignment"
      title="트랙 자가진단"
      description="설문을 통해 Spark, Sprint, Summit 중 어느 트랙에 적합한지 알 수 있습니다."
    >
      <div className="mx-auto max-w-2xl">
        <fieldset>
          <legend className="text-base font-bold">1. 개발 경험</legend>
          <p className="mt-1.5 text-sm text-muted">
            팀 구성원 중 <strong>한 명이라도</strong> 해당하면 체크해 주세요.
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

        <fieldset className="mt-9">
          <legend className="text-base font-bold">2. 개발 역량 체크리스트</legend>
          <p className="mt-1.5 text-sm text-muted">
            해당하는 항목을 모두 체크해 주세요.
          </p>
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

        {result ? (
          <ResultCard result={result} />
        ) : (
          <div className="mt-9">
            <Button size="lg" className="w-full" onClick={() => setResult(evaluateSelfCheck(check))}>
              추천 트랙 확인하기
            </Button>
            <p className="mt-3 text-center text-xs text-subtle">
              체크한 내용은 저장되지 않습니다. 결과는 참고용 권고이며, 실제 트랙은 팀 등록
              시 직접 고릅니다.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

function ResultCard({ result }: { result: ReturnType<typeof evaluateSelfCheck> }) {
  const track = result.resolvedTrack;
  const style = trackStyle(track);

  return (
    <div className="mt-9">
      <Card className={cx("ring-1", style.ring)}>
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">추천 트랙</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className={cx("text-3xl font-black", style.accent)}>
            {TRACK_LABEL[track]}
          </span>
          <span className="text-sm text-muted">{TRACK_TAGLINE[track]}</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">{TRACK_GOAL[track]}</p>

        <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">판단 근거</dt>
            <dd className="text-right font-medium">
              {result.instantSummit ? "개발 경험 항목 해당" : `체크리스트 ${result.checkedCount}/4`}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">평가 방식</dt>
            <dd className="text-right font-medium">{TRACK_EVALUATION[track]}</dd>
          </div>
        </dl>

        <Link
          href={`/team?track=${track}`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          이 트랙으로 팀 등록하기
        </Link>

        <p className="mt-3 text-xs leading-relaxed text-subtle">
          등록 폼에서 {TRACK_LABEL[track]} 트랙이 미리 선택된 상태로 열립니다. 다른 트랙으로
          바꿔도 됩니다.
        </p>
      </Card>
    </div>
  );
}
