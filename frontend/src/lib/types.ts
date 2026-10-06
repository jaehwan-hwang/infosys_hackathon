/**
 * 백엔드 DTO에 대응하는 타입.
 * 백엔드의 record 정의가 바뀌면 여기도 함께 고쳐야 한다.
 */

export type Track = "SPARK" | "SPRINT" | "SUMMIT";
/** 팀이 무엇을 찾고 있는지. 서로 반대인 팀끼리 이어 준다. */
export type RecruitStatus = "NONE" | "MEMBERS" | "LEADER";
export type JoinRequestStatus = "PENDING" | "MERGED" | "REJECTED" | "CANCELED";
export type Role = "STUDENT" | "PROFESSOR" | "ADMIN";
export type GoodsItem = "HOODIE" | "STICKER" | "KEYRING";
export type EvaluatorType = "STUDENT" | "PROFESSOR";
export type TeamMemberRole = "LEADER" | "MEMBER";

/** 모든 API 응답의 공통 봉투 */
export interface ApiResponse<T> {
  timestamp: number;
  data: T;
  errorCode?: string;
  message: string;
}

export interface ApiErrorData {
  field: string;
  message: string;
  rejectedValue: unknown;
}

export interface User {
  userId: number;
  email: string;
  name: string;
  studentId: string | null;
  department: string | null;
  phone: string | null;
  role: Role;
  roleLabel: string;
  /** 되돌리기 어려운 조작을 할 수 있는 최고 관리자인가 */
  superAdmin: boolean;
  profileCompleted: boolean;
  /** 개인정보 수집·이용 동의 여부. 프로필 등록에서 본인이 직접 한다. */
  privacyConsent: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
  profileNeeded: boolean;
}

/**
 * 행사 상태. submissionOpen/votingOpen은 서버가 이미 판정한 결과이므로
 * 프론트에서 마감 시각을 다시 비교하지 않는다.
 */
export interface HackathonEvent {
  eventId: number;
  title: string;
  theme: string | null;
  description: string | null;
  location: string | null;
  contactUrl: string | null;
  registerStartsAt: string | null;
  registerEndsAt: string | null;
  /** 결과물 제출이 열리는 시각 */
  submitOpensAt: string | null;
  sparkSubmitDeadline: string | null;
  devSubmitDeadline: string | null;
  registrationOpen: boolean;
  /** 아직 제출 시작 전인가 */
  beforeSubmissionOpen: boolean;
  submissionOpen: Record<Track, boolean>;
  votingOpen: Record<Track, boolean>;
  resultsPublished: Record<Track, boolean>;
  minTeamSize: number;
  maxTeamSize: number;
  maxUploadMb: number;
  /** 서버 시각. 카운트다운을 이 값에 맞춰 보정한다. */
  serverTime: string;
}

/** 운영진이 고치는 행사 설정. 시각은 UTC ISO 문자열. */
export interface EventUpdateInput {
  title: string;
  theme?: string;
  description?: string;
  location?: string;
  contactUrl?: string;
  registerStartsAt: string | null;
  registerEndsAt: string | null;
  submitOpensAt: string | null;
  sparkSubmitDeadline: string | null;
  devSubmitDeadline: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  maxUploadMb: number;
}

export interface Criterion {
  criterionId: number;
  track: Track;
  evaluatorType: EvaluatorType;
  name: string;
  description: string | null;
  maxScore: number;
  weight: number;
  displayOrder: number;
}

export interface SelfCheckPayload {
  workExperience: boolean;
  awardHistory: boolean;
  liveService: boolean;
  apiExperience: boolean;
  gitCollab: boolean;
  advancedCourse: boolean;
  externalApi: boolean;
}

export interface SelfCheckResult {
  resolvedTrack: Track;
  instantSummit: boolean;
  checkedCount: number;
  reason: string;
}

export interface TeamMember {
  teamMemberId: number;
  userId: number | null;
  name: string;
  studentId: string | null;
  email: string | null;
  role: TeamMemberRole;
  linked: boolean;
  /** 학생회비 납부 여부. 우리 팀과 운영진에게만 내려온다. */
  duesPaid: boolean | null;
}

export interface Team {
  teamId: number;
  name: string;
  track: Track;
  trackReason: string | null;
  leaderId: number;
  leaderName: string;
  memberCount: number;
  members: TeamMember[];
  recruiting: RecruitStatus;
  recruitNote: string | null;
  createdAt: string;
}

export interface TeamMemberInput {
  name: string;
  studentId: string;
  email: string;
  /** 학생회비를 납부한 재학생인지. false면 참가비 1만원 대상 */
  duesPaid: boolean;
}

export interface JoinRequest {
  joinRequestId: number;
  /** 합쳐져 사라진 팀이면 null */
  fromTeamId: number | null;
  fromTeamName: string;
  fromTeamMemberCount: number;
  fromTeamTrack: Track | null;
  toTeamId: number | null;
  toTeamName: string | null;
  message: string | null;
  status: JoinRequestStatus;
  statusLabel: string;
  handledNote: string | null;
  /** 우리 팀이 보낸 신청인가. 받은 신청과 섞여 내려온다. */
  outgoing: boolean | null;
  createdAt: string;
}

export interface TeamRegisterInput {
  name: string;
  appliedTrack: Track;
  selfCheck: SelfCheckPayload;
  members: TeamMemberInput[];
  /** 팀장으로 지정할 사람의 이메일. 비우면 등록한 본인 */
  leaderEmail?: string;
  recruiting: RecruitStatus;
  recruitNote?: string;
  /** 등록하는 본인의 학생회비 납부 여부 */
  duesPaid: boolean;
}

/** 굿즈 한 품목. 가격은 수량에 따라 조정될 수 있는 예상값이다. */
export interface GoodsItemInfo {
  item: GoodsItem;
  label: string;
  price: number;
}

export interface GoodsOrder {
  quantities: Record<GoodsItem, number>;
  /** 예상 금액. 확정 금액은 단톡방에서 안내된다. */
  estimatedTotal: number;
  updatedAt: string | null;
}

export interface Submission {
  submissionId: number;
  teamId: number;
  teamName: string;
  track: Track;
  projectName: string;
  summary: string;
  description: string | null;
  planFileUrl: string | null;
  prototypeUrl: string | null;
  sourceCodeUrl: string | null;
  deckFileUrl: string | null;
  demoUrl: string | null;
  deployUrl: string | null;
  architectureFileUrl: string | null;
  techSpecFileUrl: string | null;
  techStacks: string[];
  submittedAt: string;
  complete: boolean;
  /** 아직 채우지 않은 필수 항목 */
  missingRequirements: string[];
}

export interface SubmissionInput {
  projectName: string;
  summary: string;
  description?: string;
  planFileUrl?: string;
  prototypeUrl?: string;
  sourceCodeUrl?: string;
  deckFileUrl?: string;
  demoUrl?: string;
  deployUrl?: string;
  architectureFileUrl?: string;
  techSpecFileUrl?: string;
  techStacks?: string[];
}

export interface UploadResult {
  url: string;
  slot: string;
  sizeBytes: number;
}

export interface EvaluationTarget {
  teamId: number;
  teamName: string;
  track: Track;
  projectName: string | null;
  summary: string | null;
  deployUrl: string | null;
  demoUrl: string | null;
  /** 이미 평가한 팀이면 true */
  evaluated: boolean;
}

export interface ScoreEntry {
  criterionId: number;
  score: number;
}

export interface Evaluation {
  evaluationId: number;
  targetTeamId: number;
  targetTeamName: string;
  evaluatorType: EvaluatorType;
  totalScore: number;
  comment: string | null;
  evaluatedAt: string;
  scores: ScoreEntry[];
}

export interface TeamResult {
  rank: number;
  teamId: number;
  teamName: string;
  track: Track;
  projectName: string | null;
  studentAverage: number;
  studentVoterCount: number;
  professorAverage: number;
  professorVoterCount: number;
  finalScore: number;
  awardName: string | null;
}

export interface TrackResult {
  track: Track;
  /** 이 트랙에 적용된 산식 설명 */
  formula: string;
  teamCount: number;
  results: TeamResult[];
}

/**
 * 리더보드에 올라가는 팀.
 * 등수는 전부 내려오지만 점수는 수상 팀 것만 온다.
 */
export interface PublicTeamResult {
  rank: number;
  teamId: number;
  teamName: string;
  projectName: string | null;
  awardName: string | null;
  /** 시상 등수 안에 든 팀인가 */
  awarded: boolean;
  /** 수상 팀만 값이 온다 */
  finalScore: number | null;
  studentAverage: number | null;
  /** 교수 평가가 있는 Summit의 수상 팀만 값이 온다 */
  professorAverage: number | null;
}

/** 리더보드의 트랙 한 칸. 공개 전에는 published=false에 winners가 비어 있다. */
export interface PublicTrackResult {
  track: Track;
  published: boolean;
  /** 이 트랙이 시상하는 등수 (Spark 1, Sprint·Summit 3) */
  awardCount: number;
  /** 적용된 산식. 공개 전에는 null이다. */
  formula: string | null;
  teams: PublicTeamResult[];
}

export interface Dashboard {
  totalTeams: number;
  totalSubmissions: number;
  totalParticipants: number;
  teamsByTrack: Record<Track, number>;
  submissionsByTrack: Record<Track, number>;
  studentVotesByTrack: Record<Track, number>;
  professorVoteCount: number;
  resultsPublished: Record<Track, boolean>;
  votingOpen: Record<Track, boolean>;
}

export interface TeamAdmin {
  teamId: number;
  teamName: string;
  track: Track;
  recruiting: RecruitStatus;
  trackReason: string | null;
  leaderName: string;
  leaderEmail: string;
  memberCount: number;
  members: TeamMember[];
  submitted: boolean;
  submissionComplete: boolean;
  missingRequirements: string[];
  submittedAt: string | null;
  createdAt: string;
}
