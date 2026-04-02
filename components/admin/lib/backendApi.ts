import type { AdminTestListItem } from "@/components/admin/lib/testListStorage";

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "/backend").replace(/\/$/, "");

type RequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
};

type BackendMcqQuestion = {
  question: string;
  options: Array<{ text: string }>;
  correctOptionIndex: number;
  marks: number;
};

type BackendCodingTask = {
  title: string;
  description: string;
  language: string;
  marks: number;
  sampleInput: string;
  sampleOutput: string;
};

type BackendTest = {
  _id: string;
  title: string;
  position: string;
  durationMinutes: number;
  passPercentage: number;
  passcode: string;
  passcodeExpiresAt?: string;
  status: "draft" | "active";
  createdAt: string;
  mcqQuestions: BackendMcqQuestion[];
  codingTasks: BackendCodingTask[];
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export type AdminLoginResult = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin";
    mustChangePassword: boolean;
  };
};

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  return request<AdminLoginResult>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

function mapBackendTestToAdminListItem(test: BackendTest): AdminTestListItem {
  return {
    id: test._id,
    testName: test.title,
    position: test.position,
    duration: test.durationMinutes,
    mcqs: test.mcqQuestions.length,
    coding: test.codingTasks.length,
    mcqQuestionItems: test.mcqQuestions.map((q, index) => q.question || `Question ${index + 1}`),
    codingTaskItems: test.codingTasks.map((task, index) => task.title || `Task ${index + 1}`),
    passcode: test.passcode,
    passcodeExpiresAt: test.passcodeExpiresAt,
    status: test.status === "active" ? "Active" : "Draft",
    created: new Date(test.createdAt).toISOString().slice(0, 10),
  };
}

export async function listAdminTests(token: string): Promise<AdminTestListItem[]> {
  const result = await request<{ tests: BackendTest[] }>("/api/admin/tests", { token });
  return (result.tests || []).map(mapBackendTestToAdminListItem);
}

export type SaveAdminTestPayload = {
  id?: string | number;
  testName: string;
  position: string;
  duration: number;
  passPercentage: number;
  status: "draft" | "active";
  warningLimit: number;
  autoSaveIntervalSeconds: number;
  securityFlags: {
    forceFullscreen: boolean;
    disableTabSwitch: boolean;
    autoEndOnTabChange: boolean;
    disableCopyPaste: boolean;
    disableRightClick: boolean;
    devToolsDetection: boolean;
  };
  mcqQuestions: Array<{
    prompt: string;
    options: string[];
    selectedIndex: number;
    marks: number;
  }>;
  codingTasks: Array<{
    taskName: string;
    description: string;
    language: string;
    marks: number;
    sampleInput: string;
    sampleOutput: string;
  }>;
};

function buildBackendTestPayload(payload: SaveAdminTestPayload) {
  return {
    title: payload.testName,
    position: payload.position,
    durationMinutes: payload.duration,
    passPercentage: payload.passPercentage,
    status: payload.status,
    security: {
      forceFullscreen: payload.securityFlags.forceFullscreen,
      disableTabSwitch: payload.securityFlags.disableTabSwitch,
      autoEndOnTabChange: payload.securityFlags.autoEndOnTabChange,
      disableCopyPaste: payload.securityFlags.disableCopyPaste,
      disableRightClick: payload.securityFlags.disableRightClick,
      detectDevTools: payload.securityFlags.devToolsDetection,
      warningLimit: payload.warningLimit,
      autoSaveIntervalSeconds: payload.autoSaveIntervalSeconds,
    },
    mcqQuestions: payload.mcqQuestions.map((q) => ({
      question: q.prompt,
      options: q.options.map((text) => ({ text })),
      correctOptionIndex: q.selectedIndex,
      marks: q.marks,
    })),
    codingTasks: payload.codingTasks.map((task) => ({
      title: task.taskName,
      description: task.description,
      language: task.language,
      marks: task.marks,
      sampleInput: task.sampleInput,
      sampleOutput: task.sampleOutput,
    })),
  };
}

export async function saveAdminTest(
  token: string,
  payload: SaveAdminTestPayload
): Promise<AdminTestListItem> {
  const backendPayload = buildBackendTestPayload(payload);
  const hasId = payload.id !== undefined && payload.id !== null && String(payload.id).trim().length > 0;
  const path = hasId ? `/api/admin/tests/${payload.id}` : "/api/admin/tests";
  const method = hasId ? "PATCH" : "POST";
  const result = await request<{ test: BackendTest }>(path, {
    method,
    token,
    body: backendPayload,
  });
  return mapBackendTestToAdminListItem(result.test);
}

export async function deleteAdminTest(token: string, id: string | number) {
  await request<{ message: string }>(`/api/admin/tests/${id}`, {
    method: "DELETE",
    token,
  });
}

type CandidateLoginResponse = {
  message: string;
  resumed: boolean;
  candidateSessionToken: string;
  test: {
    id: string;
    title: string;
    position: string;
    durationMinutes: number;
    passPercentage: number;
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
  };
  submission: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    status: string;
    startedAt: string;
  };
};

export type CandidateProfilePayload = {
  phoneNumber: string;
  cnic: string;
  maritalStatus: string;
  qualification: string;
  dateOfBirth: string;
  positionAppliedFor: string;
  residentialAddress: string;
  workExperience: string;
  startDate: string;
  endDate: string;
  currentSalary: string;
  expectedSalary: string;
  expectedJoiningDate: string;
  shiftComfortable: string;
};

export async function getCandidateTestByPasscode(passcode: string) {
  return request<{
    test: {
      id: string;
      title: string;
      position: string;
      durationMinutes: number;
      passPercentage: number;
    };
  }>(`/api/candidate/test/${encodeURIComponent(passcode)}`);
}

export async function candidateLoginWithPasscode(payload: {
  candidateEmail: string;
  candidateName?: string;
  testPasscode: string;
  candidateProfile?: CandidateProfilePayload;
}): Promise<CandidateLoginResponse> {
  return request<CandidateLoginResponse>("/api/candidate/login-with-passcode", {
    method: "POST",
    body: payload,
  });
}

export type AdminDashboardResponse = {
  stats: {
    totalTests: number;
    activeTests: number;
    totalCandidates: number;
    completedTests: number;
    averageScore: number;
    violations: number;
  };
  recentActivities: Array<{ title: string; sub: string; time: string }>;
  performance: {
    daily: Array<{ day: string; value: number }>;
    weekly: Array<{ day: string; value: number }>;
    yearly: Array<{ day: string; value: number }>;
  };
  recentResults: Array<{
    candidate: string;
    position: string;
    test: string;
    score: string;
    status: string;
    date: string;
  }>;
};

export async function getAdminDashboardData(token: string) {
  return request<AdminDashboardResponse>("/api/admin/dashboard", { token });
}

export type AdminReviewRow = {
  id: string;
  candidate: string;
  testInfo: string;
  submitted: string;
  score: string;
  codingStatus: "In Review" | "Reviewed";
  reviewStatus: "Pending" | "Passed" | "Failed" | "Shortlisted" | "On Hold";
  violations: number;
  action: "Review" | "View";
};

export async function listAdminReviews(
  token: string,
  params: { tab: "pending" | "all" | "completed"; search: string }
) {
  const query = new URLSearchParams({
    tab: params.tab,
    search: params.search,
  });
  return request<{
    summary: { pending: number; reviewedToday: number; passed: number; failed: number };
    rows: AdminReviewRow[];
  }>(`/api/admin/reviews?${query.toString()}`, { token });
}

export type AdminReviewDetailResponse = {
  submission: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    candidateProfile: CandidateProfilePayload;
    status: string;
    test: {
      id: string;
      title: string;
      position: string;
      passPercentage: number;
    } | null;
    submittedAt: string;
    overview: {
      mcqScorePercent: number;
      codingScorePercent: number;
      totalScorePercent: number;
      timeTaken: string;
      violations: number;
    };
    review: {
      decision: "" | "Passed" | "Failed" | "Shortlisted" | "On Hold";
      comment: string;
      codingReviews?: Array<{
        taskIndex: number;
        title: string;
        marksAwarded: number;
        status: "Under Review" | "Passed" | "Failed" | "On Hold";
        feedback: string;
      }>;
      reviewedAt: string;
    };
    mcqRows: Array<{
      q: number;
      question: string;
      selected: string;
      correct: string;
      marks: string;
      wrong: boolean;
    }>;
    codingRows: Array<{
      taskIndex: number;
      title: string;
      language: string;
      maxMarks: number;
      marksAwarded: number;
      status: "Under Review" | "Passed" | "Failed" | "On Hold";
      code: string;
      feedback: string;
    }>;
    violationRows: Array<{
      id: string;
      type: string;
      severity: "low" | "medium" | "high";
      actionTaken: string;
      occurredAt: string;
    }>;
  };
};

export async function getAdminReviewDetail(token: string, submissionId: string) {
  return request<AdminReviewDetailResponse>(`/api/admin/reviews/${submissionId}`, { token });
}

export async function saveAdminReviewDecision(
  token: string,
  submissionId: string,
  payload: {
    decision: "Passed" | "Failed" | "Shortlisted" | "On Hold";
    comment: string;
    codingReviews?: Array<{
      taskIndex: number;
      marksAwarded: number;
      status: "Under Review" | "Passed" | "Failed" | "On Hold";
      feedback: string;
    }>;
  }
) {
  return request<{
    message: string;
    review: {
      decision: "Passed" | "Failed" | "Shortlisted" | "On Hold";
      comment: string;
      codingReviews?: Array<{
        taskIndex: number;
        title: string;
        marksAwarded: number;
        status: "Under Review" | "Passed" | "Failed" | "On Hold";
        feedback: string;
      }>;
      reviewedAt: string;
    };
  }>(`/api/admin/reviews/${submissionId}/decision`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export type AdminCandidateRow = {
  id: string;
  candidate: string;
  position: string;
  mcqScore: string;
  codingStatus: "Reviewed" | "Pending";
  violations: number;
  finalStatus: "Passed" | "Failed" | "Pending";
  date: string;
};

export async function listAdminCandidates(
  token: string,
  params: { search: string; position: string; severity: string }
) {
  const query = new URLSearchParams({
    search: params.search,
    position: params.position,
    severity: params.severity,
  });
  return request<{ rows: AdminCandidateRow[] }>(`/api/admin/candidates?${query.toString()}`, { token });
}

export type AdminViolationRow = {
  id: string;
  candidate: string;
  test: string;
  violationType: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  actionTaken: string;
};

export async function listAdminViolations(
  token: string,
  params: { search: string; severity: string }
) {
  const query = new URLSearchParams({
    search: params.search,
    severity: params.severity,
  });
  return request<{ rows: AdminViolationRow[] }>(`/api/admin/violations?${query.toString()}`, { token });
}

export async function saveCandidateDraft(payload: {
  submissionId: string;
  candidateSessionToken: string;
  mcqAnswers?: Array<{ questionIndex: number; selectedOptionIndex: number }>;
  codingAnswers?: Array<{ taskIndex: number; code: string; language: string }>;
}) {
  return request<{ message: string }>(`/api/candidate/submission/${payload.submissionId}/draft`, {
    method: "POST",
    headers: { "x-candidate-session": payload.candidateSessionToken },
    body: {
      mcqAnswers: payload.mcqAnswers || [],
      codingAnswers: payload.codingAnswers || [],
    },
  });
}

export async function submitCandidateTest(payload: {
  submissionId: string;
  candidateSessionToken: string;
  mcqAnswers: Array<{ questionIndex: number; selectedOptionIndex: number }>;
  codingAnswers: Array<{ taskIndex: number; code: string; language: string }>;
  auto?: boolean;
  endedReason?: string;
}) {
  return request<{ message: string; submission: { id: string; totalScore: number; status: string } }>(
    `/api/candidate/submission/${payload.submissionId}/submit`,
    {
      method: "POST",
      headers: { "x-candidate-session": payload.candidateSessionToken },
      body: {
        mcqAnswers: payload.mcqAnswers,
        codingAnswers: payload.codingAnswers,
        auto: payload.auto ?? false,
        endedReason: payload.endedReason || "",
      },
    }
  );
}

export async function logCandidateViolation(payload: {
  submissionId: string;
  candidateSessionToken: string;
  type: string;
  severity?: "low" | "medium" | "high";
  actionTaken?: string;
  meta?: Record<string, unknown>;
}) {
  return request<{
    message: string;
    warningCount: number;
    warningLimit: number;
    shouldAutoEnd: boolean;
  }>(`/api/candidate/submission/${payload.submissionId}/violation`, {
    method: "POST",
    headers: { "x-candidate-session": payload.candidateSessionToken },
    body: {
      type: payload.type,
      severity: payload.severity || "medium",
      actionTaken: payload.actionTaken || "warning_issued",
      meta: payload.meta || {},
    },
  });
}

export async function runCandidateCode(payload: {
  submissionId: string;
  candidateSessionToken: string;
  language: string;
  sourceCode: string;
  stdin?: string;
}) {
  return request<{
    message: string;
    result: {
      status: string;
      stdout: string;
      stderr: string;
      compileOutput: string;
      message: string;
      time: string;
      memory: string;
    };
  }>(`/api/candidate/submission/${payload.submissionId}/run-code`, {
    method: "POST",
    headers: { "x-candidate-session": payload.candidateSessionToken },
    body: {
      language: payload.language,
      sourceCode: payload.sourceCode,
      stdin: payload.stdin || "",
    },
  });
}

export async function getAdminNotificationSettings(token: string) {
  return request<{
    notifications: {
      testCompleted: boolean;
      newCandidate: boolean;
      violationAlert: boolean;
    };
  }>("/api/admin/settings/notifications", { token });
}

export async function saveAdminNotificationSettings(
  token: string,
  payload: { testCompleted: boolean; newCandidate: boolean; violationAlert: boolean }
) {
  return request<{
    message: string;
    notifications: {
      testCompleted: boolean;
      newCandidate: boolean;
      violationAlert: boolean;
    };
  }>("/api/admin/settings/notifications", {
    method: "PATCH",
    token,
    body: payload,
  });
}

export type AdminSecurityDefaults = {
  forceFullscreen?: boolean;
  disableTabSwitch?: boolean;
  autoEndOnTabChange?: boolean;
  disableCopyPaste?: boolean;
  disableRightClick?: boolean;
  detectDevTools?: boolean;
  warningLimit: number;
  autoSaveInterval: number;
};

function normalizeSecurityDefaults(
  input:
    | {
        forceFullscreen?: boolean;
        disableTabSwitch?: boolean;
        autoEndOnTabChange?: boolean;
        disableCopyPaste?: boolean;
        disableRightClick?: boolean;
        detectDevTools?: boolean;
        warningLimit?: number;
        autoSaveInterval?: number;
        autoSaveIntervalSeconds?: number;
      }
    | undefined
): AdminSecurityDefaults {
  return {
    forceFullscreen: input?.forceFullscreen,
    disableTabSwitch: input?.disableTabSwitch,
    autoEndOnTabChange: input?.autoEndOnTabChange,
    disableCopyPaste: input?.disableCopyPaste,
    disableRightClick: input?.disableRightClick,
    detectDevTools: input?.detectDevTools,
    warningLimit: Number.isFinite(input?.warningLimit) ? Number(input?.warningLimit) : 2,
    autoSaveInterval: Number.isFinite(input?.autoSaveInterval)
      ? Number(input?.autoSaveInterval)
      : Number.isFinite(input?.autoSaveIntervalSeconds)
        ? Number(input?.autoSaveIntervalSeconds)
        : 60,
  };
}

export async function getAdminSecurityDefaults(token: string) {
  const response = await request<{
    securityDefaults?: {
      forceFullscreen?: boolean;
      disableTabSwitch?: boolean;
      autoEndOnTabChange?: boolean;
      disableCopyPaste?: boolean;
      disableRightClick?: boolean;
      detectDevTools?: boolean;
      warningLimit?: number;
      autoSaveInterval?: number;
      autoSaveIntervalSeconds?: number;
    };
  }>("/api/admin/settings/security-defaults", {
    token,
  });
  return { securityDefaults: normalizeSecurityDefaults(response.securityDefaults) };
}

export async function saveAdminSecurityDefaults(
  token: string,
  payload: AdminSecurityDefaults
) {
  const response = await request<{
    message: string;
    securityDefaults?: {
      forceFullscreen?: boolean;
      disableCopyPaste?: boolean;
      warningLimit?: number;
      autoSaveInterval?: number;
      autoSaveIntervalSeconds?: number;
    };
  }>(
    "/api/admin/settings/security-defaults",
    {
      method: "PATCH",
      token,
      body: {
        ...payload,
        autoSaveIntervalSeconds: payload.autoSaveInterval,
      },
    }
  );
  return {
    message: response.message,
    securityDefaults: normalizeSecurityDefaults(response.securityDefaults),
  };
}

export type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  eventType: "new_candidate" | "test_completed" | "high_violation";
  isRead: boolean;
  createdAt: string;
};

export async function listAdminNotifications(
  token: string,
  params: { page?: number; pageSize?: number } = {}
) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 50),
  });

  return request<{
    notifications: AdminNotificationItem[];
    unreadCount: number;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/admin/notifications?${query.toString()}`, { token });
}

export async function markAdminNotificationAsRead(token: string, notificationId: string) {
  return request<{
    message: string;
    notification: AdminNotificationItem;
  }>(`/api/admin/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
}

export async function markAllAdminNotificationsAsRead(token: string) {
  return request<{ message: string }>("/api/admin/notifications/read-all", {
    method: "PATCH",
    token,
  });
}
