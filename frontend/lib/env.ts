/**
 * env.ts
 * Centralized environment access with validation.
 */
export const API_BASE = (() => {
  const v = process.env.NEXT_PUBLIC_API_BASE;
  if (!v) {
    throw new Error("NEXT_PUBLIC_API_BASE is not set. Create .env.local with NEXT_PUBLIC_API_BASE=https://<cloud-run-url>");
  }
  return v.replace(/\/$/, ""); // strip trailing slash
})();
