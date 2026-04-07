import type { CandidateSession } from "@/components/candidate/lib/candidateSessionStorage";

const SUPPORTED_SECTION_KEYS = [
  "mcq",
  "coding",
  "short_answer",
  "long_answer",
  "scenario",
  "portfolio_link",
  "bug_report",
  "test_case",
] as const;
type SupportedSectionKey = (typeof SUPPORTED_SECTION_KEYS)[number];

function normalizeSections(input?: string[]): SupportedSectionKey[] {
  if (!Array.isArray(input) || input.length === 0) {
    return ["mcq", "coding"];
  }
  const normalized = input
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value): value is SupportedSectionKey => SUPPORTED_SECTION_KEYS.includes(value as SupportedSectionKey));
  return normalized.length > 0 ? Array.from(new Set(normalized)) : [];
}

export function getSupportedSections(session: CandidateSession | null): SupportedSectionKey[] {
  return normalizeSections(session?.test?.enabledSections);
}

export function isMcqEnabled(session: CandidateSession | null): boolean {
  return getSupportedSections(session).includes("mcq");
}

export function isCodingEnabled(session: CandidateSession | null): boolean {
  return getSupportedSections(session).includes("coding");
}

export function getCandidateStartRoute(session: CandidateSession | null): string | null {
  if (isMcqEnabled(session)) return "/candidate/test";
  if (hasNonCodingSections(session)) return "/candidate/assessment";
  if (isCodingEnabled(session)) return "/candidate/tasks";
  return null;
}

export function hasNonCodingSections(session: CandidateSession | null): boolean {
  const sections = getSupportedSections(session);
  return sections.some((section) => section !== "mcq" && section !== "coding");
}

export function getRouteAfterMcq(session: CandidateSession | null): "/candidate/assessment" | "/candidate/tasks" | "/candidate/submitted" {
  if (hasNonCodingSections(session)) return "/candidate/assessment";
  if (isCodingEnabled(session)) return "/candidate/tasks";
  return "/candidate/submitted";
}

export function getRouteAfterAssessment(session: CandidateSession | null): "/candidate/tasks" | "/candidate/submitted" {
  return isCodingEnabled(session) ? "/candidate/tasks" : "/candidate/submitted";
}
