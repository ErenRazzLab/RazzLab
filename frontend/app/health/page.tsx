import { getHealth } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let status: string;
  try {
    const h = await getHealth();
    status = h?.ok ? "healthy" : "unhealthy";
  } catch (e: any) {
    status = `error: ${e?.message ?? "unknown error"}`;
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Backend health</h1>
      <p className="mt-3">Status: <span className="font-mono">{status}</span></p>
    </main>
  );
}
