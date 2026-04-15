'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CampaignRow } from '@/types/campaign';

interface Props {
  rows: CampaignRow[];
}

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR = '#1877F2';

export function SpendLineChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

export default function SpendLineChart({ rows }: Props) {
  // Aggregate spend per date per platform
  const byDate: Record<string, { date: string; linkedin: number; meta: number }> = {};

  for (const r of rows) {
    if (!r.date) continue;
    if (!byDate[r.date]) byDate[r.date] = { date: r.date, linkedin: 0, meta: 0 };
    byDate[r.date][r.platform] += r.spend;
  }

  const data = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No spend data available</p>
      </div>
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Spend over time
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(d) => d.slice(5)} // MM-DD
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={72} />
          <Tooltip
            formatter={(v) => fmt(Number(v ?? 0))}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="linkedin"
            name="LinkedIn"
            stroke={LINKEDIN_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="meta"
            name="Meta"
            stroke={META_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
