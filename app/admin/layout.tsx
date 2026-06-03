import type { ReactNode } from "react";
import { AdminShellLayout } from "./AdminShellLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}