"use client";

import { useEffect, useState } from "react";

type CandidateCountdownProps = {
  deadlineAt: number;
  className?: string;
};

export function CandidateCountdown({ deadlineAt, className = "" }: CandidateCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.floor((deadlineAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.floor((deadlineAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadlineAt]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return <p className={className}>{`${minutes}:${seconds}`}</p>;
}
