"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";

type AdminRouteGuardProps = {
  children: ReactNode;
};

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isAllowed = isHydrated ? Boolean(getAdminToken()) : false;

  if (!isHydrated) {
    return null;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-[460px] rounded-[12px] border border-[#dbe3ef] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.26)]">
        <h3 className="text-[24px] font-semibold text-[#0f172a]">Admin Login Required</h3>
        <p className="mt-2 text-sm text-[#475569]">
          Direct access to this page is not allowed. Please login first.
        </p>
        <div className="mt-5 flex justify-end">
          <AppButton
            type="button"
            variant="primary"
            className="h-10 rounded-[8px] px-5"
            onClick={() => router.replace("/")}
          >
            Go To Login
          </AppButton>
        </div>
      </div>
    </div>
  );
}
