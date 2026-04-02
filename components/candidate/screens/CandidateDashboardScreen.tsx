const testSummary = [
  { label: "Assigned Tests", value: "3" },
  { label: "Completed", value: "1" },
  { label: "Pending", value: "2" },
];

const upcomingTests = [
  { test: "Frontend Assessment", duration: "60 min", due: "Mar 08, 2026" },
  { test: "Problem Solving Round", duration: "45 min", due: "Mar 10, 2026" },
];

export function CandidateDashboardScreen() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-900">
            Candidate Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome, Candidate</h1>
          <p className="mt-2 text-slate-500">
            Continue your assessments and track your progress from one place.
          </p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {testSummary.map((item) => (
            <article
              key={item.label}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{item.value}</p>
            </article>
          ))}
        </div>

        <article className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Upcoming Tests</h2>
            <button className="text-sm font-medium text-blue-900">View All</button>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingTests.map((item) => (
              <div
                key={item.test}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.test}</p>
                  <p className="text-sm text-slate-500">
                    Duration: {item.duration} | Due: {item.due}
                  </p>
                </div>
                <button className="rounded-lg bg-[#1f3a8a] px-4 py-2 text-white">
                  Start
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
