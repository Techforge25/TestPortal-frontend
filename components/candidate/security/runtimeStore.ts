type RuntimeState = {
  deadlineAt: number;
  warningCount: number;
};

function key(submissionId: string) {
  return `candidate_runtime_${submissionId}`;
}

export function readRuntimeState(submissionId: string): RuntimeState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(submissionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RuntimeState;
  } catch {
    return null;
  }
}

export function saveRuntimeState(submissionId: string, next: RuntimeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(submissionId), JSON.stringify(next));
}

export function clearRuntimeState(submissionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(submissionId));
}

