"use client";

import { useState } from "react";
import { Button, Field, TextArea, TextInput } from "@/components/form";
import { FeeNotice } from "@/components/fee-notice";
import { Alert, Card, Section, TrackBadge, cx, trackStyle } from "@/components/ui";
import { api } from "@/lib/api";
import { EMPTY_SELF_CHECK, TRACK_GOAL, TRACK_LABEL, TRACK_TAGLINE } from "@/lib/track-rules";
import { entryFeeOf, formatFee } from "@/lib/fee";
import { RECRUIT_OPTIONS } from "@/lib/recruit";
import { useApiMutation, useAuth } from "@/lib/use-auth";
import type { RecruitStatus, TeamMemberInput, Track } from "@/lib/types";

/**
 * 팀 등록 폼.
 *
 * 받는 것은 팀명·트랙·팀원·팀장·모집 상태뿐이다. 주제나 소개는 받지 않는다 —
 * 신청 시점에는 아직 정해지지 않은 경우가 많고, 결과물 제출 단계에서 다시 받는다.
 *
 * 혼자 신청하거나 인원이 모자란 팀도 그대로 등록한다. 모집 상태를 함께 받아 두면,
 * 등록 뒤 "팀" 화면에서 서로 필요한 것이 반대인 팀을 찾아 합치기를 신청할 수 있다.
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

const EMPTY_MEMBER: TeamMemberInput = {
  name: "",
  studentId: "",
  email: "",
  duesPaid: true,
};

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
  const [myDuesPaid, setMyDuesPaid] = useState(true);
  // 팀장 이메일. 비워 두면 등록하는 본인이 팀장이 된다.
  const [leaderEmail, setLeaderEmail] = useState("");
  const [recruiting, setRecruiting] = useState<RecruitStatus>("NONE");
  const [recruitNote, setRecruitNote] = useState("");

  const myEmail = (user?.email ?? "").toLowerCase();

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
        duesPaid: m.duesPaid,
      })),
      leaderEmail: leaderEmail || undefined,
      recruiting,
      recruitNote: recruitNote.trim() || undefined,
      duesPaid: myDuesPaid,
    });
  });

  const totalMembers = members.length + 1;
  const sizeValid = totalMembers >= minTeamSize && totalMembers <= maxTeamSize;
  const membersFilled = members.every(
    (m) => m.name.trim() && m.studentId.trim() && m.email.trim(),
  );
  const canSubmit = name.trim().length > 0 && sizeValid && membersFilled;

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

  // 참가비 대상 — 학생회비를 내지 않았다고 고른 사람들
  const feeNames = [
    ...(myDuesPaid ? [] : [user?.name ?? "본인"]),
    ...members.filter((m) => !m.duesPaid).map((m, i) => m.name.trim() || `팀원 ${i + 1}`),
  ];

  // 팀장 후보 — 본인과 이름·이메일을 다 적은 팀원
  const leaderChoices = [
    { email: myEmail, label: `${user?.name ?? "본인"} (나)` },
    ...members
      .filter((m) => m.email.trim() && m.name.trim())
      .map((m) => ({ email: m.email.trim().toLowerCase(), label: m.name.trim() })),
  ];

  return (
    <Section
      eyebrow="Registration"
      title="팀 등록"
      description="팀마다 한 번만 등록하면 됩니다. 인원이 모자라도 먼저 등록한 뒤 다른 팀과 합칠 수 있습니다."
    >
      <div className="mb-8">
        <Alert tone="info" title="팀마다 한 사람만 등록합니다">
          등록하는 사람이 팀원 정보를 함께 입력합니다. 팀원은 <strong>따로 등록할 필요가
          없고</strong>, 적어 넣은 한양대학교 이메일로 로그인하면 자동으로 우리 팀에
          들어옵니다. 등록이 끝난 뒤에는 팀원이 다른 팀을 새로 만들 수 없습니다.
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
                : "Spark는 1일차 아이디어톤, Sprint와 Summit은 2일차 개발 트랙입니다."}{" "}
              학생회비 미납 또는 휴학생은 참가 트랙에 따라 참가비가 달라집니다.
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
                  <p className="mt-2 text-xs font-bold">
                    참가비 {formatFee(entryFeeOf(item.track))}
                  </p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">3. 팀원 정보</legend>
            <p className="mt-1.5 text-sm text-muted">
              본인을 포함해 {minTeamSize}~{maxTeamSize}명까지 등록할 수 있습니다. 혼자
              신청해도 되고, 뒤에서 다른 팀과 합칠 수 있습니다.
            </p>

            <Card className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border-2 border-current/20 px-2.5 py-0.5 text-xs font-bold">
                  나
                </span>
                <span className="text-sm font-bold">{user?.name}</span>
                <span className="text-xs text-muted">
                  {user?.studentId} · {user?.email}
                </span>
              </div>
              <div className="mt-3">
                <DuesChoice
                  name="my-dues"
                  value={myDuesPaid}
                  onChange={setMyDuesPaid}
                />
              </div>
            </Card>

            <div className="mt-3 space-y-3">
              {members.map((member, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-subtle">팀원 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const removed = members[index].email.trim().toLowerCase();
                        if (removed && removed === leaderEmail) setLeaderEmail("");
                        setMembers((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="text-xs font-bold text-red-600 hover:underline"
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

                  <div className="mt-3">
                    <DuesChoice
                      name={`dues-${index}`}
                      value={member.duesPaid}
                      onChange={(v) => updateMember(index, { duesPaid: v })}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {totalMembers < maxTeamSize && (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => setMembers((prev) => [...prev, { ...EMPTY_MEMBER }])}
              >
                + 팀원 추가
              </Button>
            )}

            {!sizeValid && (
              <p className="mt-3 text-xs font-bold text-red-600">
                팀 인원은 본인 포함 {minTeamSize}~{maxTeamSize}명이어야 합니다. (현재{" "}
                {totalMembers}명)
              </p>
            )}

            {feeNames.length > 0 && (
              <div className="mt-5">
                <FeeNotice names={feeNames} track={track} />
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">4. 팀장 지정</legend>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              팀을 등록한 사람이 자동으로 팀장이 되지 않습니다. 팀원 중에서 직접 고르세요.
              팀장은 결과물 제출과 팀 정보 수정을 맡습니다. 등록한 본인도 계속 수정할 수
              있습니다.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {leaderChoices.map((choice) => {
                const active = (leaderEmail || myEmail) === choice.email;
                return (
                  <button
                    key={choice.email}
                    type="button"
                    onClick={() => setLeaderEmail(choice.email)}
                    aria-pressed={active}
                    className={cx(
                      "rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-colors",
                      active
                        ? "border-transparent bg-grad-brand text-white"
                        : "border-current/15 hover:bg-current/5",
                    )}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            {members.length > 0 && leaderChoices.length === 1 && (
              <p className="mt-2 text-xs text-subtle">
                팀원의 성명과 이메일을 적으면 그 사람도 팀장으로 고를 수 있습니다.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-base font-bold">5. 모집</legend>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              인원이 모자라면 모집 상태를 켜 두세요. 팀원을 찾는 팀에게는 팀장을 찾는 쪽이,
              팀장을 찾는 쪽에는 팀원을 찾는 팀이 보입니다. 등록 뒤에도 바꿀 수 있습니다.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {RECRUIT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRecruiting(option.value)}
                  aria-pressed={recruiting === option.value}
                  className={cx(
                    "rounded-2xl border-2 p-4 text-left transition-colors",
                    recruiting === option.value
                      ? "border-brand-600 bg-brand-600/5"
                      : "border-current/15 hover:bg-current/5",
                  )}
                >
                  <p className="font-bold">{option.label}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            {recruiting !== "NONE" && (
              <div className="mt-4">
                <Field label="모집 글 한마디" hint="어떤 사람을 찾는지 적어 두면 연락이 빨라집니다">
                  {(id, describedBy) => (
                    <TextArea
                      id={id}
                      aria-describedby={describedBy}
                      value={recruitNote}
                      onChange={(e) => setRecruitNote(e.target.value)}
                      maxLength={300}
                      placeholder="예: 프론트엔드 1명 더 구합니다. 2일차 Sprint로 참가 예정입니다."
                    />
                  )}
                </Field>
              </div>
            )}
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
            <p className="text-xs font-bold uppercase tracking-wider text-subtle">
              선택한 트랙
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrackBadge track={track} />
              <span className={cx("font-display text-xl tracking-tight", style.accent)}>
                {TRACK_LABEL[track]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{TRACK_GOAL[track]}</p>

            <dl className="mt-4 space-y-2 border-t-2 border-current/10 pt-4 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">팀 인원</dt>
                <dd className={cx("font-bold", !sizeValid && "text-red-600")}>
                  {totalMembers}명
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">참가비 대상</dt>
                <dd className="font-bold">{feeNames.length}명</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">모집</dt>
                <dd className="font-bold">
                  {RECRUIT_OPTIONS.find((o) => o.value === recruiting)?.label}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-subtle">
              등록 후 트랙을 바꾸려면 운영진에게 문의해야 합니다. 팀명과 모집 상태는 신청
              기간 동안 직접 수정할 수 있습니다.
            </p>
          </Card>
        </div>
      </form>
    </Section>
  );
}

/** 학생회비 납부 여부. 미납·휴학이면 참가비 1만원 대상이 된다. */
function DuesChoice({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const options = [
    { value: true, label: "학생회비 납부 재학생" },
    { value: false, label: "미납 또는 휴학 (참가비 1만원)" },
  ];

  return (
    <div role="radiogroup" aria-label="학생회비 납부 여부" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          name={name}
          onClick={() => onChange(option.value)}
          className={cx(
            "rounded-full border-2 px-4 py-2 text-xs font-bold transition-colors",
            value === option.value
              ? "border-brand-600 bg-brand-600/5 text-brand-700 dark:text-brand-200"
              : "border-current/15 text-muted hover:bg-current/5",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
