const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function api<T=unknown>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}
