"use client";

import { AuthGate } from "@/components/auth-gate";
import { ProfileForm } from "@/components/profile-form";
import { Alert, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApiQuery, useAuth } from "@/lib/use-auth";

/**
 * 내 정보.
 *
 * 전화번호를 잘못 넣었을 때 고칠 자리가 없으면 운영진이 연락할 길이 막힌다.
 * 관문이 띄우는 프로필 화면과 같은 폼을 쓰되, 서버에 저장된 값을 채워 둔다.
 */
export default function ProfilePage() {
  return (
    <AuthGate requireProfile={false}>
      <ProfileContent />
    </AuthGate>
  );
}

function ProfileContent() {
  const { token } = useAuth();
  const meQuery = useApiQuery(token ? (signal) => api.getMe(token, signal) : null, [token]);

  if (meQuery.loading) return <Spinner />;
  if (meQuery.error) return <Alert tone="error">{meQuery.error}</Alert>;

  return <ProfileForm editing initial={meQuery.data} />;
}
