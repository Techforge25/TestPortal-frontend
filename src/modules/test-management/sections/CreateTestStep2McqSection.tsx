import { AppButton } from "@/components/shared/ui/AppButton";
import { CreateTestCard } from "../components/CreateTestCard";
import type { Dispatch, SetStateAction } from "react";
import type { CreateTestMcqQuestion } from "../types/createTest.types";

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

type QuestionBlockProps = {
  title: string;
  prompt: string;
  options: string[];
  selectedIndex: number;
  onPromptChange: (value: string) => void;
  onDelete: () => void;
  onSelectOption: (index: number) => void;
  onOptionChange: (index: number, value: string) => void;
  isDark: boolean;
};

function QuestionBlock({ title, prompt, options, selectedIndex, onPromptChange, onDelete, onSelectOption, onOptionChange, isDark }: QuestionBlockProps) {
  return (
    <article className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>{title}</span>
        <button type="button" onClick={onDelete} aria-label={`Delete ${title}`}><TrashIcon /></button>
      </div>
      <textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} className={`h-[75px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Write your question..." />
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {options.map((option, index) => (
          <button key={`${title}-option-${index}`} type="button" onClick={() => onSelectOption(index)} className={`flex h-[52px] items-center gap-3 rounded-[8px] border px-3 text-left ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef]"}`}>
            <span className={`relative size-5 rounded-full border ${index === selectedIndex ? "border-[#3855a8]" : "border-[#98a2b3]"}`}>{index === selectedIndex ? <span className="absolute inset-[3px] rounded-full bg-[#1f3a8a]" /> : null}</span>
            <input value={option} onChange={(event) => onOptionChange(index, event.target.value)} onClick={(event) => event.stopPropagation()} className={`w-full bg-transparent text-[16px] outline-none ${isDark ? "text-slate-100" : "text-[#0f172a]"}`} />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-[30px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Marks:</span>
        <span className={`inline-flex h-7 min-w-[76px] items-center justify-center rounded-[8px] border px-2 text-sm font-medium ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-[#f8fafc] text-[#0f172a]"}`}>
          1 each
        </span>
      </div>
    </article>
  );
}

type CreateTestStep2McqSectionProps = {
  step: number;
  isDark: boolean;
  mcqQuestions: CreateTestMcqQuestion[];
  setMcqQuestions: Dispatch<SetStateAction<CreateTestMcqQuestion[]>>;
};

export function CreateTestStep2McqSection(props: CreateTestStep2McqSectionProps) {
  const { step, isDark, mcqQuestions, setMcqQuestions } = props;
  if (step !== 2) return null;

  return (
    <CreateTestCard title="Add MCQ Questions" subtitle={`${mcqQuestions.length} Questions Added • 1 mark per MCQ`} isDark={isDark}>
      <div className="flex justify-end">
        <AppButton
          variant="primary"
          size="md"
          leftIcon={<DiamondIcon />}
          onClick={() => setMcqQuestions((prev) => [...prev, { id: prev.length + 1, prompt: "Write your question here...", options: ["Option A", "Option B", "Option C", "Option D"], selectedIndex: 0, marks: "1" }])}
        >
          Add Question
        </AppButton>
      </div>
      {mcqQuestions.map((question) => (
        <QuestionBlock
          key={question.id}
          title={`Q ${question.id}`}
          prompt={question.prompt}
          options={question.options}
          selectedIndex={question.selectedIndex}
          onPromptChange={(value: string) => setMcqQuestions((prev) => prev.map((item) => (item.id === question.id ? { ...item, prompt: value } : item)))}
          onDelete={() => setMcqQuestions((prev) => prev.filter((item) => item.id !== question.id).map((item, idx) => ({ ...item, id: idx + 1 })))}
          onSelectOption={(selectedIndex: number) => setMcqQuestions((prev) => prev.map((item) => (item.id === question.id ? { ...item, selectedIndex } : item)))}
          onOptionChange={(optionIndex: number, value: string) => setMcqQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, options: item.options.map((option, idx) => (idx === optionIndex ? value : option)) } : item))}
          isDark={isDark}
        />
      ))}
    </CreateTestCard>
  );
}
