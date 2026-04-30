import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsRows } from '@/lib/analytics';
import type { CampaignRow } from '@/types/campaign';

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('dateFrom') ?? '90daysAgo';
    const endDate   = searchParams.get('dateTo')   ?? 'today';

    const rows = await getGoogleAdsRows(startDate, endDate);

    const campaignRows: CampaignRow[] = rows.map((r) => ({
      platform:      'google',
      campaign_name: r.campaign,
      date:          r.date,
      spend:         r.spend,
      clicks:        r.clicks,
      impressions:   r.impressions,
      conversions:   r.completions,
      reach:         0,
      thruplays:     0,
    }));

    return NextResponse.json(campaignRows);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
