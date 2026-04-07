"use client";

import { useMemo, useState } from "react";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";

export type UiPreviewFramework = "html_css_js" | "react_tailwind";

export type UiPreviewAnswer = {
  framework: UiPreviewFramework;
  html: string;
  css: string;
  js: string;
  reactCode: string;
};

export const DEFAULT_REACT_UI_PREVIEW_CODE = `import React from "react";

export default function WelcomeUI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center px-4">
      
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Hi Interviewer 👋
        </h1>

        <p className="text-blue-100 text-lg mb-6">
          Welcome to <span className="font-semibold text-white">Techforoge Innovations</span>
        </p>

        <p className="text-blue-200 mb-8">
          We build modern, scalable and user-friendly web experiences using the latest technologies.
        </p>

        <button className="bg-white text-blue-800 font-semibold px-6 py-2 rounded-xl hover:bg-blue-100 transition duration-300">
          Explore More
        </button>

      </div>

    </div>
  );
}`;

type UiPreviewTaskEditorProps = {
  value: UiPreviewAnswer;
  onChange: (next: UiPreviewAnswer) => void;
  referenceImageUrl?: string;
};

type PreviewViewport = "desktop" | "tablet" | "mobile";

function escapeScriptBoundary(value: string) {
  return String(value || "").replace(/<\/(script)/gi, "<\\/$1");
}

function buildHtmlPreviewDoc(answer: UiPreviewAnswer) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; min-height: 100%; }
    ${answer.css || ""}
  </style>
</head>
<body>
  ${answer.html || "<div></div>"}
  <script>${escapeScriptBoundary(answer.js || "")}<\/script>
</body>
</html>`;
}

function buildReactPreviewDoc(answer: UiPreviewAnswer) {
  const rawCode = String(answer.reactCode || "").trim();
  const hasFullComponentSyntax =
    /\bexport\s+default\s+function\b/.test(rawCode) ||
    /\bfunction\s+[A-Za-z_]\w*\s*\(/.test(rawCode) ||
    /\bconst\s+[A-Za-z_]\w*\s*=/.test(rawCode);

  const sanitizedFullComponentCode = rawCode
    .replace(/^\s*import\s+.*?;?\s*$/gm, "")
    .replace(/\bexport\s+default\s+/g, "");

  const functionNameMatch = sanitizedFullComponentCode.match(/\bfunction\s+([A-Za-z_]\w*)\s*\(/);
  const constNameMatch = sanitizedFullComponentCode.match(/\bconst\s+([A-Za-z_]\w*)\s*=\s*(?:\(|async\s*\(|\w+\s*=>|\([^)]*\)\s*=>)/);
  const componentName = functionNameMatch?.[1] || constNameMatch?.[1] || "App";

  const runtimeCode = hasFullComponentSyntax
    ? `
${sanitizedFullComponentCode}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<${componentName} />);
`
    : `
function TaskApp() {
  ${rawCode || 'return <div className="p-6 text-slate-800">Build your UI here.</div>;'}
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<TaskApp />);
`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; min-height: 100%; }
    #root { min-height: 100%; }
    ${answer.css || ""}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="preview-error" style="display:none;padding:12px;margin:12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;font:14px sans-serif;"></div>
  <script type="text/babel">
    const errorBox = document.getElementById("preview-error");
    const showError = (msg) => {
      if (!errorBox) return;
      errorBox.style.display = "block";
      errorBox.textContent = msg;
    };
    window.addEventListener("error", (event) => {
      showError("Preview error: " + (event?.message || "Unknown runtime error"));
    });
    try {
      const { useState, useMemo, useEffect } = React;
      ${runtimeCode}
    } catch (error) {
      showError("Preview error: " + (error?.message || "Invalid React code"));
    }
  <\/script>
</body>
</html>`;
}

const frameworkOptions: Array<{ value: UiPreviewFramework; label: string }> = [
  { value: "react_tailwind", label: "React + Tailwind" },
  { value: "html_css_js", label: "HTML/CSS/JS" },
];

export function UiPreviewTaskEditor({ value, onChange, referenceImageUrl }: UiPreviewTaskEditorProps) {
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const previewDoc = useMemo(
    () => (value.framework === "react_tailwind" ? buildReactPreviewDoc(value) : buildHtmlPreviewDoc(value)),
    [value]
  );

  const previewViewportOptions: Array<{ value: PreviewViewport; label: string }> = [
    { value: "desktop", label: "Desktop" },
    { value: "tablet", label: "Tablet" },
    { value: "mobile", label: "Mobile" },
  ];

  const previewFrameWidthClass =
    previewViewport === "desktop"
      ? "w-full"
      : previewViewport === "tablet"
        ? "w-full max-w-[900px]"
        : "w-full max-w-[430px]";

  return (
    <div className="space-y-4">
      {referenceImageUrl ? (
        <div className="rounded-[12px] border border-[#dbe3ef] bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-sm font-semibold text-[#0f172a]">Reference Screenshot</p>
          <img
            src={referenceImageUrl}
            alt="Task reference"
            className="max-h-[380px] w-full rounded-[10px] object-contain"
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-[10px] bg-[#f8faff] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Framework</p>
            <AppDropdown
              value={value.framework}
              onChange={(next) => onChange({ ...value, framework: next as UiPreviewFramework })}
              options={frameworkOptions}
              ariaLabel="UI framework"
              className="h-12 rounded-[10px] border border-[#dbe3ef]"
              triggerClassName="px-3 text-[15px] text-[#0f172a]"
              chevronClassName="text-[#64748b]"
              menuClassName="rounded-[10px] border border-[#dbe3ef] bg-white shadow-lg"
              optionClassName="px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f4f7ff]"
              selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
            />
            <div className="mt-4">
              <AppButton
                variant="secondary"
                size="md"
                className="h-11 w-full rounded-[10px]"
                onClick={() =>
                  onChange({
                    framework: "react_tailwind",
                    html: "<main><h1>UI Task</h1></main>",
                    css: "body { font-family: sans-serif; padding: 20px; }",
                    js: "",
                    reactCode: DEFAULT_REACT_UI_PREVIEW_CODE,
                  })
                }
              >
                Reset Starter
              </AppButton>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#dbe3ef] bg-white p-3">
            <div className="space-y-4">
              {value.framework === "html_css_js" ? (
                <>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">HTML</p>
                    <textarea
                      value={value.html}
                      onChange={(event) => onChange({ ...value, html: event.target.value })}
                      className="h-[190px] w-full resize-none rounded-[10px] border border-[#dbe3ef] bg-[#0b1229] p-4 font-mono text-[14px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">CSS</p>
                    <textarea
                      value={value.css}
                      onChange={(event) => onChange({ ...value, css: event.target.value })}
                      className="h-[180px] w-full resize-none rounded-[10px] border border-[#dbe3ef] bg-[#0b1229] p-4 font-mono text-[14px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">JavaScript</p>
                    <textarea
                      value={value.js}
                      onChange={(event) => onChange({ ...value, js: event.target.value })}
                      className="h-[180px] w-full resize-none rounded-[10px] border border-[#dbe3ef] bg-[#0b1229] p-4 font-mono text-[14px] text-white outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">React Component</p>
                  <textarea
                    value={value.reactCode}
                    onChange={(event) => onChange({ ...value, reactCode: event.target.value })}
                    className="h-[680px] w-full resize-none rounded-[10px] border border-[#dbe3ef] bg-[#0b1229] p-4 font-mono text-[14px] text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#dbe3ef] bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#0f172a]">Live Preview</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#64748b]">Responsive</span>
              <AppDropdown
                value={previewViewport}
                onChange={(next) => setPreviewViewport(next as PreviewViewport)}
                options={previewViewportOptions}
                ariaLabel="Preview viewport"
                className="h-10 min-w-[140px] rounded-[10px] border border-[#dbe3ef] bg-white"
                triggerClassName="px-3 text-[14px] text-[#0f172a]"
                chevronClassName="text-[#64748b]"
                menuClassName="rounded-[10px] border border-[#dbe3ef] bg-white shadow-lg"
                optionClassName="px-3 py-2 text-[14px] text-[#475569] hover:bg-[#f4f7ff]"
                selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
              />
            </div>
          </div>
          <div className="flex w-full justify-center">
            <iframe
              title="UI preview"
              sandbox="allow-scripts"
              srcDoc={previewDoc}
              className={`h-[840px] rounded-[10px] bg-white transition-all duration-200 ${previewFrameWidthClass}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
