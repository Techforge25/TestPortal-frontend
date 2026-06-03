export function normalizePublishStatus(status: "draft" | "active") {
  return status === "draft" ? "Draft" : "Active";
}