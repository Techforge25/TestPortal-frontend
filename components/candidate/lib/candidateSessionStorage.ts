type CandidateSession = {
  submissionId: string;
  candidateSessionToken: string;
  mcqAnswers?: Array<{ questionIndex: number; selectedOptionIndex: number }>;
  sectionAnswers?: Array<{
    sectionKey:
      | "short_answer"
      | "long_answer"
      | "scenario"
      | "ui_preview"
      | "portfolio_link"
      | "bug_report"
      | "test_case";
    itemIndex: number;
    answer: string;
  }>;
  test: {
    id: string;
    title: string;
    position: string;
    durationMinutes: number;
    passPercentage: number;
    roleCategory?: "developer" | "frontend" | "designer" | "video_editor" | "qa_manual" | "hr" | "sales" | "other";
    enabledSections?: string[];
    security: {
      forceFullscreen?: boolean;
      disableTabSwitch?: boolean;
      autoEndOnTabChange?: boolean;
      disableCopyPaste?: boolean;
      disableRightClick?: boolean;
      detectDevTools?: boolean;
      warningLimit?: number;
      autoSaveIntervalSeconds?: number;
    };
    mcqQuestions: Array<{
      index: number;
      question: string;
      options: string[];
      marks: number;
    }>;
    codingTasks: Array<{
      index: number;
      title: string;
      description: string;
      language: string;
      marks: number;
      sampleInput: string;
      sampleOutput: string;
    }>;
    sectionConfigs?: Array<{
      index: number;
      key:
        | "short_answer"
        | "long_answer"
        | "scenario"
        | "ui_preview"
        | "portfolio_link"
        | "bug_report"
        | "test_case";
      title: string;
      prompt: string;
      instructions?: string;
      required?: boolean;
    }>;
  };
  candidate: {
    name: string;
    email: string;
  };
};

const CANDIDATE_SESSION_KEY = "candidate_test_session";
const CANDIDATE_RESULT_KEY = "candidate_test_result";

type CandidateTestResultSummary = {
  mcqScore: number;
  mcqTotal: number;
  submittedAt: string;
  codingEvaluation?: {
    status: "not_required" | "queued" | "running" | "completed" | "failed";
    totalMarks: number;
    maxMarks: number;
  };
};

export function saveCandidateSession(session: CandidateSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(session));
}

export function readCandidateSession(): CandidateSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CANDIDATE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CandidateSession;
  } catch {
    return null;
  }
}

export function clearCandidateSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CANDIDATE_SESSION_KEY);
}

export function saveCandidateResultSummary(result: CandidateTestResultSummary) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CANDIDATE_RESULT_KEY, JSON.stringify(result));
}

export function readCandidateResultSummary(): CandidateTestResultSummary | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CANDIDATE_RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CandidateTestResultSummary;
  } catch {
    return null;
  }
}

export function clearCandidateResultSummary() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CANDIDATE_RESULT_KEY);
}

export type { CandidateSession, CandidateTestResultSummary };
