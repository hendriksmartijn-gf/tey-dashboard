'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import type { CampaignRow, MetricKey } from '@/types/campaign';
import { METRICS, getMetricValue, sumRows } from '@/types/campaign';

interface Props { rows: CampaignRow[] }

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR     = '#1877F2';
const METRIC_KEYS    = Object.keys(METRICS) as MetricKey[];

export function ImpressionsBarChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

export default function ImpressionsBarChart({ rows }: Props) {
  const [metric, setMetric] = useState<MetricKey>('impressions');
  const { format } = METRICS[metric];

  // Aggregate by campaign name
  const byCampaign: Record<string, { name: string; platform: 'linkedin' | 'meta'; rows: CampaignRow[] }> = {};
  for (const r of rows) {
    if (!byCampaign[r.campaign_name]) {
      byCampaign[r.campaign_name] = { name: r.campaign_name, platform: r.platform, rows: [] };
    }
    byCampaign[r.campaign_name].rows.push(r);
  }

  const data = Object.values(byCampaign)
    .map((c) => ({ name: c.name, platform: c.platform, value: getMetricValue(sumRows(c.rows), metric) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const truncate = (s: string, n = 28) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Metric picker */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {METRIC_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              metric === k ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {METRICS[k].label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Geen data beschikbaar
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => format(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickFormatter={truncate} width={148} />
              <Tooltip formatter={(v) => format(Number(v ?? 0))} />
              <Bar dataKey="value" name={METRICS[metric].label} radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.platform === 'linkedin' ? LINKEDIN_COLOR : META_COLOR} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-end">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: LINKEDIN_COLOR }} /> LinkedIn
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: META_COLOR }} /> Meta
            </span>
          </div>
        </>
      )}
    </div>
  );
}
