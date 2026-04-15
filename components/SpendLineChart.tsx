'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { CampaignRow, MetricKey } from '@/types/campaign';
import { METRICS, getMetricValue, sumRows } from '@/types/campaign';

interface Props { rows: CampaignRow[] }

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR     = '#1877F2';
const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

export function SpendLineChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

export default function SpendLineChart({ rows }: Props) {
  const [metric, setMetric] = useState<MetricKey>('spend');
  const { format } = METRICS[metric];

  // Get Monday of the ISO week for a YYYY-MM-DD string
  function weekKey(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getUTCDay(); // 0=Sun, 1=Mon…
    const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD of Monday
  }

  // Aggregate by week × platform
  const byWeek: Record<string, { li: CampaignRow[]; me: CampaignRow[] }> = {};
  for (const r of rows) {
    if (!r.date) continue;
    const wk = weekKey(r.date);
    if (!byWeek[wk]) byWeek[wk] = { li: [], me: [] };
    if (r.platform === 'linkedin') byWeek[wk].li.push(r);
    else                           byWeek[wk].me.push(r);
  }

  const data = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { li, me }]) => ({
      date: week,
      linkedin: getMetricValue(sumRows(li), metric),
      meta:     getMetricValue(sumRows(me), metric),
    }));

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
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => `w/v ${d.slice(5)}`} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => format(v)} width={72} />
            <Tooltip
              formatter={(v) => format(Number(v ?? 0))}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend />
            <Line type="monotone" dataKey="linkedin" name="LinkedIn" stroke={LINKEDIN_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="meta"     name="Meta"     stroke={META_COLOR}     strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
