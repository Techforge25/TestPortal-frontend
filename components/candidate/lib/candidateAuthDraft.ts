"use client";

const CANDIDATE_AUTH_DRAFT_KEY = "candidate-auth-draft-v1";

export type CandidateAuthDraft = {
  email: string;
  testPasscode: string;
};

export function saveCandidateAuthDraft(payload: CandidateAuthDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CANDIDATE_AUTH_DRAFT_KEY, JSON.stringify(payload));
}

export function readCandidateAuthDraft(): CandidateAuthDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CANDIDATE_AUTH_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CandidateAuthDraft;
    if (!parsed?.email || !parsed?.testPasscode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCandidateAuthDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CANDIDATE_AUTH_DRAFT_KEY);
}

