import { useState } from "react";
import { AuthTextField } from "@/components/shared/auth/AuthTextField";
import { AppButton } from "@/components/shared/ui/AppButton";

type CandidateSignInScreenProps = {
  onSubmit: (payload: { email: string; testPasscode: string }) => Promise<void> | void;
};

export function CandidateSignInScreen({ onSubmit }: CandidateSignInScreenProps) {
  const [email, setEmail] = useState("");
  const [testCodeSuffix, setTestCodeSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const cleanedSuffix = testCodeSuffix.trim().toUpperCase().replace(/^TF[-\s]*/i, "");
    if (!trimmedEmail || !cleanedSuffix) {
      setError("Email and test code are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        email: trimmedEmail,
        testPasscode: `TF-${cleanedSuffix}`,
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Invalid test code";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.08)] sm:p-8">
      <h2 className="text-4xl font-bold text-slate-900">
        Sign in to Candidate Portal
      </h2>
      <p className="mt-2 text-slate-500">
        Enter your email and test code to begin your assessment
      </p>

      <div className="mt-6 space-y-5">
        <AuthTextField
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={setEmail}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Test Code</p>
          <div className="flex h-12 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-[#1f3a8a] focus-within:ring-2 focus-within:ring-[#1f3a8a]/20">
            <div className="flex w-[68px] items-center justify-center border-r border-slate-300 bg-slate-50 font-semibold text-slate-700">
              TF-
            </div>
            <input
              type="text"
              value={testCodeSuffix}
              onChange={(event) => setTestCodeSuffix(event.target.value)}
              placeholder="ABC123"
              className="w-full bg-transparent px-3 text-slate-900 outline-none placeholder:text-slate-400"
              required
            />
          </div>
        </div>
      </div>

      <AppButton
        className="mt-6 h-12 w-full rounded-lg text-2xl font-medium"
        onClick={handleSubmit}
        type="button"
        disabled={isSubmitting}
      >
        Start Test
      </AppButton>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <p className="mt-7 text-center text-lg text-slate-600">Secure Candidate Access</p>
    </div>
  );
}
