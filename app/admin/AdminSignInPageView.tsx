"use client";

import { useState } from "react";
import { AuthTextField } from "@/components/shared/auth/AuthTextField";
import { AppButton } from "@/components/shared/ui/AppButton";

const ADMIN_REMEMBER_ME_KEY = "admin_remember_me_v1";

function readRememberedAdminCredentials() {
  if (typeof window === "undefined") {
    return { email: "", password: "", rememberMe: false };
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_REMEMBER_ME_KEY);
    if (!raw) {
      return { email: "", password: "", rememberMe: false };
    }
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    return {
      email: String(parsed?.email || ""),
      password: String(parsed?.password || ""),
      rememberMe: Boolean(parsed?.email || parsed?.password),
    };
  } catch {
    return { email: "", password: "", rememberMe: false };
  }
}

function persistRememberedAdminCredentials(payload: { email: string; password: string; rememberMe: boolean }) {
  if (typeof window === "undefined") return;
  if (!payload.rememberMe) {
    window.localStorage.removeItem(ADMIN_REMEMBER_ME_KEY);
    return;
  }
  window.localStorage.setItem(
    ADMIN_REMEMBER_ME_KEY,
    JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    })
  );
}

type AdminSignInScreenProps = {
  onSubmit: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<void> | void;
};

export function AdminSignInScreen({ onSubmit }: AdminSignInScreenProps) {
  const [remembered] = useState(() => readRememberedAdminCredentials());
  const [email, setEmail] = useState(remembered.email);
  const [password, setPassword] = useState(remembered.password);
  const [rememberMe, setRememberMe] = useState(remembered.rememberMe);
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
      const payload = { email: email.trim(), password, rememberMe };
      await onSubmit(payload);
      persistRememberedAdminCredentials(payload);
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
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 accent-[#1f3a8a]"
          />
          Remember me
        </label>
        {/* <button clsassName="text-[#1f3a8a]" type="button">
          Forgot Password?
        </button> */}
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
