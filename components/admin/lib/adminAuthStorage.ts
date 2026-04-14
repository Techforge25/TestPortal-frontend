const ADMIN_TOKEN_KEY = "admin_auth_token";
const ADMIN_TOKEN_COOKIE = "admin_auth_token";
const ONE_DAY_SECONDS = 60 * 60 * 24;
const THIRTY_DAYS_SECONDS = ONE_DAY_SECONDS * 30;

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const token = value.trim();
  return token.length > 0 ? token : null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return normalizeToken(match ? decodeURIComponent(match[1]) : null);
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;

  const localToken = normalizeToken(window.localStorage.getItem(ADMIN_TOKEN_KEY));
  const sessionToken = normalizeToken(window.sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const cookieToken = readCookie(ADMIN_TOKEN_COOKIE);
  const token = localToken || sessionToken || cookieToken;

  if (!token) return null;

  // Self-heal storage mismatch: keep all storages in sync.
  if (localToken !== token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (sessionToken !== token) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (cookieToken !== token) writeCookie(ADMIN_TOKEN_COOKIE, token, THIRTY_DAYS_SECONDS);

  return token;
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeToken(token);
  if (!normalized) return;

  window.localStorage.setItem(ADMIN_TOKEN_KEY, normalized);
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, normalized);
  writeCookie(ADMIN_TOKEN_COOKIE, normalized, THIRTY_DAYS_SECONDS);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  clearCookie(ADMIN_TOKEN_COOKIE);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken());
}
