"use client";

import { useState } from "react";
import { AuthTextField } from "@/components/shared/auth/AuthTextField";
import { AppButton } from "@/components/shared/ui/AppButton";

type AdminSignInScreenProps = {
  onSubmit: (payload: { email: string; password: string }) => Promise<void> | void;
};

export function AdminSignInScreen({ onSubmit }: AdminSignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({ email: email.trim(), password });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Login failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.08)] sm:p-8">
      <h2 className="text-4xl font-bold text-slate-900">Sign in to Admin Portal</h2>
      <p className="mt-2 text-slate-500">
        Enter your credentials to access your admin dashboard.
      </p>

      <div className="mt-6 space-y-5">
        <AuthTextField label="Email Address" type="email" placeholder="name@company.com" value={email} onChange={setEmail} />
        <AuthTextField
          label="Password"
          type="password"
          placeholder="************"
          value={password}
          onChange={setPassword}
          showPasswordToggle
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-slate-700">
          <input type="checkbox" className="size-4 accent-[#1f3a8a]" />
          Remember me
        </label>
        <button className="text-[#1f3a8a]" type="button">
          Forgot Password?
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <AppButton
        className="mt-6 h-12 w-full rounded-lg"
        onClick={handleSubmit}
        type="button"
        disabled={isSubmitting}
      >
        Sign In
      </AppButton>

      <p className="mt-7 text-center text-lg text-slate-600">Secure Enterprise Access</p>
    </div>
  );
}
