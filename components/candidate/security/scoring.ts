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
  questions: Array<{ index: number; marks?: number }>,
  answers: McqAnswer[]
): number {
  const byIndex = new Map<number, number>();
  answers.forEach((answer) => byIndex.set(answer.questionIndex, answer.selectedOptionIndex));
  return questions.reduce((sum, question) => {
    const hasAnswered = byIndex.has(question.index);
    if (!hasAnswered) return sum;
    return sum + (question.marks || 1);
  }, 0);
}

