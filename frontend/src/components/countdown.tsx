"use client";

import { useEffect, useState } from "react";

/**
 * 마감까지 남은 시간.
 *
 * 서버 시각과 브라우저 시각의 차이를 처음 한 번 계산해 두고, 이후 그 차이를 반영해
 * 표시한다. 사용자의 시계가 어긋나 있어도 실제 마감과 같은 값을 보여주기 위해서다.
 * (실제 제출 잠금은 서버가 판정하므로 이 표시는 안내용이다.)
 */
export function Countdown({
  deadline,
  serverTime,
  label,
  onExpire,
}: {
  deadline: string;
  serverTime: string;
  label: string;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const deadlineMs = new Date(deadline).getTime();
    // 양수면 브라우저 시계가 서버보다 빠르다는 뜻
    const clockSkew = Date.now() - new Date(serverTime).getTime();

    const tick = () => {
      const serverNow = Date.now() - clockSkew;
      const left = Math.max(deadlineMs - serverNow, 0);
      setRemaining(left);
      if (left === 0) onExpire?.();
      return left;
    };

    if (tick() === 0) return;
    const timer = setInterval(() => {
      if (tick() === 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, serverTime, onExpire]);

  // 서버 시각 보정 전에는 아무것도 그리지 않는다 (깜빡임 방지)
  if (remaining === null) {
    return <div className="h-[76px]" aria-hidden="true" />;
  }

  if (remaining === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">{label}</p>
        <p className="mt-1 text-2xl font-bold text-red-600">마감되었습니다</p>
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    ...(days > 0 ? [{ value: days, label: "일" }] : []),
    { value: hours, label: "시간" },
    { value: minutes, label: "분" },
    { value: seconds, label: "초" },
  ];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-subtle">{label}</p>
      <div
        className="mt-1.5 flex items-baseline gap-3"
        // 매초 읽히면 방해가 되므로 스크린리더에는 통째로 한 번만 알린다
        aria-live="off"
        aria-label={`${label} ${days > 0 ? `${days}일 ` : ""}${hours}시간 ${minutes}분 남음`}
      >
        {units.map((unit) => (
          <span key={unit.label} className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums sm:text-3xl">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted">{unit.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
