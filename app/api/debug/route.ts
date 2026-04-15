import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { getRawSheetData } from '@/lib/sheets';

// Development-only — returns raw headers, sample rows, and lists all tab names
// in the spreadsheet so you can verify the exact tab names.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const sheetId = process.env.GOOGLE_SHEETS_ID ?? '(not set)';

  // First: list all actual tab names in the spreadsheet
  let tabNames: string[] = [];
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
    if (email && key) {
      const auth = new JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      tabNames = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? '');
    }
  } catch (_) {
    // tabNames stays empty — the main fetch will surface the real error
  }

  try {
    const { linkedin, meta } = await getRawSheetData();

    return NextResponse.json({
      spreadsheet_id: sheetId,
      actual_tab_names: tabNames,
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
    return NextResponse.json({
      spreadsheet_id: sheetId,
      actual_tab_names: tabNames,
      error: message,
    }, { status: 500 });
  }
}
