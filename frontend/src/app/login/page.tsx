"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Button } from "@/components/form";
import { Alert, Card } from "@/components/ui";

const ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

const ERROR_MESSAGES: Record<string, string> = {
  domain: `@${ALLOWED_DOMAIN} 이메일로만 로그인할 수 있습니다. 한양대학교 계정으로 다시 시도해 주세요.`,
  OAuthAccountNotLinked: "이미 다른 방식으로 가입된 이메일입니다.",
  AccessDenied: "로그인이 거부되었습니다.",
  Configuration: "로그인 설정에 문제가 있습니다. 운영진에게 문의해 주세요.",
};

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const errorKey = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/";

  // 로그인된 상태로 이 페이지에 오면 원래 가려던 곳으로 보낸다
  useEffect(() => {
    if (status === "authenticated" && !session?.authError) {
      router.replace(callbackUrl);
    }
  }, [status, session?.authError, callbackUrl, router]);

  const errorMessage = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "로그인 중 문제가 발생했습니다.")
    : session?.authError;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-20">
      <Card className="p-8">
        <h1 className="text-xl font-bold">로그인</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          한양대학교 Google 계정(@{ALLOWED_DOMAIN})으로 로그인합니다. 팀 등록, 산출물 제출,
          평가에 모두 같은 계정을 사용합니다.
        </p>

        {errorMessage && (
          <div className="mt-5">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleMark />
          Google 계정으로 계속하기
        </Button>

        <p className="mt-5 text-xs leading-relaxed text-subtle">
          로그인 시 이름과 이메일이 수집되며, 최초 1회 학번을 추가로 입력받습니다. 수집된
          정보는 해커톤 운영 목적으로만 사용되고 행사 종료 후 파기됩니다.
        </p>
      </Card>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#fff"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#fff"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z"
        opacity=".9"
      />
      <path
        fill="#fff"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z"
        opacity=".75"
      />
      <path
        fill="#fff"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
        opacity=".85"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20" />}>
      <LoginContent />
    </Suspense>
  );
}
