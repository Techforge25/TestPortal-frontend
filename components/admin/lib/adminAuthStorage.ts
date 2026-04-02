const ADMIN_TOKEN_KEY = "admin_auth_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  return token && token.trim().length > 0 ? token : null;
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}

