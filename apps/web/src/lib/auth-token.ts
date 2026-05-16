export function persistAuthSession(data: { user?: unknown } | unknown): void {
  const user =
    data && typeof data === "object" && "user" in data
      ? (data as { user: unknown }).user
      : data;

  if (user && typeof user === "object") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem("user");
}
