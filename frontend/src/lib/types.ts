/**
 * 백엔드 DTO에 대응하는 타입.
 * 백엔드의 record 정의가 바뀌면 여기도 함께 고쳐야 한다.
 */

export type Track = "SPARK" | "SPRINT" | "SUMMIT";
export type Role = "STUDENT" | "PROFESSOR" | "ADMIN";
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
  role: Role;
  profileCompleted: boolean;
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
  sparkSubmitDeadline: string | null;
  devSubmitDeadline: string | null;
  registrationOpen: boolean;
  submissionOpen: Record<Track, boolean>;
  votingOpen: Record<Track, boolean>;
  resultsPublished: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  maxUploadMb: number;
  /** 서버 시각. 카운트다운을 이 값에 맞춰 보정한다. */
  serverTime: string;
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
}

export interface Team {
  teamId: number;
  name: string;
  topic: string | null;
  description: string | null;
  track: Track;
  trackReason: string | null;
  leaderId: number;
  leaderName: string;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMemberInput {
  name: string;
  studentId: string;
  email: string;
}

export interface TeamRegisterInput {
  name: string;
  topic?: string;
  description?: string;
  appliedTrack: Track;
  selfCheck: SelfCheckPayload;
  members: TeamMemberInput[];
  privacyConsent: boolean;
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
  topic: string | null;
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

export interface Dashboard {
  totalTeams: number;
  totalSubmissions: number;
  totalParticipants: number;
  teamsByTrack: Record<Track, number>;
  submissionsByTrack: Record<Track, number>;
  studentVotesByTrack: Record<Track, number>;
  professorVoteCount: number;
  resultsPublished: boolean;
  votingOpen: Record<Track, boolean>;
}

export interface TeamAdmin {
  teamId: number;
  teamName: string;
  topic: string | null;
  track: Track;
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
