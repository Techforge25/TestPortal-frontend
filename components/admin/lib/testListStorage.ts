export type AdminTestListItem = {
  id: number | string;
  testName: string;
  position: string;
  duration: number;
  passPercentage: number;
  roleCategory?: "developer" | "frontend" | "designer" | "video_editor" | "qa_manual" | "hr" | "sales" | "other";
  enabledSections?: string[];
  sectionConfigs?: Array<{
    key: "short_answer" | "long_answer" | "scenario" | "ui_preview" | "portfolio_link" | "bug_report" | "test_case";
    title: string;
    prompt: string;
    instructions?: string;
    required?: boolean;
    marks?: number;
  }>;
  mcqs: number;
  coding: number;
  mcqQuestionItems: string[];
  codingTaskItems: string[];
  mcqQuestionsDetailed?: Array<{
    prompt: string;
    options: string[];
    selectedIndex: number;
    marks: number;
  }>;
  codingTasksDetailed?: Array<{
    taskName: string;
    language: string;
    description: string;
    marks: number;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      isHidden: boolean;
      weight: number;
    }>;
  }>;
  passcode: string;
  passcodeExpiresAt?: string;
  securityFlags?: {
    forceFullscreen: boolean;
    disableTabSwitch: boolean;
    autoEndOnTabChange: boolean;
    disableCopyPaste: boolean;
    disableRightClick: boolean;
    devToolsDetection: boolean;
  };
  warningLimit?: number;
  autoSaveIntervalSeconds?: number;
  status: "Active" | "Draft";
  created: string;
};

const STORAGE_KEY = "admin_published_tests";
const EDIT_DRAFT_KEY = "admin_editing_test_draft";

function normalizeDetailedMcqs(input: unknown) {
  if (!Array.isArray(input)) return undefined;
  return input.map((item) => ({
    prompt: String((item as { prompt?: unknown })?.prompt || ""),
    options: Array.isArray((item as { options?: unknown })?.options)
      ? ((item as { options?: unknown[] }).options || []).map((opt) => String(opt || ""))
      : [],
    selectedIndex: Number.isFinite(Number((item as { selectedIndex?: unknown })?.selectedIndex))
      ? Number((item as { selectedIndex?: unknown })?.selectedIndex)
      : 0,
    marks: Number.isFinite(Number((item as { marks?: unknown })?.marks))
      ? Number((item as { marks?: unknown })?.marks)
      : 1,
  }));
}

function normalizeDetailedCodingTasks(input: unknown) {
  if (!Array.isArray(input)) return undefined;
  return input.map((item) => ({
    taskName: String((item as { taskName?: unknown })?.taskName || ""),
    language: String((item as { language?: unknown })?.language || "JavaScript"),
    description: String((item as { description?: unknown })?.description || ""),
    marks: Number.isFinite(Number((item as { marks?: unknown })?.marks))
      ? Number((item as { marks?: unknown })?.marks)
      : 1,
    testCases: Array.isArray((item as { testCases?: unknown })?.testCases)
      ? ((item as { testCases?: unknown[] }).testCases || []).map((tc) => ({
          input: String((tc as { input?: unknown })?.input || ""),
          expectedOutput: String((tc as { expectedOutput?: unknown })?.expectedOutput || ""),
          isHidden: Boolean((tc as { isHidden?: unknown })?.isHidden),
          weight: Number.isFinite(Number((tc as { weight?: unknown })?.weight))
            ? Number((tc as { weight?: unknown })?.weight)
            : 1,
        }))
      : [],
  }));
}

function buildPasscode(seed?: number | string): string {
  const numericSeed =
    typeof seed === "number"
      ? seed
      : typeof seed === "string"
        ? seed
            .split("")
            .reduce((sum, char) => sum + char.charCodeAt(0), 0)
        : Date.now();
  const base = Math.abs(numericSeed) % 1000000;
  return `TF-${String(base).padStart(6, "0")}`;
}

function parseStoredItems(raw: string | null): AdminTestListItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const id = typeof item.id === "number" || typeof item.id === "string" ? item.id : Date.now();
        const mcqs = typeof item.mcqs === "number" ? item.mcqs : 1;
        const coding = typeof item.coding === "number" ? item.coding : 1;
        const mcqQuestionItems =
          Array.isArray(item.mcqQuestionItems) && item.mcqQuestionItems.length > 0
            ? item.mcqQuestionItems
            : Array.from({ length: mcqs }, (_, idx) => `Question ${idx + 1}`);
        const codingTaskItems =
          Array.isArray(item.codingTaskItems) && item.codingTaskItems.length > 0
            ? item.codingTaskItems
            : Array.from({ length: coding }, (_, idx) => `Task ${idx + 1}`);
        return {
          ...item,
          id,
          passPercentage:
            typeof item.passPercentage === "number" && Number.isFinite(item.passPercentage)
              ? item.passPercentage
              : 70,
          roleCategory:
            typeof item.roleCategory === "string" && item.roleCategory.trim().length > 0
              ? item.roleCategory
              : "developer",
          enabledSections: Array.isArray(item.enabledSections)
            ? item.enabledSections.map((v: unknown) => String(v))
            : ["mcq", "coding"],
          securityFlags:
            item.securityFlags && typeof item.securityFlags === "object"
              ? {
                  forceFullscreen: Boolean(item.securityFlags.forceFullscreen),
                  disableTabSwitch: Boolean(item.securityFlags.disableTabSwitch),
                  autoEndOnTabChange: Boolean(item.securityFlags.autoEndOnTabChange),
                  disableCopyPaste: Boolean(item.securityFlags.disableCopyPaste),
                  disableRightClick: Boolean(item.securityFlags.disableRightClick),
                  devToolsDetection: Boolean(item.securityFlags.devToolsDetection),
                }
              : undefined,
          warningLimit:
            typeof item.warningLimit === "number" && Number.isFinite(item.warningLimit)
              ? item.warningLimit
              : undefined,
          autoSaveIntervalSeconds:
            typeof item.autoSaveIntervalSeconds === "number" &&
            Number.isFinite(item.autoSaveIntervalSeconds)
              ? item.autoSaveIntervalSeconds
              : undefined,
          mcqs,
          coding,
          mcqQuestionItems,
          codingTaskItems,
          mcqQuestionsDetailed: normalizeDetailedMcqs(item.mcqQuestionsDetailed),
          codingTasksDetailed: normalizeDetailedCodingTasks(item.codingTasksDetailed),
          passcode:
            typeof item.passcode === "string" && item.passcode.trim().length > 0
              ? item.passcode
              : buildPasscode(id),
          passcodeExpiresAt:
            typeof item.passcodeExpiresAt === "string" && item.passcodeExpiresAt.trim().length > 0
              ? item.passcodeExpiresAt
              : undefined,
        } as AdminTestListItem;
      });
  } catch {
    return [];
  }
}

export function readPublishedTests(): AdminTestListItem[] {
  if (typeof window === "undefined") return [];
  return parseStoredItems(window.localStorage.getItem(STORAGE_KEY));
}

export function savePublishedTest(
  item: Omit<AdminTestListItem, "id" | "passcode">,
  options?: { id?: number | string; passcode?: string }
): AdminTestListItem | null {
  if (typeof window === "undefined") return null;

  const current = readPublishedTests();
  const editingId = options?.id;
  const existingMatch =
    editingId !== undefined && editingId !== null
      ? current.find((test) => String(test.id) === String(editingId))
      : undefined;
  let id: number | string = existingMatch?.id ?? Date.now();
  let passcode = options?.passcode?.trim() || existingMatch?.passcode || buildPasscode(id);
  const currentCodes = new Set(current.filter((test) => test.id !== id).map((test) => test.passcode));

  while (currentCodes.has(passcode)) {
    id = typeof id === "number" ? id + 1 : `${id}-x`;
    passcode = buildPasscode(String(id));
  }

  const withId: AdminTestListItem = {
    ...item,
    id,
    passcode,
  };
  const next = [withId, ...current.filter((test) => test.id !== id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return withId;
}

export function setEditingTestDraft(test: AdminTestListItem) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(test));
}

export function readEditingTestDraft(): AdminTestListItem | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EDIT_DRAFT_KEY);
  if (!raw) return null;

  try {
    const item = JSON.parse(raw);
    if (!item || typeof item !== "object") return null;
    const id = typeof item.id === "number" || typeof item.id === "string" ? item.id : Date.now();
    const mcqs = typeof item.mcqs === "number" ? item.mcqs : 1;
    const coding = typeof item.coding === "number" ? item.coding : 1;
    return {
      ...item,
      id,
      passPercentage:
        typeof item.passPercentage === "number" && Number.isFinite(item.passPercentage)
          ? item.passPercentage
          : 70,
      roleCategory:
        typeof item.roleCategory === "string" && item.roleCategory.trim().length > 0
          ? item.roleCategory
          : "developer",
      enabledSections: Array.isArray(item.enabledSections)
        ? item.enabledSections.map((v: unknown) => String(v))
        : ["mcq", "coding"],
      securityFlags:
        item.securityFlags && typeof item.securityFlags === "object"
          ? {
              forceFullscreen: Boolean(item.securityFlags.forceFullscreen),
              disableTabSwitch: Boolean(item.securityFlags.disableTabSwitch),
              autoEndOnTabChange: Boolean(item.securityFlags.autoEndOnTabChange),
              disableCopyPaste: Boolean(item.securityFlags.disableCopyPaste),
              disableRightClick: Boolean(item.securityFlags.disableRightClick),
              devToolsDetection: Boolean(item.securityFlags.devToolsDetection),
            }
          : undefined,
      warningLimit:
        typeof item.warningLimit === "number" && Number.isFinite(item.warningLimit)
          ? item.warningLimit
          : undefined,
      autoSaveIntervalSeconds:
        typeof item.autoSaveIntervalSeconds === "number" &&
        Number.isFinite(item.autoSaveIntervalSeconds)
          ? item.autoSaveIntervalSeconds
          : undefined,
      mcqs,
      coding,
      mcqQuestionItems:
        Array.isArray(item.mcqQuestionItems) && item.mcqQuestionItems.length > 0
          ? item.mcqQuestionItems
          : Array.from({ length: mcqs }, (_, idx) => `Question ${idx + 1}`),
      codingTaskItems:
        Array.isArray(item.codingTaskItems) && item.codingTaskItems.length > 0
          ? item.codingTaskItems
          : Array.from({ length: coding }, (_, idx) => `Task ${idx + 1}`),
      mcqQuestionsDetailed: normalizeDetailedMcqs(item.mcqQuestionsDetailed),
      codingTasksDetailed: normalizeDetailedCodingTasks(item.codingTasksDetailed),
      passcode:
        typeof item.passcode === "string" && item.passcode.trim().length > 0
          ? item.passcode
          : buildPasscode(id),
      passcodeExpiresAt:
        typeof item.passcodeExpiresAt === "string" && item.passcodeExpiresAt.trim().length > 0
          ? item.passcodeExpiresAt
          : undefined,
      status: item.status === "Draft" ? "Draft" : "Active",
      created: typeof item.created === "string" ? item.created : new Date().toISOString().slice(0, 10),
    } as AdminTestListItem;
  } catch {
    return null;
  }
}

export function clearEditingTestDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EDIT_DRAFT_KEY);
}
