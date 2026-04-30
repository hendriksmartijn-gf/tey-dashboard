import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/analytics';

export const revalidate = 3600; // cache 1 hour

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('startDate') ?? '90daysAgo';
    const endDate   = searchParams.get('endDate')   ?? 'today';

    const data = await getAnalyticsData(startDate, endDate);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
