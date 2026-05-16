const TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function persistAuthSession(data: {
  user?: unknown;
  accessToken?: string;
}): void {
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem("user");
  clearAccessToken();
}
