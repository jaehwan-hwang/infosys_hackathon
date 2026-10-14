"use client";

import { useState } from "react";
import { Button, Field, TextInput } from "@/components/form";
import { DuesChoice } from "@/components/team-register-form";
import { Alert, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { maskStudentId } from "@/lib/format";
import { LIMITS } from "@/lib/limits";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { Team, TeamMember, TeamMemberInput } from "@/lib/types";

/**
 * 우리 팀 팀원 목록. 팀장에게는 빼기 버튼과 추가 칸이 함께 붙는다.
 *
 * 등록한 뒤에 사람이 바뀌는 일이 잦다 — 한 명이 빠지거나, 뒤늦게 합류하거나.
 * 지금까지는 팀을 지우고 다시 등록하는 수밖에 없었다.
 *
 * 두 사람은 뺄 수 없다. 팀장은 결과물을 낼 사람이고, 팀을 등록한 사람은 팀 기록이
 * 그 계정을 가리키고 있어서다. 서버도 막지만, 버튼부터 안 보여야 눌렀다가 거절당하지 않는다.
 */
const EMPTY: TeamMemberInput = { name: "", studentId: "", email: "", duesPaid: true };

export function TeamMembersEditor({
  team,
  canManage,
  registrationOpen,
  minTeamSize,
  maxTeamSize,
  onChanged,
}: {
  team: Team;
  canManage: boolean;
  registrationOpen: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  onChanged: () => void;
}) {
  const editable = canManage && registrationOpen;
  const canRemoveMore = team.memberCount > minTeamSize;
  const canAddMore = team.memberCount < maxTeamSize;

  return (
    <div>
      <ul className="space-y-2">
        {team.members.map((member) => (
          <MemberRow
            key={member.teamMemberId}
            team={team}
            member={member}
            removable={editable && canRemoveMore && isRemovable(team, member)}
            onRemoved={onChanged}
          />
        ))}
      </ul>

      {editable && !canRemoveMore && team.memberCount > 1 && (
        <p className="mt-3 text-xs text-subtle">
          최소 인원({minTeamSize}명)이라 더 뺄 수 없습니다. 먼저 팀원을 추가해 주세요.
        </p>
      )}

      {editable && (
        <div className="mt-5">
          {canAddMore ? (
            <AddMemberForm team={team} onAdded={onChanged} />
          ) : (
            <p className="text-xs text-subtle">최대 인원({maxTeamSize}명)이 찼습니다.</p>
          )}
        </div>
      )}

      {canManage && !registrationOpen && (
        <p className="mt-4 text-xs text-subtle">
          신청 기간이 끝나 팀원을 바꿀 수 없습니다. 바꿔야 하면 운영진에게 문의해 주세요.
        </p>
      )}
    </div>
  );
}

/** 팀장과 팀을 등록한 사람이 아니면 뺄 수 있다 */
function isRemovable(team: Team, member: TeamMember): boolean {
  if (member.role === "LEADER") return false;
  if (member.userId !== null && member.userId === team.leaderId) return false;
  return true;
}

function MemberRow({
  team,
  member,
  removable,
  onRemoved,
}: {
  team: Team;
  member: TeamMember;
  removable: boolean;
  onRemoved: () => void;
}) {
  const { token } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.removeTeamMember(token, team.teamId, member.teamMemberId);
  });

  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {member.role === "LEADER" && (
          <span className="rounded-full bg-grad-brand px-2 py-0.5 text-[10px] font-bold text-white">
            팀장
          </span>
        )}
        <span className="font-bold">{member.name}</span>
        {member.studentId && <span className="text-subtle">{maskStudentId(member.studentId)}</span>}
        {member.email && <span className="text-subtle">{member.email}</span>}
        {!member.linked && <span className="text-xs text-amber-600">로그인 대기</span>}

        {removable && (
          <span className="ml-auto flex items-center gap-2">
            {confirming ? (
              <>
                <span className="text-xs text-amber-600">{member.name} 님을 뺄까요?</span>
                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => setConfirming(false)}
                >
                  취소
                </Button>
                <Button
                  variant="danger"
                  className="h-8 px-3 text-xs"
                  loading={pending}
                  onClick={async () => {
                    const result = await run();
                    if (result) {
                      setConfirming(false);
                      onRemoved();
                    }
                  }}
                >
                  빼기
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs text-red-600"
                onClick={() => setConfirming(true)}
              >
                빼기
              </Button>
            )}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </li>
  );
}

function AddMemberForm({ team, onAdded }: { team: Team; onAdded: () => void }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<TeamMemberInput>(EMPTY);

  const { run, pending, error, clearError } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.addTeamMember(token, team.teamId, {
      ...input,
      name: input.name.trim(),
      email: input.email.trim(),
    });
  });

  const fieldError = (field: string) => error?.fields?.find((f) => f.field === field)?.message;
  const set = (patch: Partial<TeamMemberInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
    clearError();
  };

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        + 팀원 추가
      </Button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run();
    if (result) {
      setInput(EMPTY);
      setOpen(false);
      onAdded();
    }
  };

  return (
    <Card>
      <h4 className="text-sm font-bold">팀원 추가</h4>
      <p className="mt-1 text-xs text-subtle">
        한양대학교 이메일을 정확히 적어 주세요. 그 이메일로 로그인하면 자동으로 팀에 연결됩니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="성명" required error={fieldError("name")}>
            {(id) => (
              <TextInput
                id={id}
                value={input.name}
                onChange={(e) => set({ name: e.target.value })}
                maxLength={LIMITS.memberName}
                required
              />
            )}
          </Field>
          <Field label="학번" required error={fieldError("studentId")}>
            {(id) => (
              <TextInput
                id={id}
                value={input.studentId}
                onChange={(e) => set({ studentId: e.target.value.replace(/[^0-9]/g, "") })}
                inputMode="numeric"
                maxLength={12}
                required
                invalid={Boolean(fieldError("studentId"))}
              />
            )}
          </Field>
          <Field label="이메일" required error={fieldError("email")}>
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={input.email}
                onChange={(e) => set({ email: e.target.value })}
                maxLength={120}
                required
                placeholder="id@hanyang.ac.kr"
                invalid={Boolean(fieldError("email"))}
              />
            )}
          </Field>
        </div>

        <div className="mt-3">
          <DuesChoice
            name="dues-new-member"
            value={input.duesPaid}
            onChange={(v) => set({ duesPaid: v })}
          />
        </div>

        {error && !error.fields?.length && (
          <div className="mt-3">
            <Alert tone="error">{error.message}</Alert>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button type="submit" loading={pending}>
            추가하기
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setOpen(false);
              setInput(EMPTY);
              clearError();
            }}
          >
            취소
          </Button>
        </div>
      </form>
    </Card>
  );
}
