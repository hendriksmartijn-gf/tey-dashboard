export type Platform = 'linkedin' | 'meta';

export interface CampaignRow {
  platform: Platform;
  campaign_name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  date: string; // ISO date string YYYY-MM-DD
}
