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
  source: string;
  medium: string;
  completions: number;
}

export interface ConversionByCampaign {
  campaign: string;
  source: string;
  completions: number;
}

export interface GoogleAdsCampaignRow {
  campaign:    string;
  network:     string; // Search, Display, YouTube, etc.
  spend:       number; // advertiserAdCost (EUR)
  clicks:      number;
  impressions: number;
  completions: number; // Sollicitatie_voltooid_recruitee
  cpc:         number;
  ctr:         number;
  cpa:         number;
}

export interface GoogleAdsDayRow {
  date:        string;
  spend:       number;
  clicks:      number;
  impressions: number;
  completions: number;
}

export interface AnalyticsSummary {
  byDay:                 AnalyticsDayRow[];
  conversionsBySource:   ConversionBySource[];
  conversionsByCampaign: ConversionByCampaign[];
  googleAds: {
    campaigns: GoogleAdsCampaignRow[];
    byDay:     GoogleAdsDayRow[];
  };
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

  const [sessionRes, sourceRes, campaignRes, adsRes, adsDayRes] = await Promise.all([

    // 1. Sessions + key events by date × channel
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGrouping' }],
        metrics:    [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys:   [{ dimension: { dimensionName: 'date' }, desc: false }],
      },
    }),

    // 2. Recruitee completions by source + medium
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics:    [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: CONVERSION_EVENT } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }),

    // 3. Recruitee completions by UTM campaign + source
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionCampaignName' }, { name: 'sessionSource' }],
        metrics:    [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: CONVERSION_EVENT } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }),

    // 4. Google Ads — campaign level (cost, clicks, impressions + conversions)
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [
          { name: 'sessionGoogleAdsCampaignName' },
          { name: 'sessionGoogleAdsAdNetworkType' },
        ],
        metrics: [
          { name: 'advertiserAdCost' },
          { name: 'advertiserAdClicks' },
          { name: 'advertiserAdImpressions' },
          { name: 'keyEvents' },
        ],
        dimensionFilter: {
          // Only rows where a Google Ads campaign name is set
          filter: {
            fieldName:    'sessionGoogleAdsCampaignName',
            stringFilter: { matchType: 'PARTIAL_REGEXP', value: '.' },
          },
        },
        orderBys: [{ metric: { metricName: 'advertiserAdCost' }, desc: true }],
      },
    }).catch(() => ({ data: { rows: [] } })), // graceful fallback if Ads not linked

    // 5. Google Ads — daily trend
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'advertiserAdCost' },
          { name: 'advertiserAdClicks' },
          { name: 'advertiserAdImpressions' },
          { name: 'keyEvents' },
        ],
        dimensionFilter: {
          filter: {
            fieldName:    'sessionGoogleAdsCampaignName',
            stringFilter: { matchType: 'PARTIAL_REGEXP', value: '.' },
          },
        },
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      },
    }).catch(() => ({ data: { rows: [] } })),
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

  // ── Parse Recruitee completions by source ───────────────────────────────────
  const conversionsBySource: ConversionBySource[] = (sourceRes.data.rows ?? [])
    .map((row) => ({
      source:      row.dimensionValues?.[0]?.value ?? 'unknown',
      medium:      row.dimensionValues?.[1]?.value ?? 'unknown',
      completions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    .filter((r) => r.completions > 0);

  // ── Parse Recruitee completions by UTM campaign ─────────────────────────────
  const conversionsByCampaign: ConversionByCampaign[] = (campaignRes.data.rows ?? [])
    .map((row) => ({
      campaign:    row.dimensionValues?.[0]?.value ?? '(not set)',
      source:      row.dimensionValues?.[1]?.value ?? 'unknown',
      completions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
    .filter((r) => r.completions > 0 && r.campaign !== '(not set)');

  // ── Parse Google Ads campaigns ──────────────────────────────────────────────
  const adsCampaigns: GoogleAdsCampaignRow[] = (adsRes.data.rows ?? [])
    .map((row) => {
      const dims    = row.dimensionValues ?? [];
      const metrics = row.metricValues   ?? [];
      const spend       = Number(metrics[0]?.value ?? 0);
      const clicks      = Number(metrics[1]?.value ?? 0);
      const impressions = Number(metrics[2]?.value ?? 0);
      const completions = Number(metrics[3]?.value ?? 0);
      return {
        campaign:    dims[0]?.value ?? '(unknown)',
        network:     dims[1]?.value ?? '(unknown)',
        spend,
        clicks,
        impressions,
        completions,
        cpc: clicks      > 0 ? spend / clicks      : 0,
        ctr: impressions > 0 ? clicks / impressions : 0,
        cpa: completions > 0 ? spend / completions  : 0,
      };
    })
    .filter((r) => r.spend > 0 || r.clicks > 0);

  // ── Parse Google Ads daily trend ────────────────────────────────────────────
  const adsByDay: GoogleAdsDayRow[] = (adsDayRes.data.rows ?? [])
    .map((row) => {
      const dims    = row.dimensionValues ?? [];
      const metrics = row.metricValues   ?? [];
      const rawDate = dims[0]?.value ?? '';
      const date    = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;
      return {
        date,
        spend:       Number(metrics[0]?.value ?? 0),
        clicks:      Number(metrics[1]?.value ?? 0),
        impressions: Number(metrics[2]?.value ?? 0),
        completions: Number(metrics[3]?.value ?? 0),
      };
    });

  return {
    byDay,
    conversionsBySource,
    conversionsByCampaign,
    googleAds: { campaigns: adsCampaigns, byDay: adsByDay },
  };
}
