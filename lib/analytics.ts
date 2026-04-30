import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// ── Auth ─────────────────────────────────────────────────────────────────────

function getAnalyticsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
  }

  const auth = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({ version: 'v1beta', auth });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsDayRow {
  date: string;            // YYYY-MM-DD
  channel: string;         // e.g. 'Paid Social', 'Organic Search', 'Direct'
  sessions: number;
  users: number;
  keyEvents: number;       // goal completions / conversions
}

export interface AnalyticsSummary {
  byDay: AnalyticsDayRow[];
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function getAnalyticsData(
  startDate = '90daysAgo',
  endDate   = 'today',
): Promise<AnalyticsSummary> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error('Missing GA4_PROPERTY_ID env var');

  const analytics = getAnalyticsClient();

  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'sessionDefaultChannelGrouping' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'keyEvents' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    },
  });

  const rows = res.data.rows ?? [];

  const byDay: AnalyticsDayRow[] = rows.map((row) => {
    const dims    = row.dimensionValues ?? [];
    const metrics = row.metricValues   ?? [];

    // GA4 returns date as YYYYMMDD — normalise to YYYY-MM-DD
    const rawDate = dims[0]?.value ?? '';
    const date    = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;

    return {
      date,
      channel:   dims[1]?.value    ?? 'Unknown',
      sessions:  Number(metrics[0]?.value ?? 0),
      users:     Number(metrics[1]?.value ?? 0),
      keyEvents: Number(metrics[2]?.value ?? 0),
    };
  });

  return { byDay };
}
