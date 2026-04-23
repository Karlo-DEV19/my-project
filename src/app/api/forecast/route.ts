import { NextResponse } from 'next/server';

export async function GET() {
  const arimaUrl = process.env.ARIMA_API_URL;

  // ── Debug: log which URL is being used ──────────────────────────────────────
  console.log('[forecast] NODE_ENV   :', process.env.NODE_ENV);
  console.log('[forecast] ARIMA_API_URL:', arimaUrl ?? '(not set)');

  if (!arimaUrl) {
    console.error('[forecast] ARIMA_API_URL is not configured — returning 503');
    return NextResponse.json(
      { error: 'ARIMA_API_URL is not configured.' },
      { status: 503 }
    );
  }

  // ── 15-second hard timeout so Vercel never hangs indefinitely ───────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const endpoint = `${arimaUrl}/forecast`;
    console.log('[forecast] Fetching:', endpoint);

    const res = await fetch(endpoint, {
      cache: 'no-store',          // always get a fresh forecast
      signal: controller.signal,  // respect the timeout
    });

    clearTimeout(timeout);
    console.log('[forecast] Response status:', res.status);

    if (!res.ok) {
      console.error('[forecast] Non-OK response:', res.status);
      return NextResponse.json(
        { error: `Forecast service returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log('[forecast] Success — keys:', Object.keys(data));
    return NextResponse.json(data);

  } catch (err) {
    clearTimeout(timeout);

    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const message = isTimeout
      ? 'Forecast service timed out (15 s)'
      : (err instanceof Error ? err.message : 'Forecast service is unavailable.');

    console.error('[forecast] Error:', message);
    return NextResponse.json(
      { error: message },
      { status: 503 }
    );
  }
}
