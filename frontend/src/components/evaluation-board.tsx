"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatScore } from "@/lib/format";
import { TRACK_LABEL } from "@/lib/track-rules";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type {
  Criterion,
  Evaluation,
  EvaluationTarget,
  EvaluatorType,
  ScoreEntry,
  Track,
} from "@/lib/types";
import { Button, ScoreSelector, TextArea } from "./form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Section,
  Spinner,
  TrackBadge,
  cx,
} from "./ui";

/**
 * 평가 화면. 학생 투표와 교수 평가가 같은 컴포넌트를 쓰고,
 * evaluatorType으로 호출 경로와 문구만 갈린다.
 *
 * 평가 대상 목록에는 자기 팀이 애초에 오지 않는다(서버가 걸러 보낸다).
 */
export function EvaluationBoard({ evaluatorType }: { evaluatorType: EvaluatorType }) {
  const { token } = useAuth();
  const isProfessor = evaluatorType === "PROFESSOR";

  const targetsQuery = useApiQuery(
    token ? () => api.getEvaluationTargets(token, evaluatorType) : null,
    [token, evaluatorType],
  );
  const myEvaluationsQuery = useApiQuery(
    token ? () => api.getMyEvaluations(token) : null,
    [token],
  );

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  if (targetsQuery.loading) return <Spinner label="평가 대상 불러오는 중" />;

  if (targetsQuery.error) {
    return (
      <Section title={isProfessor ? "교수 평가" : "평가"}>
        <Alert tone="warning" title="지금은 평가할 수 없습니다">
          {targetsQuery.error}
        </Alert>
      </Section>
    );
  }

  const targets = targetsQuery.data ?? [];

  if (targets.length === 0) {
    return (
      <Section title={isProfessor ? "교수 평가" : "평가"}>
        <EmptyState
          title="평가할 팀이 없습니다"
          description={
            isProfessor
              ? "아직 Summit 트랙에 등록된 팀이 없습니다."
              : "같은 트랙에 평가할 다른 팀이 아직 없습니다. 자신이 속한 팀은 평가 대상에서 제외됩니다."
          }
        />
      </Section>
    );
  }

  const selected = targets.find((t) => t.teamId === selectedTeamId) ?? null;
  const evaluatedCount = targets.filter((t) => t.evaluated).length;

  return (
    <Section
      eyebrow={isProfessor ? "Professor Judging" : "Peer Voting"}
      title={isProfessor ? "교수 평가" : "팀 평가"}
      description={
        isProfessor
          ? "Summit 트랙 팀을 항목별로 채점합니다. 교수 평가는 최종 점수의 70%를 차지합니다."
          : "발표를 본 팀을 항목별로 채점해 주세요. 자신이 속한 팀은 목록에 표시되지 않습니다."
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={evaluatedCount === targets.length ? "success" : "info"}>
          {evaluatedCount} / {targets.length} 팀 평가 완료
        </Badge>
        <p className="text-sm text-muted">
          제출한 평가는 마감 전까지 언제든 수정할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* 팀 목록 */}
        <nav aria-label="평가 대상 팀" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="space-y-2">
            {targets.map((target) => (
              <li key={target.teamId}>
                <button
                  type="button"
                  onClick={() => setSelectedTeamId(target.teamId)}
                  aria-current={target.teamId === selectedTeamId ? "true" : undefined}
                  className={cx(
                    "w-full rounded-xl border p-3.5 text-left transition-colors",
                    target.teamId === selectedTeamId
                      ? "border-crimson-500 bg-crimson-50 dark:bg-crimson-950/30"
                      : "border-[var(--border)] hover:bg-[var(--bg-muted)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{target.teamName}</span>
                    {target.evaluated && <Badge tone="success">완료</Badge>}
                  </div>
                  {target.projectName && (
                    <p className="mt-1 text-xs text-muted">{target.projectName}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 채점 폼 */}
        <div>
          {selected ? (
            <ScoreForm
              key={selected.teamId}
              target={selected}
              evaluatorType={evaluatorType}
              existing={myEvaluationsQuery.data?.find(
                (e) => e.targetTeamId === selected.teamId,
              )}
              onSubmitted={() => {
                targetsQuery.reload();
                myEvaluationsQuery.reload();
              }}
            />
          ) : (
            <EmptyState
              title="평가할 팀을 선택해 주세요"
              description="왼쪽 목록에서 팀을 고르면 채점 항목이 나타납니다."
            />
          )}
        </div>
      </div>
    </Section>
  );
}

function ScoreForm({
  target,
  evaluatorType,
  existing,
  onSubmitted,
}: {
  target: EvaluationTarget;
  evaluatorType: EvaluatorType;
  existing: Evaluation | undefined;
  onSubmitted: () => void;
}) {
  const { token } = useAuth();

  const criteriaQuery = useApiQuery(
    token ? () => api.getEvaluationCriteria(token, target.track, evaluatorType) : null,
    [token, target.track, evaluatorType],
  );

  // 이미 제출한 평가가 있으면 그 점수로 폼을 채운다
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    existing?.scores.forEach((s) => {
      initial[s.criterionId] = s.score;
    });
    return initial;
  });
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [savedScore, setSavedScore] = useState<number | null>(
    existing?.totalScore ?? null,
  );

  const { run, pending, error } = useApiMutation(async (entries: ScoreEntry[]) => {
    if (!token) throw new Error("no token");
    return api.submitEvaluation(token, evaluatorType, {
      targetTeamId: target.teamId,
      scores: entries,
      comment: comment.trim() || undefined,
    });
  });

  const criteria = useMemo(
    () => criteriaQuery.data ?? [],
    [criteriaQuery.data],
  );

  // 모든 항목을 채워야 제출할 수 있다 (서버도 같은 조건을 검사한다)
  const allScored =
    criteria.length > 0 && criteria.every((c) => scores[c.criterionId] !== undefined);

  /** 제출 전에 총점을 미리 계산해 보여준다. 서버 계산식과 같다. */
  const previewTotal = useMemo(() => {
    if (!allScored) return null;
    const total = criteria.reduce((sum, c) => {
      const score = scores[c.criterionId] ?? 0;
      return sum + (score / c.maxScore) * c.weight;
    }, 0);
    return total * 100;
  }, [criteria, scores, allScored]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries: ScoreEntry[] = criteria.map((c) => ({
      criterionId: c.criterionId,
      score: scores[c.criterionId] ?? 0,
    }));
    const result = await run(entries);
    if (result) {
      setSavedScore(result.totalScore);
      onSubmitted();
    }
  };

  if (criteriaQuery.loading) return <Spinner label="평가 항목 불러오는 중" />;

  if (criteria.length === 0) {
    return (
      <Alert tone="warning" title="평가 항목이 설정되지 않았습니다">
        {TRACK_LABEL[target.track]} 트랙의 평가 항목이 아직 등록되지 않았습니다. 운영진에게
        문의해 주세요.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrackBadge track={target.track} />
              <h2 className="text-lg font-bold">{target.teamName}</h2>
            </div>
            {target.projectName && (
              <p className="mt-2 font-medium">{target.projectName}</p>
            )}
            {target.summary && (
              <p className="mt-1 text-sm leading-relaxed text-muted">{target.summary}</p>
            )}
          </div>
          {target.evaluated && <Badge tone="success">평가 완료</Badge>}
        </div>

        {(target.deployUrl || target.demoUrl) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            {target.deployUrl && (
              <ExternalLink href={target.deployUrl} label="배포 서비스 보기" />
            )}
            {target.demoUrl && (
              <ExternalLink href={target.demoUrl} label="시연 영상 보기" />
            )}
          </div>
        )}
      </Card>

      <div className="mt-4 space-y-3">
        {criteria.map((criterion) => (
          <CriterionRow
            key={criterion.criterionId}
            criterion={criterion}
            value={scores[criterion.criterionId] ?? null}
            onChange={(score) =>
              setScores((prev) => ({ ...prev, [criterion.criterionId]: score }))
            }
          />
        ))}
      </div>

      <Card className="mt-4">
        <label htmlFor="eval-comment" className="text-sm font-semibold">
          코멘트 <span className="font-normal text-subtle">(선택)</span>
        </label>
        <p className="mt-1 text-xs text-muted">
          팀에게 전달하고 싶은 의견이 있다면 적어주세요.
        </p>
        <TextArea
          id="eval-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          className="mt-3"
        />
      </Card>

      {error && (
        <div className="mt-4">
          <Alert tone="error" title="평가를 저장하지 못했습니다">
            {error.message}
          </Alert>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={pending} disabled={!allScored}>
          {target.evaluated ? "평가 수정하기" : "평가 제출하기"}
        </Button>

        {previewTotal !== null && (
          <p className="text-sm text-muted">
            환산 점수{" "}
            <strong className="text-[var(--text)]">{formatScore(previewTotal)}</strong> / 100
          </p>
        )}
        {!allScored && (
          <p className="text-sm text-amber-600">모든 항목에 점수를 매겨주세요.</p>
        )}
      </div>

      {savedScore !== null && (
        <p className="mt-3 text-xs text-emerald-600">
          저장된 점수 — {formatScore(savedScore)} / 100
        </p>
      )}
    </form>
  );
}

function CriterionRow({
  criterion,
  value,
  onChange,
}: {
  criterion: Criterion;
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{criterion.name}</p>
          {criterion.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {criterion.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-subtle">
          가중치 {Math.round(criterion.weight * 100)}% · {criterion.maxScore}점 만점
        </span>
      </div>

      <div className="mt-3">
        <ScoreSelector
          name={criterion.name}
          value={value}
          maxScore={criterion.maxScore}
          onChange={onChange}
        />
      </div>
    </Card>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 text-xs font-semibold hover:bg-[var(--bg-muted)]"
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
