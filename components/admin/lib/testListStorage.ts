export type AdminTestListItem = {
  id: number | string;
  testName: string;
  position: string;
  duration: number;
  mcqs: number;
  coding: number;
  mcqQuestionItems: string[];
  codingTaskItems: string[];
  passcode: string;
  passcodeExpiresAt?: string;
  status: "Active" | "Draft";
  created: string;
};

const STORAGE_KEY = "admin_published_tests";
const EDIT_DRAFT_KEY = "admin_editing_test_draft";

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
          mcqs,
          coding,
          mcqQuestionItems,
          codingTaskItems,
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
