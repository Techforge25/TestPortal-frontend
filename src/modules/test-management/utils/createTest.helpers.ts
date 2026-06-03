import type { NonCodingSectionKey } from "../types/createTest.types";

export type SectionPromptItem = {
  id: number;
  value: string;
  marks: string;
};

export type UiPreviewPromptPayload = {
  taskPrompt: string;
  referenceImageUrl: string;
};

export type DesignerUiTaskPromptPayload = {
  taskPrompt: string;
  pdfUrl: string;
  pdfFileName: string;
  figmaReferenceLink: string;
};

export type BugReportPromptPayload = {
  websiteLink: string;
  description: string;
  descriptionHtml: string;
};

export type LocalSecurityDefaults = {
  forceFullscreen: boolean;
  disableTabSwitch: boolean;
  autoEndOnTabChange: boolean;
  disableCopyPaste: boolean;
  disableRightClick: boolean;
  detectDevTools: boolean;
  warningLimit: number;
  autoSaveInterval: number;
};

const ADMIN_SECURITY_LOCAL_KEY = "admin_security_defaults_local_v1";

export function parseUiPreviewPrompt(raw: string, defaults: Record<NonCodingSectionKey, string>): UiPreviewPromptPayload {
  if (!raw?.trim()) return { taskPrompt: defaults.ui_preview, referenceImageUrl: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<UiPreviewPromptPayload>;
    return {
      taskPrompt: String(parsed.taskPrompt || defaults.ui_preview),
      referenceImageUrl: String(parsed.referenceImageUrl || ""),
    };
  } catch {
    return { taskPrompt: raw, referenceImageUrl: "" };
  }
}

export function buildUiPreviewPrompt(value: UiPreviewPromptPayload, defaults: Record<NonCodingSectionKey, string>): string {
  return JSON.stringify({
    taskPrompt: String(value.taskPrompt || defaults.ui_preview),
    referenceImageUrl: String(value.referenceImageUrl || ""),
  });
}

export function parseDesignerUiTaskPrompt(raw: string, defaults: Record<NonCodingSectionKey, string>): DesignerUiTaskPromptPayload {
  if (!raw?.trim()) {
    return { taskPrompt: defaults.portfolio_link, pdfUrl: "", pdfFileName: "", figmaReferenceLink: "" };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DesignerUiTaskPromptPayload>;
    return {
      taskPrompt: String(parsed.taskPrompt || defaults.portfolio_link),
      pdfUrl: /^https?:\/\//i.test(String(parsed.pdfUrl || "")) ? String(parsed.pdfUrl || "") : "",
      pdfFileName: String(parsed.pdfFileName || ""),
      figmaReferenceLink: String(parsed.figmaReferenceLink || ""),
    };
  } catch {
    return { taskPrompt: raw, pdfUrl: "", pdfFileName: "", figmaReferenceLink: "" };
  }
}

export function buildDesignerUiTaskPrompt(value: DesignerUiTaskPromptPayload, defaults: Record<NonCodingSectionKey, string>): string {
  return JSON.stringify({
    taskPrompt: String(value.taskPrompt || defaults.portfolio_link),
    pdfUrl: String(value.pdfUrl || ""),
    pdfFileName: String(value.pdfFileName || ""),
    figmaReferenceLink: String(value.figmaReferenceLink || ""),
  });
}

export function parseBugReportPrompt(raw: string): BugReportPromptPayload {
  if (!raw?.trim()) return { websiteLink: "", description: "", descriptionHtml: "<p></p>" };

  try {
    const parsed = JSON.parse(raw) as Partial<BugReportPromptPayload> & { descriptionText?: string };
    if (parsed && (parsed.websiteLink || parsed.description || parsed.descriptionHtml || parsed.descriptionText)) {
      const htmlFromPayload = String(parsed.descriptionHtml || "");
      const textFromPayload = String(parsed.description || parsed.descriptionText || "");
      const normalizedHtml = htmlFromPayload.trim() ? htmlFromPayload : plainTextToEditorHtml(textFromPayload);
      const normalizedText = textFromPayload.trim() ? textFromPayload : editorHtmlToPlainText(normalizedHtml);
      return { websiteLink: String(parsed.websiteLink || ""), description: normalizedText, descriptionHtml: normalizedHtml };
    }
  } catch {}

  const websiteMatch = raw.match(/^\s*website\s*link\s*:\s*([^\r\n]*)/im);
  const descriptionMatch = raw.match(/^\s*description\s*:\s*([\s\S]*)$/im);
  if (websiteMatch || descriptionMatch) {
    const plain = (descriptionMatch?.[1] || "").trim();
    return {
      websiteLink: (websiteMatch?.[1] || "").trim(),
      description: plain,
      descriptionHtml: plainTextToEditorHtml(plain),
    };
  }

  return { websiteLink: "", description: raw.trim(), descriptionHtml: plainTextToEditorHtml(raw.trim()) };
}

export function buildBugReportPrompt(value: BugReportPromptPayload): string {
  const descriptionHtml = String(value.descriptionHtml || "").trim();
  const descriptionText = String(value.description || "").trim();
  const normalizedHtml = descriptionHtml || plainTextToEditorHtml(descriptionText);
  const normalizedText = descriptionText || editorHtmlToPlainText(normalizedHtml);
  return JSON.stringify({
    websiteLink: String(value.websiteLink || "").trim(),
    descriptionHtml: normalizedHtml,
    descriptionText: normalizedText,
  });
}

export function editorHtmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}

export function plainTextToEditorHtml(text: string): string {
  const value = String(text || "").trim();
  if (!value) return "<p></p>";
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped.split("\n").map((line) => `<p>${line || "&nbsp;"}</p>`).join("");
}

export function readLocalSecurityDefaults(): LocalSecurityDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SECURITY_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSecurityDefaults;
  } catch {
    return null;
  }
}
