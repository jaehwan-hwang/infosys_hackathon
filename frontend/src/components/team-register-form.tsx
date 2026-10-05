"use client";

import { useState } from "react";
import { Button, CheckCard, Field, TextInput } from "@/components/form";
import { Alert, Card, Section, TrackBadge, cx, trackStyle } from "@/components/ui";
import { api } from "@/lib/api";
import { EMPTY_SELF_CHECK, TRACK_GOAL, TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { TeamMemberInput, Track } from "@/lib/types";

/**
 * 팀 등록 폼.
 *
 * 받는 것은 팀명·트랙·팀원뿐이다. 주제나 소개는 받지 않는다 — 신청 시점에는
 * 아직 정해지지 않은 경우가 많고, 결과물 제출 단계에서 프로젝트명과 요약으로 다시 받는다.
 *
 * 트랙은 참가자가 세 개 중에서 직접 고른다. 자가진단을 거쳐 왔으면 추천 트랙이
 * 미리 골라져 있고, 그대로 두든 바꾸든 자유다. 자가진단 문항을 여기서 또 받지는 않는다.
 */
const TRACKS: { track: Track; description: string }[] = [
  {
    track: "SPARK",
    description: "아이디어와 기획으로 겨룹니다. 개발 결과물은 제출하지 않습니다.",
  },
  {
    track: "SPRINT",
    description: "문제를 해결하는 기초적인 프로그램을 만듭니다.",
  },
  {
    track: "SUMMIT",
    description: "실제 배포되어 접속 가능한 서비스를 만듭니다. 교수 평가가 포함됩니다.",
  },
];

export function TeamRegisterForm({
  initialTrack,
  fromSelfCheck,
  minTeamSize,
  maxTeamSize,
  onRegistered,
}: {
  initialTrack: Track;
  fromSelfCheck: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  onRegistered: () => void;
}) {
  const { token, user } = useAuth();

  const [name, setName] = useState("");
  const [track, setTrack] = useState<Track>(initialTrack);
  const [members, setMembers] = useState<TeamMemberInput[]>([]);
  const [consent, setConsent] = useState(false);

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.registerTeam(token, {
      name: name.trim(),
      appliedTrack: track,
      selfCheck: EMPTY_SELF_CHECK,
      members: members.map((m) => ({
        name: m.name.trim(),
        studentId: m.studentId.trim(),
        email: m.email.trim().toLowerCase(),
      })),
      privacyConsent: consent,
    });
  });

  const totalMembers = members.length + 1;
  const sizeValid = totalMembers >= minTeamSize && totalMembers <= maxTeamSize;
  const membersFilled = members.every(
    (m) => m.name.trim() && m.studentId.trim() && m.email.trim(),
  );
  const canSubmit = name.trim().length > 0 && consent && sizeValid && membersFilled;

  const fieldError = (field: string) =>
    error?.fields?.find((f) => f.field === field)?.message;

  const updateMember = (index: number, patch: Partial<TeamMemberInput>) =>
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = await run();
    if (team) onRegistered();
  };

  const style = trackStyle(track);

  return (
    <Section
      eyebrow="Registration"
      title="팀 등록"
      description="로그인한 계정이 팀의 조장이 됩니다. 팀원 정보는 조장이 대신 입력합니다."
    >
      <div className="mb-8">
        <Alert tone="info" title="팀에 한 번만 등록하면 됩니다">
          팀원은 따로 신청하지 않습니다. 조장이 아래에서 팀원 정보를 입력해 등록하면, 팀원은
          적어 넣은 한양대학교 이메일로 <strong>로그인만</strong> 하면 자동으로 팀에 연결됩니다.
          조장이 이미 등록했다면 이 화면에서 또 등록하지 마세요.
        </Alert>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <fieldset className="space-y-5">
            <legend className="text-base font-bold">1. 팀명</legend>
            <p className="text-sm text-muted">등록 후에도 신청 기간 동안 고칠 수 있습니다.</p>

            <Field label="팀명" required error={fieldError("name")}>
              {(id, describedBy) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                  placeholder="예: 정보의 파수꾼"
                  invalid={Boolean(fieldError("name"))}
                />
              )}
            </Field>
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">2. 트랙 선택</legend>
            <p className="mt-1.5 text-sm text-muted">
              {fromSelfCheck
                ? `자가진단이 권한 ${TRACK_LABEL[initialTrack]}이(가) 선택되어 있습니다. 바꿔도 됩니다.`
                : "Spark는 1일차 아이디어톤, Sprint와 Summit은 2일차 개발 트랙입니다."}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {TRACKS.map((item) => (
                <button
                  key={item.track}
                  type="button"
                  onClick={() => setTrack(item.track)}
                  aria-pressed={track === item.track}
                  className={cx(
                    "rounded-2xl border-2 p-4 text-left transition-colors",
                    track === item.track
                      ? "border-brand-600 bg-brand-600/5"
                      : "border-current/15 hover:bg-current/5",
                  )}
                >
                  <p className="font-bold">{TRACK_LABEL[item.track]}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-600">
                    {TRACK_TAGLINE[item.track]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.description}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">3. 팀원 정보</legend>
            <p className="mt-1.5 text-sm text-muted">
              조장을 포함해 {minTeamSize}~{maxTeamSize}명까지 등록할 수 있습니다. 팀원은 등록된
              이메일로 로그인하면 자동으로 팀에 연결됩니다.
            </p>

            <Card className="mt-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  조장
                </span>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {user?.studentId} · {user?.email}
              </p>
            </Card>

            <div className="mt-3 space-y-3">
              {members.map((member, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-subtle">팀원 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => setMembers((prev) => prev.filter((_, i) => i !== index))}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="성명" required error={fieldError(`members[${index}].name`)}>
                      {(id) => (
                        <TextInput
                          id={id}
                          value={member.name}
                          onChange={(e) => updateMember(index, { name: e.target.value })}
                          maxLength={50}
                          required
                        />
                      )}
                    </Field>

                    <Field label="학번" required error={fieldError(`members[${index}].studentId`)}>
                      {(id) => (
                        <TextInput
                          id={id}
                          value={member.studentId}
                          onChange={(e) =>
                            updateMember(index, {
                              studentId: e.target.value.replace(/[^0-9]/g, ""),
                            })
                          }
                          inputMode="numeric"
                          maxLength={12}
                          required
                          invalid={Boolean(fieldError(`members[${index}].studentId`))}
                        />
                      )}
                    </Field>

                    <Field label="이메일" required error={fieldError(`members[${index}].email`)}>
                      {(id) => (
                        <TextInput
                          id={id}
                          type="email"
                          value={member.email}
                          onChange={(e) => updateMember(index, { email: e.target.value })}
                          maxLength={120}
                          required
                          placeholder="id@hanyang.ac.kr"
                          invalid={Boolean(fieldError(`members[${index}].email`))}
                        />
                      )}
                    </Field>
                  </div>
                </Card>
              ))}
            </div>

            {totalMembers < maxTeamSize && (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => setMembers((prev) => [...prev, { name: "", studentId: "", email: "" }])}
              >
                + 팀원 추가
              </Button>
            )}

            {!sizeValid && (
              <p className="mt-3 text-xs font-medium text-red-600">
                팀 인원은 조장 포함 {minTeamSize}~{maxTeamSize}명이어야 합니다. (현재{" "}
                {totalMembers}명)
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">4. 개인정보 수집·이용 동의</legend>

            <Card className="mt-4 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-[var(--text)]">수집 항목</strong> — 성명, 학번, 한양대학교
                이메일
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">수집 목적</strong> — 해커톤 참가자 확인, 팀
                구성 및 연락, 결과물 제출 및 평가 진행, 시상
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">보유·이용 기간</strong> — 행사 종료 후 3개월
                이내 파기
              </p>
              <p className="mt-2">
                학번과 이메일은 우리 팀과 운영진에게만 보이며, 다른 참가자에게는 이름만
                공개됩니다.
              </p>
            </Card>

            <div className="mt-3">
              <CheckCard
                checked={consent}
                onChange={setConsent}
                label="위 내용에 동의합니다"
                description="팀원 전원의 동의를 받았음을 확인합니다."
              />
            </div>
          </fieldset>

          {error && (
            <Alert tone="error" title="등록하지 못했습니다">
              {error.message}
            </Alert>
          )}

          <Button type="submit" size="lg" loading={pending} disabled={!canSubmit}>
            팀 등록하기
          </Button>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className={style.ring}>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              선택한 트랙
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrackBadge track={track} />
              <span className={cx("text-xl font-black", style.accent)}>
                {TRACK_LABEL[track]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{TRACK_GOAL[track]}</p>

            <dl className="mt-4 space-y-2 border-t-2 border-current/10 pt-4 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">팀 인원</dt>
                <dd className={cx("font-medium", !sizeValid && "text-red-600")}>
                  {totalMembers}명
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-subtle">
              등록 후 트랙을 바꾸려면 운영진에게 문의해야 합니다. 팀명은 신청 기간 동안 직접
              수정할 수 있습니다.
            </p>
          </Card>
        </div>
      </form>
    </Section>
  );
}
