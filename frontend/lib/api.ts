export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  if (!base) throw new Error('NEXT_PUBLIC_API_BASE is not set');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
