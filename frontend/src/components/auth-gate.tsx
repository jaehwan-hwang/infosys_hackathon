"use client";

import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/use-auth";
import type { Role } from "@/lib/types";
import { Button } from "./form";
import { ProfileForm } from "./profile-form";
import { Alert, EmptyState, Spinner } from "./ui";

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
              ? "운영진만 접근 가능한 권한입니다."
              : "교수 심사위원만 볼 수 있는 페이지입니다. 접근이 필요하면 운영진에게 문의해 주세요."
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
