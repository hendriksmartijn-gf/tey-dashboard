'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { CampaignRow } from '@/types/campaign';

interface Props {
  rows: CampaignRow[];
}

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR = '#1877F2';

export function ImpressionsBarChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

export default function ImpressionsBarChart({ rows }: Props) {
  // Sum impressions per campaign name across all dates
  const byName: Record<string, { campaign_name: string; impressions: number; platform: string }> = {};

  for (const r of rows) {
    if (!byName[r.campaign_name]) {
      byName[r.campaign_name] = { campaign_name: r.campaign_name, impressions: 0, platform: r.platform };
    }
    byName[r.campaign_name].impressions += r.impressions;
  }

  const data = Object.values(byName)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No impressions data available</p>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString('nl-NL');
  const truncate = (s: string, n = 24) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Impressions — top 10 campaigns
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmt} />
          <YAxis
            type="category"
            dataKey="campaign_name"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => truncate(v)}
            width={140}
          />
          <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
          <Bar dataKey="impressions" name="Impressions" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.platform === 'linkedin' ? LINKEDIN_COLOR : META_COLOR}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Platform legend */}
      <div className="flex gap-4 mt-3 justify-end">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: LINKEDIN_COLOR }} />
          LinkedIn
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: META_COLOR }} />
          Meta
        </span>
      </div>
    </div>
  );
}
