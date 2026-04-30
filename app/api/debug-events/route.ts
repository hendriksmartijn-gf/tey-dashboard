import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  const propertyId = process.env.GA4_PROPERTY_ID;

  const auth = new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
  const analytics = google.analyticsdata({ version: 'v1beta', auth });

  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics:    [{ name: 'eventCount' }],
      orderBys:   [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  });

  const events = (res.data.rows ?? []).map((r) => ({
    event: r.dimensionValues?.[0]?.value,
    count: r.metricValues?.[0]?.value,
  }));

  return NextResponse.json(events);
}
