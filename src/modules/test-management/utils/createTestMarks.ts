export const MAX_TOTAL_TEST_MARKS = 100;
export const MAX_MCQ_QUESTIONS = 50;

export function normalizeMcqCount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(parsed, MAX_MCQ_QUESTIONS);
}

export function getMcqTotalMarks(mcqCount: number): number {
  if (!Number.isFinite(mcqCount) || mcqCount <= 0) return 0;
  return Math.min(Math.trunc(mcqCount), MAX_MCQ_QUESTIONS);
}

export function getCodingMarksPool(mcqCount: number): number {
  return Math.max(0, MAX_TOTAL_TEST_MARKS - getMcqTotalMarks(mcqCount));
}

export function distributeIntegerMarks(totalMarks: number, itemCount: number): number[] {
  if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Number.isFinite(itemCount) || itemCount <= 0) {
    return [];
  }

  const safeTotal = Math.max(0, Math.trunc(totalMarks));
  const safeCount = Math.max(0, Math.trunc(itemCount));
  const base = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal % safeCount;

  return Array.from({ length: safeCount }, (_, index) => base + (index < remainder ? 1 : 0));
}
