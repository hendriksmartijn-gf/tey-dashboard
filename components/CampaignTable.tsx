'use client';

import { useState } from 'react';
import type { CampaignRow, Platform } from '@/types/campaign';

interface Props {
  rows: CampaignRow[];
}

type SortKey = 'date' | 'campaign_name' | 'platform' | 'impressions' | 'clicks' | 'ctr' | 'spend' | 'conversions' | 'cpc';
type Direction = 'asc' | 'desc';

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR = '#1877F2';

const fmtNum  = (n: number) => n.toLocaleString('nl-NL');
const fmtEur  = (n: number) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtPct  = (n: number) => `${n.toFixed(2)}%`;

export function CampaignTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function CampaignTable({ rows }: Props) {
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [sortKey, setSortKey]   = useState<SortKey>('date');
  const [sortDir, setSortDir]   = useState<Direction>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filtered = platformFilter === 'all' ? rows : rows.filter((r) => r.platform === platformFilter);

  const sorted = [...filtered].sort((a, b) => {
    let va: number | string;
    let vb: number | string;

    switch (sortKey) {
      case 'ctr':
        va = a.impressions > 0 ? a.clicks / a.impressions : 0;
        vb = b.impressions > 0 ? b.clicks / b.impressions : 0;
        break;
      case 'cpc':
        va = a.clicks > 0 ? a.spend / a.clicks : 0;
        vb = b.clicks > 0 ? b.spend / b.clicks : 0;
        break;
      default:
        va = (a as unknown as Record<string, unknown>)[sortKey] as number | string;
        vb = (b as unknown as Record<string, unknown>)[sortKey] as number | string;
    }

    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-gray-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none whitespace-nowrap hover:text-gray-600 transition-colors"
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </th>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filter bar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Platform</span>
        {(['all', 'linkedin', 'meta'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              platformFilter === p
                ? p === 'linkedin'
                  ? 'bg-[#0077B5] text-white'
                  : p === 'meta'
                  ? 'bg-[#1877F2] text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{sorted.length} rows</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th col="platform"      label="Platform" />
              <Th col="campaign_name" label="Campaign" />
              <Th col="date"          label="Date" />
              <Th col="impressions"   label="Impressions" />
              <Th col="clicks"        label="Clicks" />
              <Th col="ctr"           label="CTR" />
              <Th col="spend"         label="Spend" />
              <Th col="conversions"   label="Conversions" />
              <Th col="cpc"           label="CPC" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">
                  No data
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => {
                const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
                const cpc = r.clicks > 0 ? r.spend / r.clicks : 0;
                const color = r.platform === 'linkedin' ? LINKEDIN_COLOR : META_COLOR;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-semibold"
                        style={{ background: color }}
                      >
                        {r.platform === 'linkedin' ? 'LI' : 'Meta'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-800 max-w-[200px] truncate" title={r.campaign_name}>
                      {r.campaign_name}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{fmtNum(r.impressions)}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{fmtNum(r.clicks)}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{fmtPct(ctr * 100)}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{fmtEur(r.spend)}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{fmtNum(r.conversions)}</td>
                    <td className="px-3 py-2.5 text-gray-800 tabular-nums">{cpc > 0 ? fmtEur(cpc) : '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
