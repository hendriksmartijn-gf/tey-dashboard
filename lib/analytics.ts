import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const CONVERSION_EVENT = 'Sollicitatie_voltooid_recruitee';

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
  date: string;
  channel: string;
  sessions: number;
  users: number;
  keyEvents: number;
}

export interface ConversionBySource {
  source: string;   // e.g. 'linkedin.com', 'facebook'
  medium: string;   // e.g. 'cpc', 'paid-social'
  completions: number;
}

export interface ConversionByCampaign {
  campaign: string; // utm_campaign value
  source: string;
  completions: number;
}

export interface AnalyticsSummary {
  byDay: AnalyticsDayRow[];
  conversionsBySource: ConversionBySource[];
  conversionsByCampaign: ConversionByCampaign[];
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function getAnalyticsData(
  startDate = '90daysAgo',
  endDate   = 'today',
): Promise<AnalyticsSummary> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error('Missing GA4_PROPERTY_ID env var');

  const analytics  = getAnalyticsClient();
  const property   = `properties/${propertyId}`;
  const dateRanges = [{ startDate, endDate }];

  // Run all 3 queries in parallel
  const [sessionRes, sourceRes, campaignRes] = await Promise.all([

    // 1. Sessions + key events by date × channel (existing)
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGrouping' }],
        metrics:    [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys:   [{ dimension: { dimensionName: 'date' }, desc: false }],
      },
    }),

    // 2. Sollicitatie_voltooid_recruitee by source + medium
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics:    [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName:    'eventName',
            stringFilter: { matchType: 'EXACT', value: CONVERSION_EVENT },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }),

    // 3. Sollicitatie_voltooid_recruitee by campaign + source
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionCampaignName' }, { name: 'sessionSource' }],
        metrics:    [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName:    'eventName',
            stringFilter: { matchType: 'EXACT', value: CONVERSION_EVENT },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }),
  ]);

  // ── Parse sessions by day ───────────────────────────────────────────────────
  const byDay: AnalyticsDayRow[] = (sessionRes.data.rows ?? []).map((row) => {
    const dims    = row.dimensionValues ?? [];
    const metrics = row.metricValues   ?? [];
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

  // ── Parse completions by source ─────────────────────────────────────────────
  const conversionsBySource: ConversionBySource[] = (sourceRes.data.rows ?? [])
    .map((row) => ({
      source:      row.dimensionValues?.[0]?.value ?? 'unknown',
      medium:      row.dimensionValues?.[1]?.value ?? 'unknown',
      completions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    .filter((r) => r.completions > 0);

  // ── Parse completions by campaign ───────────────────────────────────────────
  const conversionsByCampaign: ConversionByCampaign[] = (campaignRes.data.rows ?? [])
    .map((row) => ({
      campaign:    row.dimensionValues?.[0]?.value ?? '(not set)',
      source:      row.dimensionValues?.[1]?.value ?? 'unknown',
      completions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    .filter((r) => r.completions > 0 && r.campaign !== '(not set)');

  return { byDay, conversionsBySource, conversionsByCampaign };
}
