import type {
  AdminGoodsOrder,
  ApiErrorData,
  ApiResponse,
  Criterion,
  Dashboard,
  Evaluation,
  EvaluationTarget,
  EvaluatorType,
  HackathonEvent,
  ScoreEntry,
  SelfCheckPayload,
  SelfCheckResult,
  Submission,
  SubmissionInput,
  Team,
  TeamAdmin,
  TeamRegisterInput,
  Track,
  PublicTrackResult,
  EventUpdateInput,
  GoodsItemInfo,
  GoodsOrder,
  GoodsItem,
  JoinRequest,
  Participant,
  RecruitStatus,
  TrackResult,
  UploadResult,
  User,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * 백엔드가 내려준 에러를 그대로 들고 다니는 예외.
 * 화면에서는 message를 그대로 보여주면 되고, 필드 단위 오류는 fields로 받는다.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fields?: ApiErrorData[],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** 로그인이 만료됐거나 없는 경우 */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  /** 응답 캐시 정책. 기본은 항상 최신값을 읽는다. */
  cache?: RequestCache;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, cache = "no-store", signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.", 0);
  }

  // 204 등 본문이 없는 응답
  if (res.status === 204) return undefined as T;

  let payload: ApiResponse<T>;
  try {
    payload = await res.json();
  } catch {
    throw new ApiError("서버 응답을 해석할 수 없습니다.", res.status);
  }

  if (!res.ok) {
    throw new ApiError(
      payload?.message ?? "요청을 처리하지 못했습니다.",
      res.status,
      payload?.errorCode,
      // 필드 검증 실패일 때만 data에 상세 목록이 담긴다
      Array.isArray(payload?.data) ? (payload.data as ApiErrorData[]) : undefined,
    );
  }

  return payload.data;
}

/** multipart 업로드는 Content-Type을 브라우저가 정하도록 둔다. */
async function upload<T>(path: string, form: FormData, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  // 파일이 너무 크면 서버에 닿기도 전에 플랫폼(Cloud Run)이 HTML로 413을 돌려준다.
  // 그대로 JSON으로 읽으면 터지므로, 본문을 먼저 안전하게 해석한다.
  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const fallback =
      res.status === 413
        ? "파일이 너무 큽니다. 더 작은 파일로 올리거나 링크로 제출해 주세요."
        : "업로드에 실패했습니다.";
    throw new ApiError(payload?.message ?? fallback, res.status, payload?.errorCode);
  }

  if (!payload) throw new ApiError("업로드 응답을 읽지 못했습니다.", res.status);
  return payload.data;
}

// ---- 공개 API (로그인 불필요) ----

export const publicApi = {
  getEvent: (signal?: AbortSignal) =>
    request<HackathonEvent>("/api/v1/event", { signal }),

  getCriteria: (signal?: AbortSignal) =>
    request<Criterion[]>("/api/v1/event/criteria", { signal }),

  /** 자가진단 결과. 프론트에서도 같은 계산을 하지만 확정값은 서버에서 받는다. */
  previewSelfCheck: (payload: SelfCheckPayload) =>
    request<SelfCheckResult>("/api/v1/teams/self-check", {
      method: "POST",
      body: payload,
    }),

  /**
   * 리더보드. 로그인 없이 열리고, 공개하지 않은 트랙은 빈 칸으로 내려온다.
   * 공개한 트랙도 시상 등수까지만, 점수 없이 온다.
   */
  /** 굿즈 품목과 예상 가격. 로그인 없이 볼 수 있다. */
  getGoodsItems: (signal?: AbortSignal) =>
    request<GoodsItemInfo[]>("/api/v1/goods/items", { signal }),

  getResults: (signal?: AbortSignal) =>
    request<PublicTrackResult[]>("/api/v1/results", { signal }),
};

// ---- 인증 필요 API ----

export const api = {
  getMe: (token: string, signal?: AbortSignal) =>
    request<User>("/api/v1/auth/me", { token, signal }),

  updateProfile: (
    token: string,
    profile: {
      name: string;
      studentId: string;
      department?: string;
      phone: string;
      privacyConsent: boolean;
    },
  ) =>
    request<User>("/api/v1/auth/me/profile", {
      method: "PUT",
      body: profile,
      token,
    }),

  // ---- 굿즈 ----

  getGoodsOrder: (token: string, signal?: AbortSignal) =>
    request<GoodsOrder>("/api/v1/goods/me", { token, signal }),

  /** 신청 저장. 다시 내면 수량을 덮어쓴다. */
  saveGoodsOrder: (
    token: string,
    quantities: Record<GoodsItem, number>,
    keycap: { slots: number | null; designs: Record<number, number> },
  ) =>
    request<GoodsOrder>("/api/v1/goods/me", {
      method: "PUT",
      body: {
        quantities,
        keycapSlots: keycap.slots,
        keycapDesigns: keycap.designs,
      },
      token,
    }),

  // ---- 팀 ----

  /** 내 팀. 아직 등록하지 않았으면 null이 온다. */
  getMyTeam: (token: string, signal?: AbortSignal) =>
    request<Team | null>("/api/v1/teams/me", { token, signal }),

  registerTeam: (token: string, input: TeamRegisterInput) =>
    request<Team>("/api/v1/teams", { method: "POST", body: input, token }),

  updateTeam: (token: string, teamId: number, input: { name: string }) =>
    request<Team>(`/api/v1/teams/${teamId}`, {
      method: "PUT",
      body: input,
      token,
    }),

  /**
   * 모집 중인 팀. want를 비우면 우리 팀이 찾는 것과 반대쪽이 온다.
   * (팀원을 찾는 팀에게는 팀장을 찾는 팀이 보인다)
   */
  getRecruitingTeams: (token: string, want?: RecruitStatus, signal?: AbortSignal) =>
    request<Team[]>(
      want ? `/api/v1/teams/recruiting?want=${want}` : "/api/v1/teams/recruiting",
      { token, signal },
    ),

  updateRecruiting: (
    token: string,
    teamId: number,
    input: { recruiting: RecruitStatus; recruitNote?: string },
  ) =>
    request<Team>(`/api/v1/teams/${teamId}/recruiting`, {
      method: "PUT",
      body: input,
      token,
    }),

  // ---- 팀 합치기 ----

  /** 합치기 신청. toTeamId를 비우면 "어느 팀이든 좋다"는 신청이 된다. */
  requestJoin: (token: string, input: { toTeamId?: number; message?: string }) =>
    request<JoinRequest>("/api/v1/join-requests", {
      method: "POST",
      body: input,
      token,
    }),

  getMyJoinRequests: (token: string, signal?: AbortSignal) =>
    request<JoinRequest[]>("/api/v1/join-requests/me", { token, signal }),

  cancelJoinRequest: (token: string, requestId: number) =>
    request<void>(`/api/v1/join-requests/${requestId}`, { method: "DELETE", token }),

  /** 전체 팀 목록(공개용). Spark → Sprint → Summit 순으로 내려온다. */
  getTeams: (token: string, signal?: AbortSignal) =>
    request<Team[]>("/api/v1/teams", { token, signal }),

  // ---- 제출 ----

  /** 내 팀 제출물. 아직 제출 전이면 null이 온다. */
  getMySubmission: (token: string) =>
    request<Submission | null>("/api/v1/submissions/me", { token }),

  saveSubmission: (token: string, input: SubmissionInput) =>
    request<Submission>("/api/v1/submissions/me", {
      method: "PUT",
      body: input,
      token,
    }),

  /** 최종 제출 확정. 필수 항목이 비어 있으면 400이 온다. */
  finalizeSubmission: (token: string) =>
    request<Submission>("/api/v1/submissions/me/finalize", {
      method: "POST",
      token,
    }),

  uploadFile: (token: string, slot: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return upload<UploadResult>(
      `/api/v1/submissions/me/files?slot=${encodeURIComponent(slot)}`,
      form,
      token,
    );
  },

  // ---- 평가 ----

  getEvaluationTargets: (token: string, evaluatorType: EvaluatorType) =>
    request<EvaluationTarget[]>(
      evaluatorType === "PROFESSOR"
        ? "/api/v1/evaluations/professor/targets"
        : "/api/v1/evaluations/targets",
      { token },
    ),

  getEvaluationCriteria: (token: string, track: Track, evaluatorType: EvaluatorType) =>
    request<Criterion[]>(
      `/api/v1/evaluations/criteria?track=${track}&evaluatorType=${evaluatorType}`,
      { token },
    ),

  submitEvaluation: (
    token: string,
    evaluatorType: EvaluatorType,
    input: { targetTeamId: number; scores: ScoreEntry[]; comment?: string },
  ) =>
    request<Evaluation>(
      evaluatorType === "PROFESSOR"
        ? "/api/v1/evaluations/professor"
        : "/api/v1/evaluations",
      { method: "POST", body: input, token },
    ),

  getMyEvaluations: (token: string) =>
    request<Evaluation[]>("/api/v1/evaluations/me", { token }),

  // ---- 운영진 ----

  admin: {
    getDashboard: (token: string) =>
      request<Dashboard>("/api/v1/admin/dashboard", { token }),

    getTeams: (token: string) =>
      request<TeamAdmin[]>("/api/v1/admin/teams", { token }),

    getResults: (token: string) =>
      request<TrackResult[]>("/api/v1/admin/results", { token }),

    toggleVoting: (token: string, track: Track, open: boolean) =>
      request<HackathonEvent>("/api/v1/admin/event/voting", {
        method: "POST",
        body: { track, open },
        token,
      }),

    /** 일차별 평가 전환. 1일차는 Spark만, 2일차는 Sprint·Summit만 열린다. */
    openVotingForDay: (token: string, day: 1 | 2) =>
      request<HackathonEvent>(`/api/v1/admin/event/voting/day/${day}`, {
        method: "POST",
        token,
      }),

    /** 트랙별 리더보드 공개. 시상 순서대로 하나씩 연다. */
    publishResults: (token: string, track: Track, published: boolean) =>
      request<HackathonEvent>(
        `/api/v1/admin/event/publish?track=${track}&published=${published}`,
        { method: "POST", token },
      ),

    /** 행사 일정·규정 수정. 시각은 UTC ISO로 보낸다. */
    updateEvent: (token: string, input: EventUpdateInput) =>
      request<HackathonEvent>("/api/v1/admin/event", {
        method: "PUT",
        body: input,
        token,
      }),

    /** 참가자 전체 명단. 학번·전화번호·이메일 포함 */
    getParticipants: (token: string) =>
      request<Participant[]>("/api/v1/admin/participants", { token }),

    getSubmissions: (token: string) =>
      request<Submission[]>("/api/v1/admin/submissions", { token }),

    getJoinRequests: (token: string) =>
      request<JoinRequest[]>("/api/v1/admin/join-requests", { token }),

    /** 두 팀을 합친다. fromTeam의 팀원이 toTeam으로 옮겨 가고 fromTeam은 사라진다. */
    mergeTeams: (token: string, fromTeamId: number, toTeamId: number, note?: string) => {
      const query = new URLSearchParams({
        fromTeamId: String(fromTeamId),
        toTeamId: String(toTeamId),
      });
      if (note) query.set("note", note);
      return request<TeamAdmin>(`/api/v1/admin/teams/merge?${query}`, {
        method: "POST",
        token,
      });
    },

    rejectJoinRequest: (token: string, requestId: number, note?: string) =>
      request<void>(
        `/api/v1/admin/join-requests/${requestId}/reject${note ? `?note=${encodeURIComponent(note)}` : ""}`,
        { method: "POST", token },
      ),

    /** 팀 삭제. 제출물·받은 평가·수상도 함께 지워진다. */
    deleteTeam: (token: string, teamId: number) =>
      request<void>(`/api/v1/admin/teams/${teamId}`, { method: "DELETE", token }),

    overrideTrack: (token: string, teamId: number, track: Track, reason?: string) => {
      const query = new URLSearchParams({ track });
      if (reason) query.set("reason", reason);
      return request<TeamAdmin>(
        `/api/v1/admin/teams/${teamId}/track?${query.toString()}`,
        { method: "PATCH", token },
      );
    },

    /** STUDENT를 넘기면 권한 해제다. 서버가 최고 관리자·설정 계정은 거부한다. */
    updateStaffRole: (token: string, email: string, role: "PROFESSOR" | "ADMIN" | "STUDENT") =>
      request<User>("/api/v1/admin/staff", {
        method: "PUT",
        body: { email, role },
        token,
      }),

    getGoodsOrders: (token: string) =>
      request<AdminGoodsOrder[]>("/api/v1/admin/goods", { token }),

    getStaff: (token: string) => request<User[]>("/api/v1/admin/staff", { token }),

    createAward: (
      token: string,
      input: { teamId: number; awardName: string; awardRank?: number },
    ) =>
      request<void>("/api/v1/admin/awards", { method: "POST", body: input, token }),

    /** 가중치 합이 1.0이 아닌 트랙 목록. 비어 있으면 정상. */
    validateCriteria: (token: string) =>
      request<string[]>("/api/v1/admin/criteria/validate", { token }),

    /** CSV 다운로드 URL. 브라우저가 직접 열도록 링크로 쓴다. */
    exportUrl: (kind: "participants" | "submissions" | "results" | "goods") =>
      `${BASE_URL}/api/v1/admin/export/${kind}`,
  },
};

/**
 * CSV 내보내기는 인증 헤더가 필요해 단순 링크로는 열 수 없다.
 * 응답을 blob으로 받아 임시 링크로 저장한다.
 */
export async function downloadCsv(
  token: string,
  kind: "participants" | "submissions" | "results" | "goods",
): Promise<void> {
  const res = await fetch(api.admin.exportUrl(kind), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("내보내기에 실패했습니다.", res.status);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
