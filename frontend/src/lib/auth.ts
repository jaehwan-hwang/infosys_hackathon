import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

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

    async jwt({ token, account }) {
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
          token.authError = undefined;
        } catch {
          token.authError = "인증 서버에 연결할 수 없습니다.";
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
