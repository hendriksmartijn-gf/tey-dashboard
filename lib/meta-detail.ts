import { getRawSheetData } from './sheets';

export interface MetaDetailRow {
  date: string;
  campaign_name: string;
  platform: string;
  spend: number;
  clicks: number;
  impressions: number;
  cpc_sheet: number;
  ctr_sheet: number;
  conversions: number;
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '.').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export async function getMetaDetailRows(): Promise<MetaDetailRow[]> {
  const { meta } = await getRawSheetData();

  if (meta.length === 0) return [];

  console.log('[meta-detail] headers:', ...meta[0]);

  return meta.slice(1).flatMap((row): MetaDetailRow[] => {
    const date = String(row[1] ?? '').trim();
    if (!date) return [];
    return [{
      date,
      campaign_name: String(row[4]  ?? '').trim(),
      platform:      String(row[2]  ?? '').trim(),
      spend:         toNum(row[6]),
      clicks:        toNum(row[9]),
      impressions:   toNum(row[11]),
      cpc_sheet:     toNum(row[7]),
      ctr_sheet:     toNum(row[5]),
      conversions:   toNum(row[19]),
    }];
  });
}
