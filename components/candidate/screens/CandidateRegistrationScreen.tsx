"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { candidateLoginWithPasscode, getCandidateProfilePrefill } from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { readCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
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
  expectedJoiningDate: string;
  shiftComfortable: string;
};

const CANDIDATE_REG_DRAFT_KEY = "candidate_registration_form_draft_v1";

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
  { key: "dateOfBirth", label: "Date of Birth", placeholder: "dd/mm/yyyy" },
  { key: "positionAppliedFor", label: "Position Applied For", placeholder: "Front End Developer", full: true },
  {
    key: "residentialAddress",
    label: "Residential Address",
    placeholder: "401, Al-Falah Court I.I.Chundrigar Road, Karachi",
    full: true,
  },
  { key: "workExperience", label: "Work Experience", placeholder: "Frontend Developer", full: true },
  { key: "startDate", label: "Start Date", placeholder: "dd/mm/yyyy" },
  { key: "endDate", label: "End Date", placeholder: "dd/mm/yyyy" },
];

const bottomFields: FieldConfig[] = [
  { key: "expectedJoiningDate", label: "Expected Date of Joining", placeholder: "dd/mm/yyyy" },
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

const dateFieldKeys: Array<keyof FormState> = ["dateOfBirth", "startDate", "endDate", "expectedJoiningDate"];

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

function parseDateToTimestamp(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return NaN;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/");
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(`${iso}T00:00:00`).getTime();
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`).getTime();
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return NaN;
}

function normalizeDateForApi(value: string) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const [day, month, year] = raw.split("/");
  return `${year}-${month}-${day}`;
}

function normalizeDateForInput(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }
  return formatDateInput(raw);
}

function BrandMark() {
  return (
    <svg viewBox="0 0 50 34" className="h-[62px] w-[92px]" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="30" height="30" rx="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 16L16 22L27 11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23C33 21.5 35 19 36 15" stroke="#15A8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CalendarInput({
  label,
  value,
  placeholder,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const parsed = /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split("/") : null;
  const today = new Date();
  const selectedDay = parsed ? Number(parsed[0]) : null;
  const selectedMonth = parsed ? Number(parsed[1]) - 1 : null;
  const selectedYear = parsed ? Number(parsed[2]) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [opensAbove, setOpensAbove] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedMonth ?? today.getMonth());
  const [viewYear, setViewYear] = useState(selectedYear ?? today.getFullYear());

  useEffect(() => {
    if (!isOpen) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const estimatedPanelHeight = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensAbove(spaceBelow < estimatedPanelHeight && rect.top > estimatedPanelHeight);
    }
    const onClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [isOpen]);

  function openCalendar() {
    if (selectedMonth !== null && selectedYear !== null) {
      setViewMonth(selectedMonth);
      setViewYear(selectedYear);
    }
    setIsOpen((prev) => !prev);
  }

  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function formatFromParts(day: number, month: number, year: number) {
    const dd = String(day).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    return `${dd}/${mm}/${year}`;
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  }

  function changeYear(nextYear: number) {
    if (!Number.isFinite(nextYear)) return;
    const safeYear = Math.min(2100, Math.max(1970, Math.trunc(nextYear)));
    setViewYear(safeYear);
  }

  function shiftYear(delta: number) {
    changeYear(viewYear + delta);
  }

  function selectDate(day: number, month: number, year: number) {
    onChange(formatFromParts(day, month, year));
    setIsOpen(false);
  }

  function clearDate() {
    onChange("");
    setIsOpen(false);
  }

  function setToday() {
    onChange(formatFromParts(today.getDate(), today.getMonth(), today.getFullYear()));
    setIsOpen(false);
  }

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const currentMonthDays = daysInMonth(viewYear, viewMonth);
  const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
  const prevMonthDays = daysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  const cells: Array<{ day: number; month: number; year: number; inMonth: boolean }> = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      month: prevMonthDate.getMonth(),
      year: prevMonthDate.getFullYear(),
      inMonth: false,
    });
  }
  for (let day = 1; day <= currentMonthDays; day++) {
    cells.push({ day, month: viewMonth, year: viewYear, inMonth: true });
  }
  while (cells.length < 42) {
    const nextDay = cells.length - (firstDay + currentMonthDays) + 1;
    const nextDate = new Date(viewYear, viewMonth + 1, 1);
    cells.push({
      day: nextDay,
      month: nextDate.getMonth(),
      year: nextDate.getFullYear(),
      inMonth: false,
    });
  }

  return (
    <label className={`block ${className}`}>
      <span className="mb-3 block text-[18px] text-[#0f172a]">{label}</span>
      <div className="relative" ref={panelRef}>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          className="h-[52px] w-full rounded-[10px] border border-[#e3e7ee] bg-white px-6 pr-12 text-slate-900 outline-none placeholder:text-[#9ca3af] focus:border-[#1f3a8a]"
        />
        <button
          type="button"
          onClick={openCalendar}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#64748b] transition hover:bg-[#eef2ff] hover:text-[#1f3a8a]"
          aria-label={`Open ${label} calendar`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5">
            <rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M7 3.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M17 3.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </button>
        {isOpen ? (
          <div
            className={`absolute right-0 z-40 w-[320px] rounded-xl border border-[#dbe3ef] bg-white p-3 shadow-[0_14px_40px_rgba(15,23,42,0.18)] ${
              opensAbove ? "bottom-[58px]" : "top-[58px]"
            }`}
          >
            <div className="mb-3 rounded-lg border border-[#dbe3ef] bg-[#f8fbff] p-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#64748b] transition hover:bg-[#e6eeff] hover:text-[#1f3a8a]"
                  aria-label="Previous month"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-4"><path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <p className="text-[15px] font-semibold tracking-[-0.2px] text-[#0f172a]">
                  {monthNames[viewMonth]} {viewYear}
                </p>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#64748b] transition hover:bg-[#e6eeff] hover:text-[#1f3a8a]"
                  aria-label="Next month"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-4"><path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftYear(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#dbe3ef] bg-white text-[#64748b] transition hover:bg-[#eef2ff] hover:text-[#1f3a8a]"
                  aria-label="Previous year"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1970}
                  max={2100}
                  value={viewYear}
                  onChange={(event) => changeYear(Number(event.target.value))}
                  className="h-7 w-[84px] rounded border border-[#dbe3ef] bg-white px-1 text-center text-sm font-semibold text-[#0f172a] outline-none focus:border-[#1f3a8a]"
                />
                <button
                  type="button"
                  onClick={() => shiftYear(1)}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#dbe3ef] bg-white text-[#64748b] transition hover:bg-[#eef2ff] hover:text-[#1f3a8a]"
                  aria-label="Next year"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {weekNames.map((day) => (
                <div key={day} className="h-8 text-center text-xs font-semibold text-[#64748b] leading-8">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                const isSelected =
                  selectedDay === cell.day && selectedMonth === cell.month && selectedYear === cell.year;
                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                    type="button"
                    onClick={() => selectDate(cell.day, cell.month, cell.year)}
                    className={`h-9 rounded-md text-sm transition ${
                      isSelected
                        ? "bg-[#1f3a8a] text-white"
                        : cell.inMonth
                          ? "text-[#0f172a] hover:bg-[#eef2ff]"
                          : "text-[#9ca3af] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#edf2f7] pt-2">
              <button type="button" onClick={clearDate} className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">Clear</button>
              <button type="button" onClick={setToday} className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">Today</button>
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}

export function CandidateRegistrationScreen() {
  const router = useRouter();
  const loginDraft = useMemo(() => readCandidateAuthDraft(), []);
  const didPrefillRef = useRef(false);
  const [form, setForm] = useState<FormState>(() => ({
    ...(typeof window !== "undefined"
      ? (() => {
          try {
            const raw = window.localStorage.getItem(CANDIDATE_REG_DRAFT_KEY);
            if (!raw) return initialState;
            const parsed = JSON.parse(raw) as FormState;
            return { ...initialState, ...parsed };
          } catch {
            return initialState;
          }
        })()
      : initialState),
    email: loginDraft?.email || "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const branding = usePublicBranding();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CANDIDATE_REG_DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncDraft = () => {
      try {
        const raw = window.localStorage.getItem(CANDIDATE_REG_DRAFT_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as FormState;
        setForm((prev) => ({ ...prev, ...parsed, email: loginDraft?.email || parsed.email || prev.email }));
      } catch {
        // ignore draft parse failures
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CANDIDATE_REG_DRAFT_KEY) return;
      syncDraft();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [loginDraft?.email]);

  useEffect(() => {
    if (didPrefillRef.current) return;
    didPrefillRef.current = true;
    const candidateEmail = loginDraft?.email?.trim();
    const testPasscode = loginDraft?.testPasscode?.trim();
    if (!candidateEmail) return;

    void (async () => {
      try {
        const prefill = await getCandidateProfilePrefill({
          candidateEmail,
          testPasscode,
        });
        if (!prefill.found) return;
        setForm((prev) => ({
          ...prev,
          fullName: prefill.candidateName || prev.fullName,
          phoneNumber: prefill.candidateProfile?.phoneNumber || prev.phoneNumber,
          cnic: prefill.candidateProfile?.cnic || prev.cnic,
          maritalStatus: prefill.candidateProfile?.maritalStatus || prev.maritalStatus,
          qualification: prefill.candidateProfile?.qualification || prev.qualification,
          dateOfBirth: normalizeDateForInput(prefill.candidateProfile?.dateOfBirth || prev.dateOfBirth),
          positionAppliedFor:
            prefill.candidateProfile?.positionAppliedFor || prev.positionAppliedFor,
          residentialAddress:
            prefill.candidateProfile?.residentialAddress || prev.residentialAddress,
          workExperience: prefill.candidateProfile?.workExperience || prev.workExperience,
          startDate: normalizeDateForInput(prefill.candidateProfile?.startDate || prev.startDate),
          endDate: normalizeDateForInput(prefill.candidateProfile?.endDate || prev.endDate),
          expectedJoiningDate:
            normalizeDateForInput(prefill.candidateProfile?.expectedJoiningDate || prev.expectedJoiningDate),
          shiftComfortable:
            prefill.candidateProfile?.shiftComfortable || prev.shiftComfortable,
        }));
      } catch {
        // No-op: prefill is optional and should not block registration.
      }
    })();
  }, [loginDraft]);

function setValue(key: keyof FormState, value: string) {
    if (key === "fullName" || key === "positionAppliedFor") {
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
    if (dateFieldKeys.includes(key)) {
      setForm((prev) => ({ ...prev, [key]: formatDateInput(value) }));
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
    if (!/^[A-Za-z0-9\s.,()+\-_/]+$/.test(form.workExperience.trim())) {
      setError("Work Experience contains invalid characters.");
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
    if (dateFieldKeys.some((key) => Number.isNaN(parseDateToTimestamp(form[key])))) {
      setError("Please enter valid dates in DD/MM/YYYY format.");
      return;
    }
    if (form.startDate && form.endDate) {
      const start = parseDateToTimestamp(form.startDate);
      const end = parseDateToTimestamp(form.endDate);
      if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
        setError("End Date cannot be earlier than Start Date.");
        return;
      }
      if (form.expectedJoiningDate) {
        const joining = parseDateToTimestamp(form.expectedJoiningDate);
        if (Number.isFinite(joining)) {
          if (joining <= start || joining <= end) {
            setError("Expected Date of Joining must be later than Start Date and End Date.");
            return;
          }
        }
      }
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
          dateOfBirth: normalizeDateForApi(form.dateOfBirth),
          positionAppliedFor: form.positionAppliedFor,
          residentialAddress: form.residentialAddress,
          workExperience: form.workExperience,
          startDate: normalizeDateForApi(form.startDate),
          endDate: normalizeDateForApi(form.endDate),
          currentSalary: "N/A",
          expectedSalary: "N/A",
          expectedJoiningDate: normalizeDateForApi(form.expectedJoiningDate),
          shiftComfortable: form.shiftComfortable,
        },
      });

      saveCandidateSession({
        submissionId: response.submission.id,
        candidateSessionToken: response.candidateSessionToken,
        mcqSectionSubmitted: false,
        test: response.test,
        candidate: {
          name: response.submission.candidateName,
          email: response.submission.candidateEmail,
        },
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CANDIDATE_REG_DRAFT_KEY);
      }
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
        <header className="flex h-[96px] items-center justify-center rounded-[12px] bg-[#1f3a8a] px-4">
          <div className="flex items-center justify-center">
            {branding.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoDataUrl} alt="Company logo" className="h-[62px] w-auto max-w-[360px] object-contain" />
            ) : (
              <BrandMark />
            )}
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
              ) : dateFieldKeys.includes(field.key) ? (
                <CalendarInput
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => setValue(field.key, value)}
                  placeholder={field.placeholder}
                  className={field.full ? "md:col-span-2" : ""}
                />
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
              ) : dateFieldKeys.includes(field.key) ? (
                <CalendarInput
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => setValue(field.key, value)}
                  placeholder={field.placeholder}
                />
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
