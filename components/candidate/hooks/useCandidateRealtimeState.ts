"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeSubscription } from "@/components/shared/realtime/useRealtimeSubscription";
import {
  CANDIDATE_RESULT_EVENT,
  CANDIDATE_RESULT_KEY,
  CANDIDATE_SESSION_EVENT,
  CANDIDATE_SESSION_KEY,
  readCandidateResultSummary,
  readCandidateSession,
} from "@/components/candidate/lib/candidateSessionStorage";

export function useCandidateRealtimeState() {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((prev) => prev + 1);
  }, []);

  const session = useMemo(() => readCandidateSession(), [version]);
  const summary = useMemo(() => readCandidateResultSummary(), [version]);
  const submissionId = session?.submissionId || "";

  useRealtimeSubscription({
    token: session?.candidateSessionToken || null,
    enabled: Boolean(session?.candidateSessionToken),
    events: [
      "candidate:data.changed",
      "candidate:session.updated",
      "admin:data.changed",
      "candidate:evaluation.updated",
      `candidate:session.updated:${submissionId}`,
      `candidate:submission.updated:${submissionId}`,
      `candidate:evaluation.updated:${submissionId}`,
    ],
    onEvent: refresh,
  });

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === CANDIDATE_SESSION_KEY || event.key === CANDIDATE_RESULT_KEY) {
        refresh();
      }
    };
    const onSessionEvent = () => refresh();
    const onResultEvent = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(CANDIDATE_SESSION_EVENT, onSessionEvent);
    window.addEventListener(CANDIDATE_RESULT_EVENT, onResultEvent);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CANDIDATE_SESSION_EVENT, onSessionEvent);
      window.removeEventListener(CANDIDATE_RESULT_EVENT, onResultEvent);
    };
  }, [refresh]);

  return { session, summary, refresh };
}

