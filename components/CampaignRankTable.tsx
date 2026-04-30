'use client';

import type { CampaignRow, Platform } from '@/types/campaign';

interface CampaignSummary {
  rank: number;
  platform: Platform;
  campaign_name: string;
  spend: number;
  applicants: number;
  clicks: number;
  cpa: number;
  cpc: number;
  budgetShare: number; // 0-1
}

interface Props {
  rows: CampaignRow[];
}

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');

const PLATFORM_COLOR: Record<Platform, string> = {
  linkedin: '#0077B5',
  meta:     '#1877F2',
  google:   '#4285F4',
};
const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  meta:     'Meta',
  google:   'Google',
};

export function CampaignRankTableSkeleton() {
  return (
    <div className="bg-white overflow-hidden animate-pulse" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #DCE0E6' }}>
        <div className="h-2.5 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="divide-y" style={{ borderColor: '#F0F4F8' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-6" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CampaignRankTable({ rows }: Props) {
  // Aggregate by platform + campaign name
  const map = new Map<string, { platform: Platform; spend: number; applicants: number; clicks: number; impressions: number }>();
  for (const r of rows) {
    const key = `${r.platform}::${r.campaign_name}`;
    const cur = map.get(key) ?? { platform: r.platform, spend: 0, applicants: 0, clicks: 0, impressions: 0 };
    cur.spend       += r.spend;
    cur.applicants  += r.conversions;
    cur.clicks      += r.clicks;
    cur.impressions += r.impressions;
    map.set(key, cur);
  }

  const totalSpend = Array.from(map.values()).reduce((s, v) => s + v.spend, 0);

  const campaigns: CampaignSummary[] = Array.from(map.entries())
    .map(([key, v]) => ({
      rank: 0,
      platform: v.platform,
      campaign_name: key.split('::')[1],
      spend:       v.spend,
      applicants:  v.applicants,
      clicks:      v.clicks,
      cpa:         v.applicants > 0 ? v.spend / v.applicants : Infinity,
      cpc:         v.clicks     > 0 ? v.spend / v.clicks     : Infinity,
      budgetShare: totalSpend > 0 ? v.spend / totalSpend : 0,
    }))
    .sort((a, b) => a.cpa - b.cpa)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  if (campaigns.length === 0) {
    return (
      <div className="bg-white p-8 text-center text-sm" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', color: '#8C9BAF' }}>
        Geen campagnedata beschikbaar
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #DCE0E6' }}>
        <span className="gf-eyebrow">Campagne ranking — gesorteerd op kosten per sollicitant</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: '#F0F4F8' }}>
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider w-10" style={{ color: '#8C9BAF' }}>#</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8C9BAF' }}>Campagne</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Platform</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Budget</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Clicks</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Kosten/klik</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Sollicitanten</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Kosten/soll.</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider w-36" style={{ color: '#8C9BAF' }}>Budgetaandeel</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const color = PLATFORM_COLOR[c.platform];
              const isTop = c.rank === 1 && c.cpa !== Infinity;
              return (
                <tr
                  key={`${c.platform}-${c.campaign_name}`}
                  style={{
                    borderBottom: '1px solid #F0F4F8',
                    background: isTop ? 'rgba(99,49,244,0.03)' : undefined,
                  }}
                  className="transition-colors hover:bg-[#F0F4F8]/60"
                >
                  {/* Rank */}
                  <td className="px-5 py-3.5 text-xs font-bold tabular-nums" style={{ color: '#BCC4CF' }}>{c.rank}</td>

                  {/* Campaign name */}
                  <td className="px-5 py-3.5 font-medium max-w-xs truncate" title={c.campaign_name} style={{ color: '#12101F' }}>
                    {c.campaign_name}
                  </td>

                  {/* Platform badge */}
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block px-2 py-0.5 text-white text-xs font-bold whitespace-nowrap"
                      style={{ background: color, borderRadius: '4px' }}
                    >
                      {PLATFORM_LABEL[c.platform]}
                    </span>
                  </td>

                  {/* Spend */}
                  <td className="px-5 py-3.5 text-right tabular-nums whitespace-nowrap" style={{ color: '#555E6C' }}>
                    {fmtEur(c.spend)}
                  </td>

                  {/* Clicks */}
                  <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: '#555E6C' }}>
                    {fmtNum(c.clicks)}
                  </td>

                  {/* CPC */}
                  <td className="px-5 py-3.5 text-right tabular-nums whitespace-nowrap" style={{ color: '#555E6C' }}>
                    {c.cpc !== Infinity ? fmtEur(c.cpc) : '—'}
                  </td>

                  {/* Applicants */}
                  <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: '#555E6C' }}>
                    {fmtNum(c.applicants)}
                  </td>

                  {/* CPA */}
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold whitespace-nowrap" style={{ color: isTop ? '#6331F4' : '#12101F' }}>
                    {c.cpa !== Infinity ? fmtEur(c.cpa) : '—'}
                  </td>

                  {/* Budget share bar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 min-w-[60px]" style={{ background: '#F0F4F8', borderRadius: '99px' }}>
                        <div
                          className="h-1.5"
                          style={{ width: `${(c.budgetShare * 100).toFixed(1)}%`, background: color, borderRadius: '99px' }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right tabular-nums" style={{ color: '#8C9BAF' }}>
                        {(c.budgetShare * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
