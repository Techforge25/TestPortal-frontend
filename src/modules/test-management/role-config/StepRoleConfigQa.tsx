// @ts-nocheck
import { CreateTestCard } from "../components/CreateTestCard";

export function StepRoleConfigQa(props: any) {
  const {
    step,
    isDark,
    sectionPrompts,
    parseBugReportPrompt,
    buildBugReportPrompt,
    upsertSectionPrompt,
    editorConstructor,
    CKEditor,
    editorConfig,
    uploadCkeditorImage,
    formatCkeditorUploadError,
    setBugReportImageUploadErrorByKey,
    setBugReportImageUploadingByKey,
    bugReportImageUploadErrorByKey,
    bugReportImageUploadingByKey,
    bugReportWebsiteDraftRef,
    bugReportDescriptionHtmlDraftRef,
    editorHtmlToPlainText,
    plainTextToEditorHtml,
  } = props;

  if (step !== 3) return null;
  const item = (sectionPrompts.bug_report || [])[0];
  if (!item) return null;
  const sectionKey = "bug_report";
  const parsed = parseBugReportPrompt(item.value || "");
  const bugEditorKey = `${sectionKey}-${item.id}`;
  const bugUploadError = bugReportImageUploadErrorByKey[bugEditorKey] || "";
  const bugUploading = Boolean(bugReportImageUploadingByKey[bugEditorKey]);
  const draftWebsite = bugReportWebsiteDraftRef.current[bugEditorKey] ?? parsed.websiteLink;
  const draftDescriptionHtml = bugReportDescriptionHtmlDraftRef.current[bugEditorKey] ?? (parsed.descriptionHtml?.trim() ? parsed.descriptionHtml : plainTextToEditorHtml(parsed.description));

  return (
    <CreateTestCard title="Bug Report" subtitle="1 Section Enabled" isDark={isDark}>
      <div className={`w-full space-y-3 rounded-[12px] p-3 ${isDark ? "bg-slate-900/70" : "bg-[#f8fafc]"}`}>
        <input
          key={`${bugEditorKey}-${parsed.websiteLink}`}
          type="url"
          defaultValue={draftWebsite}
          onChange={(event) => {
            bugReportWebsiteDraftRef.current[bugEditorKey] = event.target.value || "";
          }}
          onBlur={(event) => {
            const raw = event.currentTarget.value ?? "";
            const trimmed = raw.trim();
            const normalized = trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
            bugReportWebsiteDraftRef.current[bugEditorKey] = normalized;
            if (normalized === parsed.websiteLink) return;
            upsertSectionPrompt(sectionKey, item.id, buildBugReportPrompt({ ...parsed, websiteLink: normalized, descriptionHtml: draftDescriptionHtml }));
          }}
          className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-transparent bg-slate-800 text-slate-100" : "border-transparent bg-white text-[#0f172a] shadow-[inset_0_0_0_1px_#e2e8f0]"}`}
          placeholder="Website link (e.g., https://example.com)"
        />
        <div className={`qa-bug-ckeditor w-full rounded-[10px] border ${isDark ? "is-dark border-transparent bg-slate-800" : "border-transparent bg-white"}`}>
          <p className={`mb-2 px-3 pt-3 text-base font-semibold ${isDark ? "text-slate-200" : "text-[#1e293b]"}`}>Description</p>
          {editorConstructor ? (
            <CKEditor
              editor={editorConstructor as never}
              key={bugEditorKey}
              data={draftDescriptionHtml}
              config={{ ...editorConfig }}
              onReady={(editor: any) => {
                try {
                  const fileRepository = editor.plugins.get("FileRepository");
                  if (!fileRepository) return;
                  fileRepository.createUploadAdapter = (loader: any) => ({
                    upload: async () => {
                      setBugReportImageUploadErrorByKey((prev: any) => { const next = { ...prev }; delete next[bugEditorKey]; return next; });
                      setBugReportImageUploadingByKey((prev: any) => ({ ...prev, [bugEditorKey]: true }));
                      try {
                        const file = await loader.file;
                        const url = await uploadCkeditorImage(file);
                        return { default: url };
                      } catch (error) {
                        const message = formatCkeditorUploadError(error);
                        setBugReportImageUploadErrorByKey((prev: any) => ({ ...prev, [bugEditorKey]: message }));
                        throw error;
                      } finally {
                        setBugReportImageUploadingByKey((prev: any) => { const next = { ...prev }; delete next[bugEditorKey]; return next; });
                      }
                    },
                    abort: () => {},
                  });
                } catch {}
              }}
              onChange={(_event: any, editor: any) => {
                const rawHtml = editor.getData();
                const plain = editorHtmlToPlainText(rawHtml);
                if (plain.length > 5000) {
                  const clipped = plain.slice(0, 5000);
                  const clippedHtml = plainTextToEditorHtml(clipped);
                  bugReportDescriptionHtmlDraftRef.current[bugEditorKey] = clippedHtml;
                  editor.setData(clippedHtml);
                  return;
                }
                bugReportDescriptionHtmlDraftRef.current[bugEditorKey] = rawHtml;
              }}
              onBlur={() => {
                const draftHtml = bugReportDescriptionHtmlDraftRef.current[bugEditorKey];
                if (typeof draftHtml !== "string") return;
                const draftPlain = editorHtmlToPlainText(draftHtml).slice(0, 5000);
                if (draftPlain === parsed.description) return;
                upsertSectionPrompt(sectionKey, item.id, buildBugReportPrompt({ ...parsed, description: draftPlain, descriptionHtml: draftHtml }));
              }}
            />
          ) : null}
          {bugUploading ? <p className={`px-3 pb-2 text-[12px] ${isDark ? "text-slate-300" : "text-[#1f3a8a]"}`}>Uploading image...</p> : null}
          {bugUploadError ? <p className="px-3 pb-2 text-[12px] text-red-600">{bugUploadError}</p> : null}
        </div>
      </div>
    </CreateTestCard>
  );
}
