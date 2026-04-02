import { cookies } from "next/headers";

export async function getInitialAdminThemeDark(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_theme")?.value === "dark";
}

