"use client";

import { useState } from "react";
import { Button, Field, TextInput } from "@/components/form";
import { Alert, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { Team } from "@/lib/types";

/**
 * 팀명 수정. 조장만 쓸 수 있고 신청 기간에만 열린다.
 *
 * 신청 단계에서 받는 것이 팀명뿐이라 고칠 것도 팀명뿐이다. 트랙은 여기서 바꿀 수
 * 없다 — 바꾸려면 운영진이 정정해야 한다.
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
  const [saved, setSaved] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.updateTeam(token, team.teamId, { name: name.trim() });
  });

  const dirty = name.trim() !== team.name;

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
      <h3 className="text-base font-bold">팀명 수정</h3>
      <p className="mt-1.5 text-sm text-muted">
        {disabled
          ? "신청 기간이 끝나 수정할 수 없습니다."
          : "신청 기간 동안 언제든 고칠 수 있습니다."}
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
