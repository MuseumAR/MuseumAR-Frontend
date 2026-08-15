const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function currentPathForNext() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function loginUrl(next?: string | null) {
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (AUTH_PAGES.some((p) => path === p || path.startsWith(`${p}?`))) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(path)}`;
}

export function redirectToLogin(next?: string | null) {
  if (typeof window === "undefined") return;
  window.location.assign(loginUrl(next ?? currentPathForNext()));
}

export function isAuthApiPath(path: string) {
  const normalized = path.toLowerCase();
  return (
    normalized.startsWith("/api/auth/login") ||
    normalized.startsWith("/api/auth/register") ||
    normalized.startsWith("/api/auth/forgot-password") ||
    normalized.startsWith("/api/auth/reset-password") ||
    normalized.startsWith("/api/auth/google-login")
  );
}
