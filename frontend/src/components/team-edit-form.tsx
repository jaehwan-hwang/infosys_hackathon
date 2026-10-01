"use client";

import { useState } from "react";
import { Button, Field, TextArea, TextInput } from "@/components/form";
import { Alert, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { Team } from "@/lib/types";

/**
 * 팀명·한 줄 주제·팀 소개 수정. 조장만 쓸 수 있고 신청 기간에만 열린다.
 * 트랙은 여기서 바꿀 수 없다 — 바꾸려면 운영진이 정정해야 한다.
 */
export function TeamEditForm({
  team,
  disabled,
  onUpdated,
}: {
  team: Team;
  disabled: boolean;
  onUpdated: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState(team.name);
  const [topic, setTopic] = useState(team.topic ?? "");
  const [description, setDescription] = useState(team.description ?? "");
  const [saved, setSaved] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.updateTeam(token, team.teamId, {
      name: name.trim(),
      topic: topic.trim() || undefined,
      description: description.trim() || undefined,
    });
  });

  const dirty =
    name.trim() !== team.name ||
    topic.trim() !== (team.topic ?? "") ||
    description.trim() !== (team.description ?? "");

  const fieldError = (field: string) =>
    error?.fields?.find((f) => f.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await run();
    if (updated) {
      setSaved(true);
      onUpdated();
    }
  };

  return (
    <Card>
      <h3 className="text-base font-bold">팀 정보 수정</h3>
      <p className="mt-1.5 text-sm text-muted">
        {disabled
          ? "신청 기간이 끝나 수정할 수 없습니다."
          : "팀명, 한 줄 주제, 팀 소개를 언제든 고칠 수 있습니다."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <Field label="팀명" required error={fieldError("name")}>
          {(id, describedBy) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              maxLength={60}
              required
              disabled={disabled}
              invalid={Boolean(fieldError("name"))}
            />
          )}
        </Field>

        <Field label="한 줄 주제">
          {(id, describedBy) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSaved(false);
              }}
              maxLength={200}
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="팀 소개">
          {(id, describedBy) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaved(false);
              }}
              maxLength={1000}
              disabled={disabled}
            />
          )}
        </Field>

        {error && !error.fields && <Alert tone="error">{error.message}</Alert>}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={pending} disabled={disabled || !dirty || !name.trim()}>
            수정 저장
          </Button>
          {saved && !dirty && <span className="text-sm text-emerald-600">저장했습니다</span>}
        </div>
      </form>
    </Card>
  );
}
