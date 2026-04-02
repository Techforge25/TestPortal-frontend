"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateLoginWithPasscode } from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { clearCandidateAuthDraft, readCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
import { AuthTextField } from "@/components/shared/auth/AuthTextField";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown, type DropdownOption } from "@/components/shared/ui/AppDropdown";
import { saveCandidateSession } from "@/components/candidate/lib/candidateSessionStorage";

type FieldConfig = {
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel" | "date" | "number";
  full?: boolean;
};

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  cnic: string;
  maritalStatus: string;
  qualification: string;
  dateOfBirth: string;
  positionAppliedFor: string;
  residentialAddress: string;
  workExperience: string;
  startDate: string;
  endDate: string;
  currentSalary: string;
  expectedSalary: string;
  expectedJoiningDate: string;
  shiftComfortable: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phoneNumber: "+92",
  cnic: "",
  maritalStatus: "",
  qualification: "",
  dateOfBirth: "",
  positionAppliedFor: "",
  residentialAddress: "",
  workExperience: "",
  startDate: "",
  endDate: "",
  currentSalary: "",
  expectedSalary: "",
  expectedJoiningDate: "",
  shiftComfortable: "",
};

const topFields: FieldConfig[] = [
  { key: "fullName", label: "Full Name", placeholder: "Ahmed Ali", full: true },
  { key: "email", label: "Email Address", placeholder: "Ahmedali@gmail.com", type: "email" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "+923123456789", type: "tel" },
  { key: "cnic", label: "Cnic Num", placeholder: "12345-1234567-1" },
  { key: "maritalStatus", label: "Marital Status", placeholder: "Select Marital Status" },
  { key: "qualification", label: "Qualification", placeholder: "BSCS" },
  { key: "dateOfBirth", label: "Date of Birth", placeholder: "28/02/2003", type: "date" },
  { key: "positionAppliedFor", label: "Position Applied For", placeholder: "Front End Developer", full: true },
  {
    key: "residentialAddress",
    label: "Residential Address",
    placeholder: "401, Al-Falah Court I.I.Chundrigar Road, Karachi",
    full: true,
  },
  { key: "workExperience", label: "Work Experience", placeholder: "Frontend Developer", full: true },
  { key: "startDate", label: "Start Date", placeholder: "12/05/2024", type: "date" },
  { key: "endDate", label: "End Date", placeholder: "28/08/2025", type: "date" },
];

const bottomFields: FieldConfig[] = [
  { key: "currentSalary", label: "Current Salary", placeholder: "50,000", type: "number" },
  { key: "expectedSalary", label: "Expected Salary", placeholder: "60,000", type: "number" },
  { key: "expectedJoiningDate", label: "Expected Date of Joining", placeholder: "12/05/2024", type: "date" },
  { key: "shiftComfortable", label: "Comfortable with 9 AM-6 PM shift?", placeholder: "Select Option" },
];

const requiredFields: Array<{ key: keyof FormState; label: string }> = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email Address" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "cnic", label: "Cnic Num" },
  { key: "maritalStatus", label: "Marital Status" },
  { key: "qualification", label: "Qualification" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "positionAppliedFor", label: "Position Applied For" },
  { key: "residentialAddress", label: "Residential Address" },
  { key: "workExperience", label: "Work Experience" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "currentSalary", label: "Current Salary" },
  { key: "expectedSalary", label: "Expected Salary" },
  { key: "expectedJoiningDate", label: "Expected Date of Joining" },
  { key: "shiftComfortable", label: "Comfortable with 9 AM-6 PM shift?" },
];

function RocketIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-current" aria-hidden="true">
      <path d="m226-559 78 33q14-28 29-54t33-52l-56-11-84 84Zm142 83 114 113q42-16 90-49t90-75q70-70 109.5-155.5T806-800q-72-5-158 34.5T492-656q-42 42-75 90t-49 90Zm155-121.5q0-33.5 23-56.5t57-23q34 0 57 23t23 56.5q0 33.5-23 56.5t-57 23q-34 0-57-23t-23-56.5ZM565-220l84-84-11-56q-26 18-52 32.5T532-299l33 79Zm313-653q19 121-23.5 235.5T708-419l20 99q4 20-2 39t-20 33L538-80l-84-197-171-171-197-84 167-168q14-14 33.5-20t39.5-2l99 20q104-104 218-147t235-24ZM157-321q35-35 85.5-35.5T328-322q35 35 34.5 85.5T327-151q-25 25-83.5 43T82-76q14-103 32-161.5t43-83.5Zm57 56q-10 10-20 36.5T180-175q27-4 53.5-13.5T270-208q12-12 13-29t-11-29q-12-12-29-11.5T214-265Z" />
    </svg>
  );
}

const maritalStatusOptions: DropdownOption[] = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
];

const shiftOptions: DropdownOption[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

function sanitizeAlphabetOnly(value: string) {
  return value.replace(/[^a-zA-Z\s]/g, "").replace(/\s{2,}/g, " ");
}

function formatPhoneNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  digits = digits.slice(0, 10);
  return `+92${digits}`;
}

function formatCnic(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const first = digits.slice(0, 5);
  const second = digits.slice(5, 12);
  const third = digits.slice(12, 13);
  if (digits.length <= 5) return first;
  if (digits.length <= 12) return `${first}-${second}`;
  return `${first}-${second}-${third}`;
}

function BrandMark() {
  return (
    <svg viewBox="0 0 50 34" className="h-[34px] w-[50px]" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="30" height="30" rx="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 16L16 22L27 11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23C33 21.5 35 19 36 15" stroke="#15A8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CandidateRegistrationScreen() {
  const router = useRouter();
  const loginDraft = useMemo(() => readCandidateAuthDraft(), []);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialState,
    email: loginDraft?.email || "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const branding = usePublicBranding();

  function setValue(key: keyof FormState, value: string) {
    if (key === "fullName" || key === "positionAppliedFor" || key === "workExperience") {
      setForm((prev) => ({ ...prev, [key]: sanitizeAlphabetOnly(value) }));
      return;
    }
    if (key === "phoneNumber") {
      setForm((prev) => ({ ...prev, [key]: formatPhoneNumber(value) }));
      return;
    }
    if (key === "cnic") {
      setForm((prev) => ({ ...prev, [key]: formatCnic(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleStartTest() {
    const passcode = loginDraft?.testPasscode?.trim();
    if (!form.email.trim() || !passcode) {
      setError("Email and test code are required. Please sign in from the candidate login page.");
      return;
    }
    const missingField = requiredFields.find(({ key }) => !String(form[key] || "").trim());
    if (missingField) {
      setError(`${missingField.label} is required.`);
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(form.fullName.trim())) {
      setError("Full Name must contain only alphabets.");
      return;
    }
    if (!/^\+92\d{10}$/.test(form.phoneNumber.trim())) {
      setError("Phone Number must be +92 followed by 10 digits.");
      return;
    }
    if (form.cnic.replace(/\D/g, "").length !== 13) {
      setError("Cnic Num must contain exactly 13 digits.");
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(form.positionAppliedFor.trim())) {
      setError("Position Applied For must contain only alphabets.");
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(form.workExperience.trim())) {
      setError("Work Experience must contain only alphabets.");
      return;
    }
    if (!["Single", "Married"].includes(form.maritalStatus)) {
      setError("Please select Marital Status.");
      return;
    }
    if (!["Yes", "No"].includes(form.shiftComfortable)) {
      setError("Please select Comfortable with 9 AM-6 PM shift?");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await candidateLoginWithPasscode({
        candidateEmail: form.email.trim(),
        candidateName: form.fullName.trim() || undefined,
        testPasscode: passcode,
        candidateProfile: {
          phoneNumber: form.phoneNumber,
          cnic: form.cnic,
          maritalStatus: form.maritalStatus,
          qualification: form.qualification,
          dateOfBirth: form.dateOfBirth,
          positionAppliedFor: form.positionAppliedFor,
          residentialAddress: form.residentialAddress,
          workExperience: form.workExperience,
          startDate: form.startDate,
          endDate: form.endDate,
          currentSalary: form.currentSalary,
          expectedSalary: form.expectedSalary,
          expectedJoiningDate: form.expectedJoiningDate,
          shiftComfortable: form.shiftComfortable,
        },
      });

      saveCandidateSession({
        submissionId: response.submission.id,
        candidateSessionToken: response.candidateSessionToken,
        test: response.test,
        candidate: {
          name: response.submission.candidateName,
          email: response.submission.candidateEmail,
        },
      });
      clearCandidateAuthDraft();
      router.push("/candidate/pre-test");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Login failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="mx-auto w-full max-w-[1084px] px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <header className="flex h-[86px] items-center justify-center rounded-[12px] bg-[#1f3a8a] px-4">
          <div className="flex items-center gap-2">
            {branding.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoDataUrl} alt="Company logo" className="h-[34px] w-[50px] rounded object-contain" />
            ) : (
              <BrandMark />
            )}
            <div className="leading-none text-white">
              <p className="text-[28px] font-bold tracking-tight">{branding.companyName || "Hire Secure"}</p>
              <p className="mt-1 text-xs">Secure Talent. Smart Decisions.</p>
            </div>
          </div>
        </header>

        <article className="mt-5 rounded-[24px] border border-[#e2e8f0] bg-white px-4 py-8 sm:px-6">
          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-[-0.33px] text-[#0f172a]">Candidate Registration</h1>
            <p className="mt-2 text-base text-[#666c77]">Enter Your Details To Begin The Assessment</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {topFields.map((field) => (
              field.key === "maritalStatus" ? (
                <div key={field.key} className={field.full ? "md:col-span-2" : ""}>
                  <label className="mb-3 block text-[18px] text-[#0f172a]">{field.label}</label>
                  <AppDropdown
                    value={form.maritalStatus || ""}
                    onChange={(value) => setValue("maritalStatus", value)}
                    options={maritalStatusOptions}
                    className="h-[52px]"
                    triggerClassName="h-full rounded-[10px] border border-[#e3e7ee] bg-white px-6 text-left text-[16px] text-[#0f172a]"
                    menuClassName="rounded-[10px] border border-[#e3e7ee] bg-white shadow-lg"
                    optionClassName="px-4 py-2.5 text-sm text-[#334155] hover:bg-[#f8fafc]"
                    selectedOptionClassName="bg-[#eef2ff] text-[#1f3a8a]"
                    chevronClassName="text-[#64748b]"
                    ariaLabel={field.label}
                  />
                </div>
              ) : (
                <AuthTextField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => setValue(field.key, value)}
                  placeholder={field.placeholder}
                  type={field.type || "text"}
                  className={field.full ? "md:col-span-2" : ""}
                  labelClassName="mb-3 text-[18px] text-[#0f172a]"
                  inputClassName="h-[52px] rounded-[10px] border-[#e3e7ee] px-6 placeholder:text-[#9ca3af]"
                />
              )
            ))}
          </div>

          <hr className="my-6 border-t border-[#e2e8f0]" />

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {bottomFields.map((field) => (
              field.key === "shiftComfortable" ? (
                <div key={field.key}>
                  <label className="mb-3 block text-[18px] text-[#0f172a]">{field.label}</label>
                  <AppDropdown
                    value={form.shiftComfortable || ""}
                    onChange={(value) => setValue("shiftComfortable", value)}
                    options={shiftOptions}
                    className="h-[52px]"
                    triggerClassName="h-full rounded-[10px] border border-[#e3e7ee] bg-white px-6 text-left text-[16px] text-[#0f172a]"
                    menuClassName="rounded-[10px] border border-[#e3e7ee] bg-white shadow-lg"
                    optionClassName="px-4 py-2.5 text-sm text-[#334155] hover:bg-[#f8fafc]"
                    selectedOptionClassName="bg-[#eef2ff] text-[#1f3a8a]"
                    chevronClassName="text-[#64748b]"
                    ariaLabel={field.label}
                  />
                </div>
              ) : (
                <AuthTextField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => setValue(field.key, value)}
                  placeholder={field.placeholder}
                  type={field.type || "text"}
                  labelClassName="mb-3 text-[18px] text-[#0f172a]"
                  inputClassName="h-[52px] rounded-[10px] border-[#e3e7ee] px-6 placeholder:text-[#9ca3af]"
                />
              )
            ))}
          </div>

          <AppButton
            type="button"
            variant="primary"
            size="lg"
            className="mt-6 w-full rounded-[10px]"
            leftIcon={<RocketIcon />}
            onClick={handleStartTest}
            disabled={isSubmitting}
          >
            Start Test
          </AppButton>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </article>
      </section>

      <footer className="mt-10 border-t border-[#e2e8f0] bg-white py-3">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-base text-[#666c77] sm:flex-row sm:px-8">
          <p>&copy; 2026 {branding.companyName || "Hire Secure"} All right reserved</p>
          <p>powered by TechForge Innovations</p>
        </div>
      </footer>
    </main>
  );
}
