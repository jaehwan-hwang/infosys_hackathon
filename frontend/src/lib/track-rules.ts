import type { SelfCheckPayload, SelfCheckResult, Track } from "./types";

/**
 * 트랙 배정 규칙의 클라이언트 사본.
 *
 * 서버(SelfCheck.java)와 같은 규칙을 두 곳에 두는 이유는, 자가진단 화면에서
 * 체크할 때마다 왕복 없이 결과를 즉시 보여주기 위해서다. 실제 배정은 언제나
 * 서버 계산이 최종이고, 여기 값은 안내용이다. 규칙을 바꿀 때는 양쪽을 함께 고쳐야 한다.
 */

/** 체크리스트 4개 중 Summit으로 넘어가는 기준 개수 */
export const CHECKLIST_THRESHOLD = 3;

export const EMPTY_SELF_CHECK: SelfCheckPayload = {
  workExperience: false,
  awardHistory: false,
  liveService: false,
  apiExperience: false,
  gitCollab: false,
  advancedCourse: false,
  externalApi: false,
};

/** 하나라도 해당하면 무조건 Summit이 되는 항목들 */
export const INSTANT_SUMMIT_ITEMS = [
  {
    key: "workExperience" as const,
    label: "개발 직무 실무·인턴 경험이 있다",
  },
  {
    key: "awardHistory" as const,
    label: "교내외 개발 대회 수상 이력이 있다",
  },
  {
    key: "liveService" as const,
    label: "실제 배포·운영 중인 서비스를 보유하고 있다",
  },
];

/** 4개 중 3개 이상이면 Summit이 되는 체크리스트 */
export const CHECKLIST_ITEMS = [
  {
    key: "apiExperience" as const,
    label: "API 및 서버 연동 경험",
    description: "백엔드 프레임워크와 DB를 직접 구축·연동해 본 경험이 있다",
  },
  {
    key: "gitCollab" as const,
    label: "협업 툴 및 버전 관리",
    description: "Git/GitHub를 활용해 브랜치 전략을 통한 팀 프로젝트 경험이 있다",
  },
  {
    key: "advancedCourse" as const,
    label: "심화 프로젝트 과목 이수",
    description: "개발 산출물이 필수인 심화 전공 과목을 이수했다",
  },
  {
    key: "externalApi" as const,
    label: "외부 API/라이브러리 활용",
    description: "외부 인증, 결제 모듈, LLM/AI API 등을 연동한 프로젝트 경험이 있다",
  },
];

export function hasInstantSummitReason(check: SelfCheckPayload): boolean {
  return check.workExperience || check.awardHistory || check.liveService;
}

export function countChecklist(check: SelfCheckPayload): number {
  return [
    check.apiExperience,
    check.gitCollab,
    check.advancedCourse,
    check.externalApi,
  ].filter(Boolean).length;
}

export function resolveTrack(check: SelfCheckPayload): Track {
  if (hasInstantSummitReason(check)) return "SUMMIT";
  return countChecklist(check) >= CHECKLIST_THRESHOLD ? "SUMMIT" : "SPRINT";
}

export function describeReason(check: SelfCheckPayload): string {
  if (hasInstantSummitReason(check)) {
    const reasons = [
      check.workExperience && "실무·인턴 경험",
      check.awardHistory && "개발 대회 수상 이력",
      check.liveService && "배포·운영 서비스 보유",
    ].filter(Boolean);
    return `즉시 Summit 배정: ${reasons.join(", ")}`;
  }
  const count = countChecklist(check);
  return count >= CHECKLIST_THRESHOLD
    ? `자가진단 ${count}/4 항목 해당 → Summit`
    : `자가진단 ${count}/4 항목 해당 → Sprint`;
}

/** 서버 응답과 같은 형태로 자가진단 결과를 만든다. */
export function evaluateSelfCheck(check: SelfCheckPayload): SelfCheckResult {
  return {
    resolvedTrack: resolveTrack(check),
    instantSummit: hasInstantSummitReason(check),
    checkedCount: countChecklist(check),
    reason: describeReason(check),
  };
}

// ---- 트랙 표시 정보 ----

export const TRACK_LABEL: Record<Track, string> = {
  SPARK: "Spark",
  SPRINT: "Sprint",
  SUMMIT: "Summit",
};

export const TRACK_TAGLINE: Record<Track, string> = {
  SPARK: "아이디어톤",
  SPRINT: "기초 개발",
  SUMMIT: "완성형 개발",
};

export const TRACK_DAY: Record<Track, number> = {
  SPARK: 1,
  SPRINT: 2,
  SUMMIT: 2,
};

export const TRACK_GOAL: Record<Track, string> = {
  SPARK: "제시된 문제를 해결하는 아이디어 제시",
  SPRINT: "문제를 해결하는 기초적인 프로그램 개발",
  SUMMIT: "문제를 해결하는 완성된 프로그램 개발",
};

export const TRACK_EVALUATION: Record<Track, string> = {
  SPARK: "학생 투표 100%",
  SPRINT: "학생 투표 100%",
  SUMMIT: "교수 평가 70% + 학생 투표 30%",
};

/**
 * 트랙별 제출 항목. 제출 폼과 랜딩의 안내가 같은 정의를 공유한다.
 *
 * `slot`은 파일 업로드 시 서버에 넘기는 경로 구분자이고,
 * `field`는 제출 DTO의 필드명이다.
 */
export interface SubmissionField {
  field: keyof import("./types").SubmissionInput;
  slot: string;
  label: string;
  description: string;
  required: boolean;
  /** 파일 업로드를 지원하는 항목인지 (아니면 링크 입력만) */
  uploadable: boolean;
}

export const SUBMISSION_FIELDS: Record<Track, SubmissionField[]> = {
  SPARK: [
    {
      field: "planFileUrl",
      slot: "plan",
      label: "서비스 기획서",
      description: "문제 정의와 해결 방안을 담은 문서 (PDF/PPT/한글)",
      required: true,
      uploadable: true,
    },
    {
      field: "prototypeUrl",
      slot: "prototype",
      label: "프로토타입",
      description: "목업·와이어프레임 파일 또는 Figma 링크",
      required: true,
      uploadable: true,
    },
    {
      field: "deckFileUrl",
      slot: "deck",
      label: "발표자료",
      description: "선택 항목입니다",
      required: false,
      uploadable: true,
    },
  ],
  SPRINT: [
    {
      field: "sourceCodeUrl",
      slot: "source",
      label: "소스코드",
      description: "GitHub 저장소 링크 또는 zip 업로드",
      required: true,
      uploadable: true,
    },
    {
      field: "deckFileUrl",
      slot: "deck",
      label: "발표자료",
      description: "PPT 또는 PDF",
      required: true,
      uploadable: true,
    },
    {
      field: "demoUrl",
      slot: "demo",
      label: "핵심 기능 시연",
      description: "시연 영상 링크 또는 영상 파일",
      required: true,
      uploadable: true,
    },
    {
      field: "planFileUrl",
      slot: "plan",
      label: "서비스 기획서",
      description: "선택 항목입니다",
      required: false,
      uploadable: true,
    },
  ],
  SUMMIT: [
    {
      field: "deployUrl",
      slot: "deploy",
      label: "배포 링크",
      description: "실제 접속 가능한 서비스 주소",
      required: true,
      uploadable: false,
    },
    {
      field: "sourceCodeUrl",
      slot: "source",
      label: "전체 소스코드",
      description: "GitHub 저장소 링크 또는 zip 업로드",
      required: true,
      uploadable: true,
    },
    {
      field: "architectureFileUrl",
      slot: "architecture",
      label: "시스템 아키텍처 다이어그램",
      description: "이미지 또는 PDF",
      required: true,
      uploadable: true,
    },
    {
      field: "techSpecFileUrl",
      slot: "techspec",
      label: "기술 명세서",
      description: "사용 기술과 설계 결정을 정리한 문서",
      required: true,
      uploadable: true,
    },
    {
      field: "deckFileUrl",
      slot: "deck",
      label: "발표자료",
      description: "PPT 또는 PDF",
      required: true,
      uploadable: true,
    },
    {
      field: "demoUrl",
      slot: "demo",
      label: "핵심 기능 시연",
      description: "선택 항목입니다",
      required: false,
      uploadable: true,
    },
  ],
};
