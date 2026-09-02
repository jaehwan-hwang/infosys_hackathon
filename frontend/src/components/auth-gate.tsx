"use client";

import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { Role } from "@/lib/types";
import { Button, Field, TextInput } from "./form";
import { Alert, Card, EmptyState, Spinner } from "./ui";

/**
 * 로그인·프로필·권한을 한 번에 확인하는 관문.
 *
 * 통과하지 못하면 자식을 렌더링하지 않고 그 이유에 맞는 화면을 대신 보여준다.
 * 화면 접근을 막는 것이 목적이 아니라 안내가 목적이고, 실제 차단은 백엔드가 한다.
 */
export function AuthGate({
  children,
  requireProfile = true,
  requireRole,
}: {
  children: ReactNode;
  /** 학번 입력이 끝난 사용자만 통과시킬지 */
  requireProfile?: boolean;
  /** 이 권한을 가진 사용자만 통과시킨다 */
  requireRole?: Role[];
}) {
  const { isLoading, isAuthenticated, needsProfile, role, authError } = useAuth();
  const pathname = usePathname();

  if (isLoading) return <Spinner label="로그인 상태 확인 중" />;

  if (authError) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <Alert tone="error" title="로그인을 완료하지 못했습니다">
          {authError}
        </Alert>
        <Button className="mt-4 w-full" onClick={() => signIn("google")}>
          다시 로그인하기
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <EmptyState
          title="로그인이 필요합니다"
          description="한양대학교 Google 계정으로 로그인한 뒤 이용할 수 있습니다."
          action={
            <Button onClick={() => signIn("google", { callbackUrl: pathname })}>
              Google 계정으로 로그인
            </Button>
          }
        />
      </div>
    );
  }

  if (requireProfile && needsProfile) {
    return <ProfileForm />;
  }

  if (requireRole && role && !requireRole.includes(role)) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <EmptyState
          title="접근 권한이 없습니다"
          description={
            requireRole.includes("ADMIN")
              ? "학생회 운영진만 볼 수 있는 페이지입니다."
              : "교수 심사위원만 볼 수 있는 페이지입니다. 접근이 필요하면 운영진에게 문의해 주세요."
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 최초 로그인 후 학번·성명을 받는다.
 * 이 정보가 없으면 팀 등록 시 참가자 명단을 만들 수 없어 먼저 받는다.
 */
function ProfileForm() {
  const { token, user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("정보시스템학과");
  const [done, setDone] = useState(false);

  const { run, pending, error } = useApiMutation(
    async (input: { name: string; studentId: string; department: string }) => {
      if (!token) throw new Error("no token");
      return api.updateProfile(token, input);
    },
  );

  const fieldError = (field: string) =>
    error?.fields?.find((f) => f.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run({ name: name.trim(), studentId: studentId.trim(), department });
    if (result) {
      setDone(true);
      // 세션의 profileCompleted를 갱신해 관문을 통과시킨다
      await refresh();
    }
  };

  if (done) {
    return <Spinner label="프로필 저장 완료. 이동 중" />;
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <Card className="p-7">
        <h1 className="text-lg font-bold">프로필 등록</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          처음 로그인하셨네요. 참가자 명단 작성을 위해 성명과 학번을 한 번만 입력해 주세요.
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

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            저장하고 계속하기
          </Button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-subtle">
          입력한 정보는 해커톤 참가자 확인과 시상 목적으로만 사용되며, 행사 종료 후
          파기됩니다.
        </p>
      </Card>
    </div>
  );
}
