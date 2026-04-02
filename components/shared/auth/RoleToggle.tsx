type RoleToggleProps = {
  role: "admin" | "candidate";
  onChange: (role: "admin" | "candidate") => void;
};

export function RoleToggle({ role, onChange }: RoleToggleProps) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 p-1">
      <button
        className={`rounded-lg py-2 text-lg font-medium transition ${
          role === "candidate" ? "bg-[#1f3a8a] text-white" : "text-slate-700"
        }`}
        onClick={() => onChange("candidate")}
        type="button"
      >
        Candidate
      </button>
      <button
        className={`rounded-lg py-2 text-lg font-medium transition ${
          role === "admin" ? "bg-[#1f3a8a] text-white" : "text-slate-700"
        }`}
        onClick={() => onChange("admin")}
        type="button"
      >
        Admin
      </button>
    </div>
  );
}
