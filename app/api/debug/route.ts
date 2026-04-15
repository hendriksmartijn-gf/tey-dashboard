import { NextResponse } from 'next/server';
import { getRawSheetData } from '@/lib/sheets';

// Development-only — returns the first 20 raw rows + headers from both tabs
// so field mapping can be verified before building the UI.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { linkedin, meta } = await getRawSheetData();

    return NextResponse.json({
      linkedin: {
        headers: linkedin[0] ?? [],
        sample: linkedin.slice(1, 21),
        total_rows: Math.max(0, linkedin.length - 1),
      },
      meta: {
        headers: meta[0] ?? [],
        sample: meta.slice(1, 21),
        total_rows: Math.max(0, meta.length - 1),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
