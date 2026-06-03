import type {
  CreateTestCodingTask,
  CreateTestMcqQuestion,
} from "../types/createTest.types";

export function buildDefaultQuestion(id: number): CreateTestMcqQuestion {
  return {
    id,
    prompt: "Write your question here...",
    options: ["Option A", "Option B", "Option C", "Option D"],
    selectedIndex: 0,
    marks: "1",
  };
}

export function buildDefaultCodingTask(id: number): CreateTestCodingTask {
  return {
    id,
    title: `Task ${id}`,
    taskName: "New Task",
    language: "JavaScript",
    description: "Write the coding task statement here.",
    marks: "25",
    testCases: [
      {
        id: 1,
        input: "[input] , expected",
        expectedOutput: "[output]",
        isHidden: false,
        weight: "1",
      },
    ],
  };
}
