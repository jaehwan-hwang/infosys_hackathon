"use client";

import { useState } from "react";
import { Button, Field, TextInput } from "@/components/form";
import { Alert, Card, Spinner } from "@/components/ui";
import { api, publicApi } from "@/lib/api";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { HackathonEvent } from "@/lib/types";

/**
 * 행사 일정·규정 설정.
 *
 * 신청을 언제부터 받을지, 제출 폼을 언제 열지가 모두 여기에 달려 있다.
 * 입력은 한국 시간으로 받고 서버에는 UTC로 보낸다 — 운영진이 UTC를 계산하게 둘 수 없다.
 */
export function AdminEventForm() {
  const { token } = useAuth();
  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);

  if (eventQuery.loading) return <Spinner />;
  if (eventQuery.error) return <Alert tone="error">{eventQuery.error}</Alert>;
  if (!eventQuery.data || !token) return null;

  return <EventForm event={eventQuery.data} onSaved={eventQuery.reload} />;
}

/** UTC ISO 문자열 → datetime-local 입력값(한국 시간) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

/** datetime-local 입력값(한국 시간) → UTC ISO 문자열 */
function toUtcIso(local: string): string | null {
  if (!local) return null;
  return new Date(new Date(`${local}:00Z`).getTime() - 9 * 60 * 60 * 1000).toISOString();
}

function EventForm({
  event,
  onSaved,
}: {
  event: HackathonEvent;
  onSaved: () => void;
}) {
  const { token } = useAuth();

  const [title, setTitle] = useState(event.title);
  const [registerStartsAt, setRegisterStartsAt] = useState(toLocalInput(event.registerStartsAt));
  const [registerEndsAt, setRegisterEndsAt] = useState(toLocalInput(event.registerEndsAt));
  const [submitOpensAt, setSubmitOpensAt] = useState(toLocalInput(event.submitOpensAt));
  const [sparkDeadline, setSparkDeadline] = useState(toLocalInput(event.sparkSubmitDeadline));
  const [devDeadline, setDevDeadline] = useState(toLocalInput(event.devSubmitDeadline));
  const [minTeamSize, setMinTeamSize] = useState(String(event.minTeamSize));
  const [maxTeamSize, setMaxTeamSize] = useState(String(event.maxTeamSize));
  const [maxUploadMb, setMaxUploadMb] = useState(String(event.maxUploadMb));
  const [saved, setSaved] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.admin.updateEvent(token, {
      title: title.trim(),
      theme: event.theme ?? undefined,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      contactUrl: event.contactUrl ?? undefined,
      registerStartsAt: toUtcIso(registerStartsAt),
      registerEndsAt: toUtcIso(registerEndsAt),
      submitOpensAt: toUtcIso(submitOpensAt),
      sparkSubmitDeadline: toUtcIso(sparkDeadline),
      devSubmitDeadline: toUtcIso(devDeadline),
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      maxUploadMb: Number(maxUploadMb),
    });
  });

  const times: {
    label: string;
    hint: string;
    value: string;
    set: (v: string) => void;
  }[] = [
    {
      label: "신청 시작",
      hint: "비우면 지금 바로 신청을 받습니다",
      value: registerStartsAt,
      set: setRegisterStartsAt,
    },
    {
      label: "신청 마감",
      hint: "이 시각이 지나면 팀 등록과 합치기가 닫힙니다",
      value: registerEndsAt,
      set: setRegisterEndsAt,
    },
    {
      label: "결과물 제출 시작",
      hint: "행사 당일로 잡아 주세요. 그 전에는 제출 화면이 열리지 않습니다",
      value: submitOpensAt,
      set: setSubmitOpensAt,
    },
    {
      label: "Spark 제출 마감",
      hint: "1일차 18:00",
      value: sparkDeadline,
      set: setSparkDeadline,
    },
    {
      label: "Sprint · Summit 제출 마감",
      hint: "2일차 18:00",
      value: devDeadline,
      set: setDevDeadline,
    },
  ];

  const numbers: { label: string; value: string; set: (v: string) => void }[] = [
    { label: "최소 인원", value: minTeamSize, set: setMinTeamSize },
    { label: "최대 인원", value: maxTeamSize, set: setMaxTeamSize },
    { label: "업로드 한도(MB)", value: maxUploadMb, set: setMaxUploadMb },
  ];

  return (
    <Card>
      <h2 className="text-base font-bold">행사 일정</h2>
      <p className="mt-1.5 text-sm text-muted">
        모든 시각은 한국 시간입니다. 비워 두면 그 제한이 없는 것으로 봅니다.
      </p>

      <div className="mt-5 space-y-5">
        <Field label="행사명" required>
          {(id) => (
            <TextInput
              id={id}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
              maxLength={100}
              required
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {times.map((t) => (
            <Field key={t.label} label={t.label} hint={t.hint}>
              {(id, describedBy) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  type="datetime-local"
                  value={t.value}
                  onChange={(e) => {
                    t.set(e.target.value);
                    setSaved(false);
                  }}
                />
              )}
            </Field>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {numbers.map((n) => (
            <Field key={n.label} label={n.label}>
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  inputMode="numeric"
                  value={n.value}
                  onChange={(e) => {
                    n.set(e.target.value);
                    setSaved(false);
                  }}
                  min={1}
                />
              )}
            </Field>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error.message}</Alert>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button
          loading={pending}
          onClick={async () => {
            const updated = await run();
            if (updated) {
              setSaved(true);
              onSaved();
            }
          }}
        >
          저장
        </Button>
        {saved && <span className="text-sm text-emerald-600">저장했습니다</span>}
      </div>
    </Card>
  );
}
