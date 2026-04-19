import { NextResponse } from 'next/server';

const ARIMA_API_URL = 'http://127.0.0.1:8000/forecast';

export async function GET() {
  try {
    const res = await fetch(ARIMA_API_URL, {
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
      { error: 'Forecast service is unavailable. Make sure the ARIMA server is running on port 8000.' },
      { status: 503 }
    );
  }
}
