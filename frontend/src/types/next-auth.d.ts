import type { Role } from "@/lib/types";
import "next-auth";
import "next-auth/jwt";

/**
 * NextAuth 기본 세션에 백엔드 토큰과 사용자 권한을 얹는다.
 */
declare module "next-auth" {
  interface Session {
    /** 백엔드 API 호출에 쓰는 자체 액세스 토큰 */
    accessToken?: string;
    /** 토큰 교환 실패 사유. 있으면 재로그인을 안내한다. */
    authError?: string;
    /** 백엔드 토큰 만료 시각 (epoch ms) */
    expiresAt?: number;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      studentId: string | null;
      profileCompleted: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpiresAt?: number;
    authError?: string;
    userId?: number;
    role?: Role;
    studentId?: string | null;
    profileCompleted?: boolean;
  }
}
