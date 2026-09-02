"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Button, CheckCard, Field, TextArea, TextInput } from "@/components/form";
import { Alert, Card, Section, TrackBadge, cx, trackStyle } from "@/components/ui";
import { api, publicApi } from "@/lib/api";
import {
  CHECKLIST_ITEMS,
  CHECKLIST_THRESHOLD,
  EMPTY_SELF_CHECK,
  INSTANT_SUMMIT_ITEMS,
  TRACK_GOAL,
  TRACK_LABEL,
  evaluateSelfCheck,
} from "@/lib/track-rules";
import { useApiMutation, useApiQuery, useAuth } from "@/lib/use-auth";
import type { SelfCheckPayload, Team, TeamMemberInput, Track } from "@/lib/types";

export default function RegisterPage() {
  return (
    <AuthGate>
      <RegisterContent />
    </AuthGate>
  );
}

/** 등록 폼에서 고르는 것은 Spark냐, 개발 트랙이냐 둘 중 하나다. */
type TrackChoice = "SPARK" | "DEV";

function RegisterContent() {
  const { token, user } = useAuth();

  const eventQuery = useApiQuery((signal) => publicApi.getEvent(signal), []);
  const teamQuery = useApiQuery(
    token ? () => api.getMyTeam(token) : null,
    [token],
  );

  if (teamQuery.loading || eventQuery.loading) {
    return <Section><div className="py-20" /></Section>;
  }

  // 이미 팀이 있으면 등록 폼 대신 내 팀을 보여준다
  if (teamQuery.data) {
    return <MyTeamView team={teamQuery.data} />;
  }

  const event = eventQuery.data;

  if (event && !event.registrationOpen) {
    return (
      <Section title="팀 등록">
        <Alert tone="warning" title="참가 신청 기간이 아닙니다">
          현재는 팀 등록을 받고 있지 않습니다. 신청 기간은 홈에서 확인할 수 있습니다.
        </Alert>
      </Section>
    );
  }

  return (
    <RegisterForm
      minTeamSize={event?.minTeamSize ?? 1}
      maxTeamSize={event?.maxTeamSize ?? 5}
      leaderName={user?.name ?? ""}
      leaderEmail={user?.email ?? ""}
      leaderStudentId={user?.studentId ?? ""}
      onRegistered={teamQuery.reload}
    />
  );
}

function RegisterForm({
  minTeamSize,
  maxTeamSize,
  leaderName,
  leaderEmail,
  leaderStudentId,
  onRegistered,
}: {
  minTeamSize: number;
  maxTeamSize: number;
  leaderName: string;
  leaderEmail: string;
  leaderStudentId: string;
  onRegistered: () => void;
}) {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [trackChoice, setTrackChoice] = useState<TrackChoice>("DEV");
  const [selfCheck, setSelfCheck] = useState<SelfCheckPayload>(EMPTY_SELF_CHECK);
  const [members, setMembers] = useState<TeamMemberInput[]>([]);
  const [consent, setConsent] = useState(false);

  const result = useMemo(() => evaluateSelfCheck(selfCheck), [selfCheck]);
  // Spark를 고르면 자가진단은 무시되고 Spark로 확정된다
  const resolvedTrack: Track = trackChoice === "SPARK" ? "SPARK" : result.resolvedTrack;

  const { run, pending, error } = useApiMutation(async () => {
    if (!token) throw new Error("no token");
    return api.registerTeam(token, {
      name: name.trim(),
      topic: topic.trim() || undefined,
      description: description.trim() || undefined,
      appliedTrack: trackChoice === "SPARK" ? "SPARK" : "SPRINT",
      selfCheck,
      members: members.map((m) => ({
        name: m.name.trim(),
        studentId: m.studentId.trim(),
        email: m.email.trim().toLowerCase(),
      })),
      privacyConsent: consent,
    });
  });

  // 조장을 포함한 인원 수
  const totalMembers = members.length + 1;
  const sizeValid = totalMembers >= minTeamSize && totalMembers <= maxTeamSize;
  const membersFilled = members.every(
    (m) => m.name.trim() && m.studentId.trim() && m.email.trim(),
  );
  const canSubmit = name.trim().length > 0 && consent && sizeValid && membersFilled;

  const fieldError = (field: string) =>
    error?.fields?.find((f) => f.field === field)?.message;

  const addMember = () => {
    if (totalMembers >= maxTeamSize) return;
    setMembers((prev) => [...prev, { name: "", studentId: "", email: "" }]);
  };

  const updateMember = (index: number, patch: Partial<TeamMemberInput>) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  };

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = await run();
    if (team) onRegistered();
  };

  const style = trackStyle(resolvedTrack);

  return (
    <Section
      eyebrow="Registration"
      title="팀 등록"
      description="로그인한 계정이 팀의 조장이 됩니다. 팀원 정보는 조장이 대신 입력합니다."
    >
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          {/* 1. 팀 정보 */}
          <fieldset className="space-y-5">
            <legend className="text-base font-bold">1. 팀 정보</legend>

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

            <Field label="한 줄 주제" hint="나중에 수정할 수 있습니다">
              {(id, describedBy) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  placeholder="예: 학식 대기열을 줄이는 예약 서비스"
                />
              )}
            </Field>

            <Field label="팀 소개">
              {(id, describedBy) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  placeholder="팀이 풀고 싶은 문제나 관심사를 자유롭게 적어주세요."
                />
              )}
            </Field>
          </fieldset>

          {/* 2. 트랙 선택 */}
          <fieldset>
            <legend className="text-base font-bold">2. 트랙 선택</legend>
            <p className="mt-1.5 text-sm text-muted">
              Spark는 1일차 아이디어톤, Sprint/Summit은 2일차 개발 트랙입니다.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TrackChoiceCard
                selected={trackChoice === "SPARK"}
                onSelect={() => setTrackChoice("SPARK")}
                title="Spark"
                subtitle="아이디어톤 · 1일차"
                description="기획서와 프로토타입으로 겨룹니다. 구현된 코드는 제출할 수 없습니다."
              />
              <TrackChoiceCard
                selected={trackChoice === "DEV"}
                onSelect={() => setTrackChoice("DEV")}
                title="Sprint / Summit"
                subtitle="개발 트랙 · 2일차"
                description="자가진단 결과에 따라 Sprint 또는 Summit으로 자동 배정됩니다."
              />
            </div>
          </fieldset>

          {/* 3. 자가진단 — 개발 트랙을 고른 경우에만 */}
          {trackChoice === "DEV" && (
            <fieldset>
              <legend className="text-base font-bold">3. 트랙 자가진단</legend>
              <p className="mt-1.5 text-sm text-muted">
                팀 구성원 중 <strong>한 명이라도</strong> 해당하면 체크해 주세요. 결과는 오른쪽에서
                실시간으로 확인할 수 있습니다.
              </p>

              <p className="mt-5 text-sm font-semibold">즉시 Summit 배정 사유</p>
              <div className="mt-2 space-y-2">
                {INSTANT_SUMMIT_ITEMS.map((item) => (
                  <CheckCard
                    key={item.key}
                    checked={selfCheck[item.key]}
                    onChange={(v) => setSelfCheck((p) => ({ ...p, [item.key]: v }))}
                    label={item.label}
                  />
                ))}
              </div>

              <p
                className={cx(
                  "mt-6 text-sm font-semibold transition-opacity",
                  result.instantSummit && "opacity-50",
                )}
              >
                체크리스트 ({CHECKLIST_THRESHOLD}개 이상이면 Summit)
              </p>
              <div
                className={cx(
                  "mt-2 space-y-2 transition-opacity",
                  result.instantSummit && "opacity-50",
                )}
              >
                {CHECKLIST_ITEMS.map((item) => (
                  <CheckCard
                    key={item.key}
                    checked={selfCheck[item.key]}
                    onChange={(v) => setSelfCheck((p) => ({ ...p, [item.key]: v }))}
                    label={item.label}
                    description={item.description}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {/* 4. 팀원 */}
          <fieldset>
            <legend className="text-base font-bold">
              {trackChoice === "DEV" ? "4" : "3"}. 팀원 정보
            </legend>
            <p className="mt-1.5 text-sm text-muted">
              조장을 포함해 {minTeamSize}~{maxTeamSize}명까지 등록할 수 있습니다. 팀원은
              등록된 이메일로 로그인하면 자동으로 팀에 연결됩니다.
            </p>

            <Card className="mt-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-crimson-100 px-2 py-0.5 text-xs font-bold text-crimson-700 dark:bg-crimson-950 dark:text-crimson-300">
                  조장
                </span>
                <span className="text-sm font-medium">{leaderName}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {leaderStudentId} · {leaderEmail}
              </p>
            </Card>

            <div className="mt-3 space-y-3">
              {members.map((member, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-subtle">
                      팀원 {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
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

                    <Field
                      label="학번"
                      required
                      error={fieldError(`members[${index}].studentId`)}
                    >
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

                    <Field
                      label="이메일"
                      required
                      error={fieldError(`members[${index}].email`)}
                    >
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
                onClick={addMember}
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

          {/* 5. 동의 */}
          <fieldset>
            <legend className="text-base font-bold">
              {trackChoice === "DEV" ? "5" : "4"}. 개인정보 수집·이용 동의
            </legend>

            <Card className="mt-4 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-[var(--text)]">수집 항목</strong> — 성명, 학번,
                한양대학교 이메일
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">수집 목적</strong> — 해커톤 참가자
                확인, 팀 구성 및 연락, 산출물 제출 및 평가 진행, 시상
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text)]">보유·이용 기간</strong> — 행사 종료 후
                3개월 이내 파기
              </p>
              <p className="mt-2">
                동의를 거부할 권리가 있으나, 거부 시 해커톤 참가가 제한됩니다.
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

        {/* 결과 요약 패널 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className={cx("ring-1", style.ring)}>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              배정될 트랙
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrackBadge track={resolvedTrack} />
              <span className={cx("text-xl font-black", style.accent)}>
                {TRACK_LABEL[resolvedTrack]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {TRACK_GOAL[resolvedTrack]}
            </p>

            <dl className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">팀 인원</dt>
                <dd className={cx("font-medium", !sizeValid && "text-red-600")}>
                  {totalMembers}명
                </dd>
              </div>
              {trackChoice === "DEV" && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">자가진단</dt>
                  <dd className="font-medium">
                    {result.instantSummit ? "즉시 배정" : `${result.checkedCount}/4`}
                  </dd>
                </div>
              )}
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-subtle">
              트랙은 등록 시 서버에서 최종 확정되며, 등록 후에는 운영진을 통해서만 변경할 수
              있습니다.
            </p>
          </Card>
        </div>
      </form>
    </Section>
  );
}

function TrackChoiceCard({
  selected,
  onSelect,
  title,
  subtitle,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        "rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-crimson-500 bg-crimson-50 dark:bg-crimson-950/30"
          : "border-[var(--border)] hover:bg-[var(--bg-muted)]",
      )}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-0.5 text-xs font-medium text-crimson-600">{subtitle}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
    </button>
  );
}

/** 이미 등록된 팀 정보. 등록 페이지에 다시 오면 이 화면이 뜬다. */
function MyTeamView({ team }: { team: Team }) {
  const style = trackStyle(team.track);

  return (
    <Section eyebrow="My Team" title="등록된 팀">
      <Card className={cx("ring-1", style.ring)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrackBadge track={team.track} />
              <h2 className="text-xl font-bold">{team.name}</h2>
            </div>
            {team.topic && <p className="mt-2 text-sm text-muted">{team.topic}</p>}
          </div>
          <span className="text-sm text-muted">{team.memberCount}명</span>
        </div>

        {team.trackReason && (
          <p className="mt-4 rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-xs text-muted">
            트랙 배정 근거 — {team.trackReason}
          </p>
        )}

        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <h3 className="text-sm font-semibold">팀원</h3>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li
                key={member.teamMemberId}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                {member.role === "LEADER" && (
                  <span className="rounded bg-crimson-100 px-1.5 py-0.5 text-[10px] font-bold text-crimson-700 dark:bg-crimson-950 dark:text-crimson-300">
                    조장
                  </span>
                )}
                <span className="font-medium">{member.name}</span>
                <span className="text-subtle">{member.studentId}</span>
                <span className="text-subtle">{member.email}</span>
                {!member.linked && (
                  <span className="text-xs text-amber-600">로그인 대기</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-subtle">
            아직 로그인하지 않은 팀원은 등록된 이메일로 로그인하면 자동으로 연결됩니다.
          </p>
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/submit"
          className="inline-flex h-11 items-center rounded-lg bg-crimson-600 px-5 text-sm font-semibold text-white hover:bg-crimson-700"
        >
          산출물 제출하기
        </Link>
        <Link
          href="/evaluate"
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-semibold hover:bg-[var(--bg-muted)]"
        >
          평가 페이지
        </Link>
      </div>
    </Section>
  );
}
