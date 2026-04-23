import { NextResponse } from 'next/server';

export async function GET() {
  const arimaUrl = process.env.ARIMA_API_URL;

  if (!arimaUrl) {
    return NextResponse.json(
      { error: 'ARIMA_API_URL is not configured.' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${arimaUrl}/forecast`, {
      // No caching — always get a fresh forecast
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Forecast service returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Forecast service is unavailable.' },
      { status: 503 }
    );
  }
}
