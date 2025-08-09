export default async function Page() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const res = await fetch(`${base}/health`, { cache: "no-store" }).catch(() => null);
  let ok = false;
  try {
    const data = await res?.json();
    ok = Boolean(data?.ok);
  } catch {}

  return (
    <main style={{padding: 32, fontFamily: "system-ui, -apple-system, sans-serif"}}>
      <h1>RazzLab – Frontend</h1>
      <p>Backend URL: <code>{base || "(not set)"}</code></p>
      <p>Health: <strong style={{color: ok ? "green" : "crimson"}}>{ok ? "OK" : "FAIL"}</strong></p>
      <p style={{marginTop: 16}}>
        Set <code>NEXT_PUBLIC_BACKEND_URL</code> in <code>.env.local</code> and restart dev server.
      </p>
    </main>
  );
}
