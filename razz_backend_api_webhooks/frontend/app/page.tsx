import { api } from "@/lib/api";

export default async function Home() {
  let ok = false;
  try {
    const data = await api("/health");
    ok = !!data?.ok;
  } catch {}
  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">RazzLab</h1>
      <p className="mt-4">API health: {String(ok)}</p>
    </main>
  );
}
