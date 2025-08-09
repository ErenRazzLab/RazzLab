export default async function Page() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE || ''}/health`;
  let ok = false;

  try {
    if (!process.env.NEXT_PUBLIC_API_BASE) throw new Error('env not set');
    const res = await fetch(url, { cache: 'no-store' });
    ok = res.ok;
  } catch {
    ok = false;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>RazzLab</h1>
      <p>Backend: <strong style={{ color: ok ? 'green' : 'crimson' }}>{ok ? 'OK' : 'DOWN'}</strong></p>
      {!ok && (
        <>
          <p>Set <code>NEXT_PUBLIC_API_BASE</code> in <code>frontend/.env.local</code> and restart dev server.</p>
        </>
      )}
    </main>
  );
}
