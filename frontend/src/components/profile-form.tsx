"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { cleanPersonName } from "@/lib/format";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { User } from "@/lib/types";
import { Button, CheckCard, Field, TextInput } from "./form";
import { Alert, Card, Spinner } from "./ui";

/**
 * 성명·학번·전화번호와 개인정보 수집·이용 동의.
 *
 * 동의는 본인에게 직접 받는다. 팀 등록 폼에서 팀장이 팀원 몫까지 한꺼번에 동의하던
 * 방식은 동의라고 보기 어려웠다.
 *
 * 두 자리에서 같은 폼을 쓴다 — 처음 로그인했을 때 관문이 띄우는 자리와, 나중에
 * 전화번호를 고치러 들어오는 /profile이다. editing이면 문구만 바뀐다.
 */
export function ProfileForm({
  editing = false,
  initial,
}: {
  editing?: boolean;
  /** 고치러 들어왔을 때 채워 둘 기존 값 */
  initial?: Partial<Pick<User, "name" | "studentId" | "department" | "phone" | "privacyConsent">>;
}) {
  const { token, user, refresh } = useAuth();
  const [name, setName] = useState(() => initial?.name ?? cleanPersonName(user?.name));
  // 전화번호·동의가 생기기 전에 가입한 사람은 이 화면을 다시 보게 된다.
  // 이미 낸 학번까지 다시 치게 할 이유는 없다.
  const [studentId, setStudentId] = useState(
    () => initial?.studentId ?? user?.studentId ?? "",
  );
  const [department, setDepartment] = useState(
    () => initial?.department ?? "정보시스템학과",
  );
  const [phone, setPhone] = useState(() => initial?.phone ?? "");
  // 한 번 동의한 사람은 고치러 들어왔을 때 다시 체크하지 않아도 된다
  const [consent, setConsent] = useState(() => Boolean(initial?.privacyConsent));
  const [done, setDone] = useState(false);

  const { run, pending, error } = useApiMutation(
    async (input: {
      name: string;
      studentId: string;
      department: string;
      phone: string;
      privacyConsent: boolean;
    }) => {
      if (!token) throw new Error("no token");
      return api.updateProfile(token, input);
    },
  );

  const fieldError = (field: string) =>
    error?.fields?.find((f) => f.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run({
      name: name.trim(),
      studentId: studentId.trim(),
      department,
      phone: phone.trim(),
      privacyConsent: consent,
    });
    if (result) {
      setDone(true);
      // 세션의 profileCompleted를 갱신해 관문을 통과시킨다
      await refresh();
    }
  };

  if (done && !editing) {
    return <Spinner label="프로필 저장 완료. 이동 중" />;
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <Card className="p-7">
        <h1 className="font-display text-2xl tracking-tight">
          {editing ? "내 정보" : "프로필 등록"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {editing
            ? "전화번호가 바뀌었거나 잘못 입력했다면 여기서 고칠 수 있습니다."
            : "참가자 명단 작성과 연락을 위해 한 번만 입력해 주세요. 이미 입력한 항목은 채워져 있습니다."}
        </p>

        {error && !error.fields && (
          <div className="mt-5">
            <Alert tone="error">{error.message}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Field label="성명" required error={fieldError("name")}>
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                maxLength={50}
                invalid={Boolean(fieldError("name"))}
              />
            )}
          </Field>

          <Field
            label="학번"
            required
            hint="숫자만 입력해 주세요"
            error={fieldError("studentId")}
          >
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                required
                maxLength={12}
                placeholder="20241234"
                invalid={Boolean(fieldError("studentId"))}
              />
            )}
          </Field>

          <Field
            label="전화번호"
            required
            hint="운영진이 연락할 번호입니다"
            error={fieldError("phone")}
          >
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="numeric"
                required
                maxLength={13}
                placeholder="010-1234-5678"
                invalid={Boolean(fieldError("phone"))}
              />
            )}
          </Field>

          <Field label="학과" error={fieldError("department")}>
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                maxLength={50}
              />
            )}
          </Field>

          <div className="border-t-2 border-current/10 pt-5">
            <h2 className="text-sm font-bold">개인정보 수집·이용 동의</h2>

            <Card className="mt-3 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-[var(--text)]">수집 항목</strong> — 성명, 학번,
                한양대학교 이메일, 전화번호, 학생회비 납부 여부
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">수집 목적</strong> — 참가자 확인, 팀
                구성 및 연락, 참가비 확인, 결과물 제출·평가 진행, 시상
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">보유·이용 기간</strong> — 행사 종료 후
                3개월 이내 파기
              </p>
              <p className="mt-2">
                다른 참가자에게는 <strong className="text-[var(--text)]">성명과 학번</strong>만
                공개됩니다. 전화번호·이메일·학생회비 납부 여부는 같은 팀과 운영진만 봅니다.
              </p>
              <p className="mt-2">
                동의를 거부할 수 있으나, 참가자 확인에 필요한 정보라 거부하면 참가가
                제한됩니다.
              </p>
            </Card>

            <div className="mt-3">
              <CheckCard
                checked={consent}
                onChange={setConsent}
                label="개인정보 수집·이용에 동의합니다"
                description="본인이 직접 동의합니다."
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={pending}
            disabled={!consent}
          >
            {editing ? "저장" : "저장하고 계속하기"}
          </Button>
          {done && editing && (
            <p className="text-center text-sm text-emerald-600">저장했습니다</p>
          )}
        </form>
      </Card>
    </div>
  );
}
