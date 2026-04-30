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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="divide-y divide-gray-50">
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
        Geen campagnedata beschikbaar
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Campagne ranking — gesorteerd op kosten per sollicitant
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-10">#</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Campagne</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Platform</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Budget</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Clicks</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Kosten/klik</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Sollicitanten</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Kosten/soll.</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-36">Budgetaandeel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaigns.map((c) => {
              const color = PLATFORM_COLOR[c.platform];
              const isTop = c.rank === 1 && c.cpa !== Infinity;
              return (
                <tr key={`${c.platform}-${c.campaign_name}`} className={`hover:bg-gray-50 transition-colors ${isTop ? 'bg-green-50/40' : ''}`}>
                  {/* Rank */}
                  <td className="px-5 py-3.5 text-xs font-bold text-gray-300">{c.rank}</td>

                  {/* Campaign name */}
                  <td className="px-5 py-3.5 text-gray-800 font-medium max-w-xs truncate" title={c.campaign_name}>
                    {c.campaign_name}
                  </td>

                  {/* Platform badge */}
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-white text-xs font-semibold whitespace-nowrap"
                      style={{ background: color }}
                    >
                      {PLATFORM_LABEL[c.platform]}
                    </span>
                  </td>

                  {/* Spend */}
                  <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums whitespace-nowrap">
                    {fmtEur(c.spend)}
                  </td>

                  {/* Clicks */}
                  <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums">
                    {fmtNum(c.clicks)}
                  </td>

                  {/* CPC */}
                  <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums whitespace-nowrap">
                    {c.cpc !== Infinity ? fmtEur(c.cpc) : '—'}
                  </td>

                  {/* Applicants */}
                  <td className="px-5 py-3.5 text-right text-gray-700 tabular-nums">
                    {fmtNum(c.applicants)}
                  </td>

                  {/* CPA */}
                  <td className={`px-5 py-3.5 text-right tabular-nums font-semibold whitespace-nowrap ${isTop ? 'text-green-700' : 'text-gray-900'}`}>
                    {c.cpa !== Infinity ? fmtEur(c.cpa) : '—'}
                  </td>

                  {/* Budget share bar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(c.budgetShare * 100).toFixed(1)}%`, background: color }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right tabular-nums">
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
