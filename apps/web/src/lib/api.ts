const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  const json = await res.json();
  if (!res.ok) {
    const message =
      typeof json.error === "string"
        ? json.error
        : json.error?.message ?? "Request failed";
    throw new Error(message);
  }
  return json.data ?? json;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kinetik_token");
}

export function getStoredUser(): { role: string; firstName: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("kinetik_user");
  return raw ? JSON.parse(raw) : null;
}

export function storeAuth(token: string, user: object) {
  localStorage.setItem("kinetik_token", token);
  localStorage.setItem("kinetik_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("kinetik_token");
  localStorage.removeItem("kinetik_user");
}
