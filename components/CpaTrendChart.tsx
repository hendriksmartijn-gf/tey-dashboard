'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { CampaignRow } from '@/types/campaign';

interface Props { rows: CampaignRow[] }

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR     = '#1877F2';
const GOOGLE_COLOR   = '#F59E0B';

const fmtEur = (v: number) =>
  v.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2">{String(label)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CpaTrendChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-5" />
      <div className="h-56 bg-gray-100 rounded" />
    </div>
  );
}

export default function CpaTrendChart({ rows }: Props) {
  // Aggregate by date × platform
  const byDate: Record<string, { li_spend: number; li_conv: number; me_spend: number; me_conv: number; go_spend: number; go_conv: number }> = {};

  for (const r of rows) {
    if (!r.date) continue;
    if (!byDate[r.date]) byDate[r.date] = { li_spend: 0, li_conv: 0, me_spend: 0, me_conv: 0, go_spend: 0, go_conv: 0 };
    if (r.platform === 'linkedin') {
      byDate[r.date].li_spend += r.spend;
      byDate[r.date].li_conv  += r.conversions;
    } else if (r.platform === 'meta') {
      byDate[r.date].me_spend += r.spend;
      byDate[r.date].me_conv  += r.conversions;
    } else {
      byDate[r.date].go_spend += r.spend;
      byDate[r.date].go_conv  += r.conversions;
    }
  }

  const data = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      LinkedIn:    v.li_conv > 0 ? v.li_spend / v.li_conv : null,
      Meta:        v.me_conv > 0 ? v.me_spend / v.me_conv : null,
      'Google Ads': v.go_conv > 0 ? v.go_spend / v.go_conv : null,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
        Geen trenddata beschikbaar
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
        Kosten per sollicitant — over tijd
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(d) => String(d).slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={fmtEur}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="LinkedIn"
            stroke={LINKEDIN_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="Meta"
            stroke={META_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="Google Ads"
            stroke={GOOGLE_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
