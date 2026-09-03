"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Countdown } from "@/components/countdown";
import { Button, Field, TextArea, TextInput } from "@/components/form";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Section,
  Spinner,
  TrackBadge,
  cx,
  trackStyle,
} from "@/components/ui";
import { ApiError, api, publicApi } from "@/lib/api";
import { formatBytes, formatDateTime } from "@/lib/format";
import { SUBMISSION_FIELDS, type SubmissionField } from "@/lib/track-rules";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { HackathonEvent, Submission, SubmissionInput, Team } from "@/lib/types";

export default function SubmitPage() {
  return (
    <AuthGate>
      <SubmitContent />
    </AuthGate>
  );
}

function SubmitContent() {
  const { token } = useAuth();

  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);
  const teamQuery = useApiQuery(token ? () => api.getMyTeam(token) : null, [token]);
  const submissionQuery = useApiQuery(
    token ? () => api.getMySubmission(token) : null,
    [token],
  );

  if (teamQuery.loading || eventQuery.loading || submissionQuery.loading) {
    return <Spinner />;
  }

  if (!teamQuery.data) {
    return (
      <Section title="산출물 제출">
        <EmptyState
          title="소속된 팀이 없습니다"
          description="산출물을 제출하려면 먼저 팀을 등록해야 합니다."
          action={
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              팀 등록하러 가기
            </Link>
          }
        />
      </Section>
    );
  }

  return (
    <SubmissionForm
      team={teamQuery.data}
      event={eventQuery.data}
      existing={submissionQuery.data ?? null}
      onSaved={submissionQuery.reload}
    />
  );
}

/** 폼 상태는 문자열 필드만 다루므로 별도 타입으로 좁힌다. */
type FormState = {
  projectName: string;
  summary: string;
  description: string;
  planFileUrl: string;
  prototypeUrl: string;
  sourceCodeUrl: string;
  deckFileUrl: string;
  demoUrl: string;
  deployUrl: string;
  architectureFileUrl: string;
  techSpecFileUrl: string;
  techStacks: string;
};

const EMPTY_FORM: FormState = {
  projectName: "",
  summary: "",
  description: "",
  planFileUrl: "",
  prototypeUrl: "",
  sourceCodeUrl: "",
  deckFileUrl: "",
  demoUrl: "",
  deployUrl: "",
  architectureFileUrl: "",
  techSpecFileUrl: "",
  techStacks: "",
};

function toFormState(submission: Submission | null): FormState {
  if (!submission) return EMPTY_FORM;
  return {
    projectName: submission.projectName ?? "",
    summary: submission.summary ?? "",
    description: submission.description ?? "",
    planFileUrl: submission.planFileUrl ?? "",
    prototypeUrl: submission.prototypeUrl ?? "",
    sourceCodeUrl: submission.sourceCodeUrl ?? "",
    deckFileUrl: submission.deckFileUrl ?? "",
    demoUrl: submission.demoUrl ?? "",
    deployUrl: submission.deployUrl ?? "",
    architectureFileUrl: submission.architectureFileUrl ?? "",
    techSpecFileUrl: submission.techSpecFileUrl ?? "",
    techStacks: (submission.techStacks ?? []).join(", "),
  };
}

function SubmissionForm({
  team,
  event,
  existing,
  onSaved,
}: {
  team: Team;
  event: HackathonEvent | undefined;
  existing: Submission | null;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(() => toFormState(existing));
  const [savedAt, setSavedAt] = useState<string | null>(existing?.submittedAt ?? null);
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);
  // 카운트다운이 0에 닿으면 폼을 잠근다 (서버도 동일하게 거부한다)
  const [expired, setExpired] = useState(false);

  const fields = SUBMISSION_FIELDS[team.track];
  const deadline =
    team.track === "SPARK" ? event?.sparkSubmitDeadline : event?.devSubmitDeadline;
  const serverOpen = event?.submissionOpen[team.track] ?? true;
  const locked = !serverOpen || expired;

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    const payload: SubmissionInput = {
      projectName: form.projectName.trim(),
      summary: form.summary.trim(),
      description: form.description.trim() || undefined,
      techStacks: form.techStacks
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    // 이 트랙에서 쓰는 항목만 보낸다. 다른 트랙 필드를 함께 보내면
    // Spark의 소스코드 금지 검사에 걸릴 수 있다.
    for (const field of fields) {
      const value = form[field.field as keyof FormState];
      if (typeof value === "string" && value.trim()) {
        payload[field.field] = value.trim() as never;
      }
    }
    return api.saveSubmission(token, payload);
  });

  const finalizeMutation = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.finalizeSubmission(token);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinalizeMessage(null);
    const result = await saveMutation.run();
    if (result) {
      setSavedAt(result.submittedAt);
      onSaved();
    }
  };

  const handleFinalize = async () => {
    setFinalizeMessage(null);
    const result = await finalizeMutation.run();
    if (result) {
      setFinalizeMessage("최종 제출이 확정되었습니다. 마감 전까지 계속 수정할 수 있습니다.");
      onSaved();
    }
  };

  const style = trackStyle(team.track);
  const missing = existing?.missingRequirements ?? [];

  return (
    <Section
      eyebrow="Submission"
      title="산출물 제출"
      description="마감 전까지 몇 번이든 저장할 수 있습니다. 마지막으로 저장된 내용이 심사 대상이 됩니다."
    >
      {/* 상단 상태 바 */}
      <Card className={cx("ring-1", style.ring)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrackBadge track={team.track} />
              <span className="font-bold">{team.name}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              제출 마감 · {formatDateTime(deadline)}
            </p>
          </div>

          {event && deadline && serverOpen && (
            <Countdown
              deadline={deadline}
              serverTime={event.serverTime}
              label="제출 마감까지"
              onExpire={() => setExpired(true)}
            />
          )}
        </div>
      </Card>

      {locked && (
        <div className="mt-4">
          <Alert tone="error" title="제출이 마감되었습니다">
            마감 시각이 지나 더 이상 저장할 수 없습니다. 마지막으로 저장된 내용이 심사
            대상입니다.
          </Alert>
        </div>
      )}

      {team.track === "SPARK" && (
        <div className="mt-4">
          <Alert tone="warning" title="Spark 트랙 제출 규정">
            구현된 코드와 구동 프로그램은 제출할 수 없습니다. 기획서와 프로토타입만으로
            평가합니다.
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handleSave} className="space-y-8">
          <fieldset disabled={locked} className="space-y-5">
            <legend className="text-base font-bold">프로젝트 기본 정보</legend>

            <Field label="프로젝트명" required>
              {(id) => (
                <TextInput
                  id={id}
                  value={form.projectName}
                  onChange={(e) => set("projectName")(e.target.value)}
                  maxLength={100}
                  required
                />
              )}
            </Field>

            <Field
              label="한 줄 요약"
              required
              hint="평가 화면에서 다른 참가자들에게 보이는 설명입니다"
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={form.summary}
                  onChange={(e) => set("summary")(e.target.value)}
                  maxLength={300}
                  required
                />
              )}
            </Field>

            <Field label="상세 설명">
              {(id) => (
                <TextArea
                  id={id}
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  maxLength={3000}
                  className="min-h-32"
                />
              )}
            </Field>

            {team.track !== "SPARK" && (
              <Field label="기술 스택" hint="쉼표로 구분해 입력해 주세요">
                {(id) => (
                  <TextInput
                    id={id}
                    value={form.techStacks}
                    onChange={(e) => set("techStacks")(e.target.value)}
                    placeholder="React, Spring Boot, PostgreSQL"
                  />
                )}
              </Field>
            )}
          </fieldset>

          <fieldset disabled={locked} className="space-y-4">
            <legend className="text-base font-bold">제출 항목</legend>
            <p className="text-sm text-muted">
              파일을 올리거나 외부 링크(GitHub, Google Drive, Figma 등)를 붙여 넣을 수
              있습니다.
              {event && ` 파일당 최대 ${event.maxUploadMb}MB입니다.`}
            </p>

            {fields.map((field) => (
              <SubmissionSlot
                key={field.field}
                field={field}
                value={form[field.field as keyof FormState] as string}
                onChange={set(field.field as keyof FormState)}
                disabled={locked}
              />
            ))}
          </fieldset>

          {saveMutation.error && (
            <Alert tone="error" title="저장하지 못했습니다">
              {saveMutation.error.message}
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={saveMutation.pending} disabled={locked}>
              저장하기
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              loading={finalizeMutation.pending}
              disabled={locked || !existing}
              onClick={handleFinalize}
            >
              최종 제출 확정
            </Button>
          </div>

          {finalizeMutation.error && (
            <Alert tone="error" title="최종 제출을 확정하지 못했습니다">
              {finalizeMutation.error.message}
            </Alert>
          )}
          {finalizeMessage && <Alert tone="success">{finalizeMessage}</Alert>}
        </form>

        {/* 제출 현황 패널 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              제출 현황
            </p>

            <div className="mt-3">
              {existing ? (
                existing.complete ? (
                  <Badge tone="success">필수 항목 모두 충족</Badge>
                ) : (
                  <Badge tone="warning">필수 항목 미충족</Badge>
                )
              ) : (
                <Badge tone="neutral">아직 저장 전</Badge>
              )}
            </div>

            {savedAt && (
              <p className="mt-3 text-xs text-muted">
                마지막 저장 · {formatDateTime(savedAt)}
              </p>
            )}

            <ul className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
              {fields
                .filter((f) => f.required)
                .map((field) => {
                  const filled = Boolean(
                    (form[field.field as keyof FormState] as string)?.trim(),
                  );
                  return (
                    <li key={field.field} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden="true"
                        className={cx(
                          "grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white",
                          filled ? "bg-emerald-500" : "bg-[var(--border-strong)]",
                        )}
                      >
                        {filled ? "✓" : ""}
                      </span>
                      <span className={filled ? "text-muted" : "font-medium"}>
                        {field.label}
                      </span>
                    </li>
                  );
                })}
            </ul>

            {missing.length > 0 && (
              <p className="mt-4 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                서버 기준 누락 항목: {missing.join(", ")}
              </p>
            )}
          </Card>
        </div>
      </div>
    </Section>
  );
}

/**
 * 제출 항목 하나. 링크 입력과 파일 업로드를 함께 제공한다.
 * 업로드가 끝나면 받은 URL을 그대로 입력란에 채워 넣는다.
 */
function SubmissionSlot({
  field,
  value,
  onChange,
  disabled,
}: {
  field: SubmissionField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadFile(token, field.slot, file);
      onChange(result.url);
      setUploadedName(`${file.name} (${formatBytes(result.sizeBytes)})`);
    } catch (e) {
      setUploadError(
        e instanceof ApiError ? e.message : "업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
      // 같은 파일을 다시 고를 수 있도록 초기화한다
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {field.label}
            {field.required && <span className="ml-1 text-brand-600">*</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted">{field.description}</p>
        </div>
        {value && <Badge tone="success">입력됨</Badge>}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <TextInput
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://..."
          className="flex-1"
          aria-label={`${field.label} 링크`}
        />

        {field.uploadable && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
              aria-label={`${field.label} 파일 선택`}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              파일 업로드
            </Button>
          </>
        )}
      </div>

      {uploadedName && (
        <p className="mt-2 text-xs text-emerald-600">업로드 완료 — {uploadedName}</p>
      )}
      {uploadError && (
        <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>
      )}
    </Card>
  );
}
