/**
 * api.ts
 * Thin fetch wrapper using NEXT_PUBLIC_API_BASE.
 */
import { API_BASE } from "./env";

// Generic fetch options with optional search params
export type Options = RequestInit & { searchParams?: Record<string, string | number | boolean | undefined> };

// Convert an object into a query string
function toQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// Main API helper function
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const url = `${API_BASE}${path}${toQuery(opts.searchParams)}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as any;
  // @ts-ignore allow text for non-json responses
  return res.text() as any;
}

// Types and helper functions for common endpoints
export interface HealthResponse {
  ok: boolean;
}

export async function getHealth(): Promise<HealthResponse> {
  return api<HealthResponse>("/health");
}
