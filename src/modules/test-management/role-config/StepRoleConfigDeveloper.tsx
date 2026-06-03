// @ts-nocheck
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import { CreateTestCard } from "../components/CreateTestCard";

const languageOptions = ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "PHP", "Ruby", "Dart"] as const;

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M12 4L20 12L12 20L4 12L12 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-6 fill-[#9CA3AF]">
      <path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-328 469.33h66.66v-386h-66.66v386Zm164 0h66.66v-386h-66.66v386ZM267.33-740v553.33V-740Z" />
    </svg>
  );
}

function CodingTaskBlock({ title, taskName, description, marks, testCases, language, onTaskNameChange, onDescriptionChange, onMarksChange, onTestCaseInputChange, onTestCaseOutputChange, onTestCaseWeightChange, onToggleTestCaseHidden, onAddTestCase, onDeleteTestCase, onLanguageChange, onDelete, isDark }: any) {
  return (
    <article className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
      <div className="mb-3 flex items-center justify-between"><span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>{title}</span><button type="button" onClick={onDelete}><TrashIcon /></button></div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={taskName} onChange={(event) => onTaskNameChange(event.target.value)} className={`h-[52px] w-full rounded-[8px] border px-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`} />
        <AppDropdown value={language} onChange={onLanguageChange} options={languageOptions.map((option) => ({ value: option, label: option }))} ariaLabel={`${title} language`} className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef]"}`} triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`} chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"} menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`} optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`} selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]" />
      </div>
      <div className="mt-3"><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} className={`h-[86px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`} /></div>
      <div className="mt-3 flex items-center gap-2"><span className={`text-[30px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Marks:</span><input type="number" min="0" value={marks} onChange={(event) => onMarksChange(event.target.value.replace(/[^0-9]/g, ""))} className={`h-9 w-[96px] rounded-[8px] border px-2 outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`} /></div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between"><p className={`text-[34px] font-medium tracking-[-0.51px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Test Cases</p><AppButton size="sm" variant="secondary" onClick={onAddTestCase} className="h-9 px-3">Add Case</AppButton></div>
        <div className="space-y-3">
          {testCases.map((testCase: any, idx: number) => (
            <div key={`${title}-case-${testCase.id}`} className={`rounded-[8px] border p-3 ${isDark ? "border-slate-700 bg-slate-800/40" : "border-[#dbe3ef] bg-[#f8fafc]"}`}>
              <div className="mb-2 flex items-center justify-between"><span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-[#475569]"}`}>{`Case ${idx + 1}`}</span><div className="flex items-center gap-2"><button type="button" onClick={() => onToggleTestCaseHidden(testCase.id)} className={`rounded-full px-3 py-1 text-xs font-medium ${testCase.isHidden ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#dcfce7] text-[#166534]"}`}>{testCase.isHidden ? "Hidden" : "Visible"}</button><button type="button" onClick={() => onDeleteTestCase(testCase.id)}><TrashIcon /></button></div></div>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_96px]"><input value={testCase.input} onChange={(event) => onTestCaseInputChange(testCase.id, event.target.value)} className={`h-10 rounded-[8px] border px-3 text-sm outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Input" /><input value={testCase.expectedOutput} onChange={(event) => onTestCaseOutputChange(testCase.id, event.target.value)} className={`h-10 rounded-[8px] border px-3 text-sm outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Expected Output" /><input value={testCase.weight} onChange={(event) => onTestCaseWeightChange(testCase.id, event.target.value.replace(/[^0-9]/g, ""))} className={`h-10 rounded-[8px] border px-3 text-sm outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Weight" /></div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function StepRoleConfigDeveloper(props: any) {
  const { step, isDark, codingTasks, setCodingTasks } = props;
  if (step !== 3) return null;

  return (
    <CreateTestCard title="Add Coding Tasks" subtitle={`${codingTasks.length} Tasks Added`} isDark={isDark}>
      <div className="flex justify-end">
        <AppButton
          variant="primary"
          size="md"
          leftIcon={<DiamondIcon />}
          onClick={() => setCodingTasks((prev: any[]) => [...prev, { id: prev.length + 1, title: `Task ${prev.length + 1}`, taskName: "New Task", language: "JavaScript", description: "Write the coding task statement here.", marks: "25", testCases: [{ id: 1, input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: "1" }] }])}
        >Add Question</AppButton>
      </div>
      {codingTasks.map((task: any) => (
        <CodingTaskBlock
          key={task.id}
          title={task.title}
          taskName={task.taskName}
          language={task.language}
          description={task.description}
          marks={task.marks}
          testCases={task.testCases}
          onTaskNameChange={(value: string) => setCodingTasks((prev: any[]) => prev.map((item) => (item.id === task.id ? { ...item, taskName: value } : item)))}
          onLanguageChange={(value: string) => setCodingTasks((prev: any[]) => prev.map((item) => (item.id === task.id ? { ...item, language: value } : item)))}
          onDescriptionChange={(value: string) => setCodingTasks((prev: any[]) => prev.map((item) => (item.id === task.id ? { ...item, description: value } : item)))}
          onMarksChange={(value: string) => setCodingTasks((prev: any[]) => prev.map((item) => (item.id === task.id ? { ...item, marks: value } : item)))}
          onTestCaseInputChange={(caseId: number, value: string) => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: item.testCases.map((tc: any) => tc.id === caseId ? { ...tc, input: value } : tc) } : item))}
          onTestCaseOutputChange={(caseId: number, value: string) => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: item.testCases.map((tc: any) => tc.id === caseId ? { ...tc, expectedOutput: value } : tc) } : item))}
          onTestCaseWeightChange={(caseId: number, value: string) => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: item.testCases.map((tc: any) => tc.id === caseId ? { ...tc, weight: value || "1" } : tc) } : item))}
          onToggleTestCaseHidden={(caseId: number) => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: item.testCases.map((tc: any) => tc.id === caseId ? { ...tc, isHidden: !tc.isHidden } : tc) } : item))}
          onAddTestCase={() => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: [...item.testCases, { id: item.testCases.length > 0 ? Math.max(...item.testCases.map((tc: any) => tc.id)) + 1 : 1, input: "[input]", expectedOutput: "[output]", isHidden: true, weight: "1" }] } : item))}
          onDeleteTestCase={(caseId: number) => setCodingTasks((prev: any[]) => prev.map((item) => item.id === task.id ? { ...item, testCases: item.testCases.filter((tc: any) => tc.id !== caseId).length > 0 ? item.testCases.filter((tc: any) => tc.id !== caseId) : [{ id: 1, input: "[input]", expectedOutput: "[output]", isHidden: false, weight: "1" }] } : item))}
          onDelete={() => setCodingTasks((prev: any[]) => prev.filter((item) => item.id !== task.id).map((item, idx) => ({ ...item, id: idx + 1, title: `Task ${idx + 1}` })))}
          isDark={isDark}
        />
      ))}
    </CreateTestCard>
  );
}
