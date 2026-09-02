import type {
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

  const payload: ApiResponse<T> = await res.json();
  if (!res.ok) {
    throw new ApiError(
      payload?.message ?? "업로드에 실패했습니다.",
      res.status,
      payload?.errorCode,
    );
  }
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

  /** 공개된 최종 결과. 시상식 전에는 403이 돌아온다. */
  getResults: (signal?: AbortSignal) =>
    request<TrackResult[]>("/api/v1/results", { signal }),
};

// ---- 인증 필요 API ----

export const api = {
  getMe: (token: string) => request<User>("/api/v1/auth/me", { token }),

  updateProfile: (
    token: string,
    profile: { name: string; studentId: string; department?: string },
  ) =>
    request<User>("/api/v1/auth/me/profile", {
      method: "PUT",
      body: profile,
      token,
    }),

  // ---- 팀 ----

  /** 내 팀. 아직 등록하지 않았으면 null이 온다. */
  getMyTeam: (token: string) => request<Team | null>("/api/v1/teams/me", { token }),

  registerTeam: (token: string, input: TeamRegisterInput) =>
    request<Team>("/api/v1/teams", { method: "POST", body: input, token }),

  updateTeam: (
    token: string,
    teamId: number,
    input: { name: string; topic?: string; description?: string },
  ) =>
    request<Team>(`/api/v1/teams/${teamId}`, {
      method: "PUT",
      body: input,
      token,
    }),

  getTeamsByTrack: (token: string, track: Track) =>
    request<Team[]>(`/api/v1/teams?track=${track}`, { token }),

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

    publishResults: (token: string, published: boolean) =>
      request<HackathonEvent>(`/api/v1/admin/event/publish?published=${published}`, {
        method: "POST",
        token,
      }),

    overrideTrack: (token: string, teamId: number, track: Track, reason?: string) => {
      const query = new URLSearchParams({ track });
      if (reason) query.set("reason", reason);
      return request<TeamAdmin>(
        `/api/v1/admin/teams/${teamId}/track?${query.toString()}`,
        { method: "PATCH", token },
      );
    },

    updateStaffRole: (token: string, email: string, role: "PROFESSOR" | "ADMIN") =>
      request<User>("/api/v1/admin/staff", {
        method: "PUT",
        body: { email, role },
        token,
      }),

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
    exportUrl: (kind: "participants" | "submissions" | "results") =>
      `${BASE_URL}/api/v1/admin/export/${kind}`,
  },
};

/**
 * CSV 내보내기는 인증 헤더가 필요해 단순 링크로는 열 수 없다.
 * 응답을 blob으로 받아 임시 링크로 저장한다.
 */
export async function downloadCsv(
  token: string,
  kind: "participants" | "submissions" | "results",
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
