import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns } from '@/lib/sheets';
import type { Platform } from '@/types/campaign';

export const revalidate = 3600; // Next.js route cache

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const platform = searchParams.get('platform') ?? 'all'; // 'linkedin' | 'meta' | 'all'
    const dateFrom  = searchParams.get('dateFrom');
    const dateTo    = searchParams.get('dateTo');

    let rows = await getCampaigns();

    if (platform !== 'all') {
      rows = rows.filter((r) => r.platform === (platform as Platform));
    }

    if (dateFrom) {
      rows = rows.filter((r) => r.date >= dateFrom);
    }

    if (dateTo) {
      rows = rows.filter((r) => r.date <= dateTo);
    }

    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
