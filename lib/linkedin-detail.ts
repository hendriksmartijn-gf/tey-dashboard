import { getRawSheetData } from './sheets';

export interface LinkedInDetailRow {
  date: string;
  campaign_id: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '.').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export async function getLinkedInDetailRows(): Promise<LinkedInDetailRow[]> {
  const { linkedin } = await getRawSheetData();

  if (linkedin.length === 0) return [];

  console.log('[linkedin-detail] headers:', ...linkedin[0]);

  return linkedin.slice(1).flatMap((row): LinkedInDetailRow[] => {
    const date = String(row[2] ?? '').trim();
    if (!date) return [];
    return [{
      date,
      campaign_id: String(row[3] ?? '').trim(),
      spend:       toNum(row[5]),
      clicks:      toNum(row[6]),
      conversions: toNum(row[7]),
      impressions: toNum(row[9]),
    }];
  });
}
