export type McqAnswer = {
  questionIndex: number;
  selectedOptionIndex: number;
};

export function calculateMcqTotal(
  questions: Array<{ marks?: number }>
): number {
  return questions.reduce((sum, question) => sum + (question.marks || 1), 0);
}

export function calculateMcqScore(
  questions: Array<{ index?: number; correctOptionIndex?: number; marks?: number }>,
  answers: McqAnswer[]
): number {
  const byIndex = new Map<number, number>();
  answers.forEach((answer) => {
    if (!Number.isFinite(Number(answer.questionIndex))) return;
    byIndex.set(Number(answer.questionIndex), Number(answer.selectedOptionIndex));
  });
  return questions.reduce((sum, question, fallbackIndex) => {
    const questionIndex =
      Number.isFinite(Number(question.index)) && Number(question.index) >= 0
        ? Number(question.index)
        : fallbackIndex;
    const selectedOptionIndex = byIndex.get(questionIndex);
    if (selectedOptionIndex === undefined) return sum;
    const correctOptionIndex = Number(question.correctOptionIndex);
    if (!Number.isFinite(correctOptionIndex)) return sum;
    if (selectedOptionIndex !== correctOptionIndex) return sum;
    return sum + (question.marks || 1);
  }, 0);
}
