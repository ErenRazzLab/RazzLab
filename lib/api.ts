export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
