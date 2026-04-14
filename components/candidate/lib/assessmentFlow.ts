import type { CandidateSession } from "@/components/candidate/lib/candidateSessionStorage";

const SUPPORTED_SECTION_KEYS = [
  "mcq",
  "coding",
  "short_answer",
  "long_answer",
  "scenario",
  "ui_preview",
  "portfolio_link",
  "bug_report",
  "test_case",
] as const;
type SupportedSectionKey = (typeof SUPPORTED_SECTION_KEYS)[number];

function normalizeSections(input?: string[]): SupportedSectionKey[] {
  if (!Array.isArray(input) || input.length === 0) return [];
  const normalized = input
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value): value is SupportedSectionKey => SUPPORTED_SECTION_KEYS.includes(value as SupportedSectionKey));
  return Array.from(new Set(normalized));
}

function applyRoleSectionPolicy(
  roleCategory: CandidateSession["test"]["roleCategory"] | undefined,
  sections: SupportedSectionKey[]
): SupportedSectionKey[] {
  if (roleCategory === "frontend") {
    // Frontend role flow is fixed: MCQ + UI Preview only.
    const allowed: SupportedSectionKey[] = ["mcq", "ui_preview"];
    return allowed.filter((section) => sections.includes(section));
  }
  return sections;
}

export function getSupportedSections(session: CandidateSession | null): SupportedSectionKey[] {
  const explicitSections = normalizeSections(session?.test?.enabledSections);

  const derivedSections: SupportedSectionKey[] = [];
  if ((session?.test?.mcqQuestions || []).length > 0) derivedSections.push("mcq");
  if ((session?.test?.codingTasks || []).length > 0) derivedSections.push("coding");

  const sectionConfigKeys = (session?.test?.sectionConfigs || [])
    .map((item) => String(item?.key || "").trim().toLowerCase())
    .filter((value): value is SupportedSectionKey =>
      SUPPORTED_SECTION_KEYS.includes(value as SupportedSectionKey)
    );

  const merged = Array.from(new Set([...explicitSections, ...derivedSections, ...sectionConfigKeys]));
  const withRolePolicy = applyRoleSectionPolicy(session?.test?.roleCategory, merged);
  if (withRolePolicy.length > 0) return withRolePolicy;
  if (merged.length > 0) return merged;
  return ["mcq", "coding"];
}

export function isMcqEnabled(session: CandidateSession | null): boolean {
  return getSupportedSections(session).includes("mcq");
}

export function isCodingEnabled(session: CandidateSession | null): boolean {
  return getSupportedSections(session).includes("coding");
}

export function getCandidateStartRoute(session: CandidateSession | null): string | null {
  if (isMcqEnabled(session)) return "/candidate/test";
  if (hasUiPreviewSections(session)) return "/candidate/ui-preview";
  if (hasAssessmentSections(session)) return "/candidate/assessment";
  if (isCodingEnabled(session)) return "/candidate/tasks";
  return null;
}

export function hasNonCodingSections(session: CandidateSession | null): boolean {
  const sections = getSupportedSections(session);
  return sections.some((section) => section !== "mcq" && section !== "coding");
}

export function hasUiPreviewSections(session: CandidateSession | null): boolean {
  return getSupportedSections(session).includes("ui_preview");
}

export function hasAssessmentSections(session: CandidateSession | null): boolean {
  const sections = getSupportedSections(session);
  return sections.some((section) => section !== "mcq" && section !== "coding" && section !== "ui_preview");
}

export function getRouteAfterMcq(
  session: CandidateSession | null
): "/candidate/ui-preview" | "/candidate/assessment" | "/candidate/tasks" | "/candidate/submitted" {
  if (hasUiPreviewSections(session)) return "/candidate/ui-preview";
  if (hasAssessmentSections(session)) return "/candidate/assessment";
  if (isCodingEnabled(session)) return "/candidate/tasks";
  return "/candidate/submitted";
}

export function getRouteAfterAssessment(session: CandidateSession | null): "/candidate/tasks" | "/candidate/submitted" {
  return isCodingEnabled(session) ? "/candidate/tasks" : "/candidate/submitted";
}

export function getRouteAfterUiPreview(
  session: CandidateSession | null
): "/candidate/assessment" | "/candidate/tasks" | "/candidate/submitted" {
  if (hasAssessmentSections(session)) return "/candidate/assessment";
  if (isCodingEnabled(session)) return "/candidate/tasks";
  return "/candidate/submitted";
}
