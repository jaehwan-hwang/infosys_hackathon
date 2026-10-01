import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

/** 사용자 정보를 백엔드에서 다시 읽는 주기 */
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Google 로그인 → 백엔드 토큰 교환.
 *
 * 흐름:
 *   1. NextAuth가 Google OAuth를 처리하고 id_token을 받는다.
 *   2. 그 id_token을 백엔드 /api/v1/auth/google 로 보낸다.
 *   3. 백엔드가 Google JWKS로 검증하고 도메인을 확인한 뒤 자체 토큰을 발급한다.
 *   4. 자체 토큰을 세션에 실어 이후 모든 API 호출에 쓴다.
 *
 * 도메인 제한은 프론트(signIn 콜백)와 백엔드 양쪽에서 검사한다.
 * 프론트 검사는 사용자에게 이유를 빨리 알려주기 위한 것이고,
 * 실제 차단은 백엔드가 담당한다.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          // 학교 계정만 뜨도록 힌트를 준다 (강제는 아니므로 검증은 따로 한다)
          hd: ALLOWED_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email?.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
        // 문자열을 반환하면 해당 경로로 리디렉트된다
        return `/login?error=domain`;
      }
      return true;
    },

    async jwt({ token, account, trigger }) {
      // 최초 로그인 시에만 account가 채워진다. 이때 백엔드 토큰으로 교환한다.
      if (account?.id_token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          });

          const body = await res.json();
          if (!res.ok) {
            token.authError = body?.message ?? "로그인에 실패했습니다.";
            return token;
          }

          const data = body.data;
          token.accessToken = data.accessToken;
          // 백엔드 토큰 만료 시각을 함께 들고 있다가 세션에서 노출한다
          token.accessTokenExpiresAt = Date.now() + data.expiresIn * 1000;
          token.userId = data.user.userId;
          token.role = data.user.role;
          token.studentId = data.user.studentId;
          token.profileCompleted = data.user.profileCompleted;
          token.syncedAt = Date.now();
          token.authError = undefined;
        } catch {
          token.authError = "인증 서버에 연결할 수 없습니다.";
        }
      }

      // 사용자 정보의 진짜 주인은 백엔드다. 세션 토큰에 담긴 값은 로그인 시점의
      // 사본일 뿐이라, 그대로 믿으면 학번을 저장했는데도 계속 프로필 등록 화면이
      // 뜨거나 운영진 권한을 받고도 재로그인해야 하는 일이 생긴다. 아래 경우에 다시 읽는다.
      //   1. 화면에서 update()를 부른 직후 — 방금 바뀐 것이 확실하다
      //   2. 프로필 미완료로 남아 있을 때 — 관문에 걸려 아무것도 못 하는 상태라 매번 확인한다
      //   3. 마지막 확인이 오래됐을 때 — 권한 변경이 재로그인 없이 반영되도록
      const stale =
        !token.profileCompleted ||
        Date.now() - ((token.syncedAt as number) ?? 0) > SYNC_INTERVAL_MS;

      if (token.accessToken && (trigger === "update" || stale)) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });
          if (res.ok) {
            const user = (await res.json()).data;
            token.role = user.role;
            token.studentId = user.studentId;
            token.profileCompleted = user.profileCompleted;
            token.syncedAt = Date.now();
            token.authError = undefined;
          } else if (res.status === 401) {
            // 백엔드 토큰이 만료됐거나 더는 유효하지 않다. 조용히 실패하면
            // 화면만 멀쩡하고 모든 요청이 막히므로, 다시 로그인하도록 알린다.
            token.authError = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
          }
        } catch {
          // 네트워크 문제로 갱신하지 못한 것뿐이므로 로그인 상태는 건드리지 않는다
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.authError = token.authError as string | undefined;
      session.expiresAt = token.accessTokenExpiresAt as number | undefined;

      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = token.role as Role;
        session.user.studentId = token.studentId as string | null;
        session.user.profileCompleted = Boolean(token.profileCompleted);
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
});
