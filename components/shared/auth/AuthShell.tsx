import { ReactNode } from "react";

type AuthShellProps = {
  rightPane: ReactNode;
};

export function AuthShell({ rightPane }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex flex-col justify-center bg-gradient-to-br from-[#0c1538] to-[#223b9e] px-8 py-14 text-white sm:px-14">
          <div className="max-w-xl">
            <p className="text-lg font-semibold tracking-wide text-blue-100">
              Techforge Innovation
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] sm:text-6xl">
              Secure Interview
              <br />
              Assessment System
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Enterprise-grade platform for conducting secure technical
              interviews with advanced proctoring capabilities.
            </p>
            <ul className="mt-8 list-disc space-y-3 pl-5 text-xl">
              <li>Secure proctored assessments</li>
              <li>Real-time violation detection</li>
              <li>Comprehensive analytics</li>
              <li>Multi-format test support</li>
            </ul>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-10">
          {rightPane}
        </section>
      </div>
    </main>
  );
}
