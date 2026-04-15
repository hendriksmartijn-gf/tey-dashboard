'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { CampaignRow, MetricKey } from '@/types/campaign';
import { METRICS, getMetricValue, sumRows } from '@/types/campaign';

interface Props { rows: CampaignRow[] }

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR     = '#1877F2';
const METRIC_KEYS    = Object.keys(METRICS) as MetricKey[];

function weekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

export function SpendLineChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-72 bg-gray-100 rounded" />
    </div>
  );
}

function MetricPicker({
  label, color, value, onChange, includeNone = false,
}: {
  label: string;
  color: string;
  value: MetricKey | null;
  onChange: (k: MetricKey | null) => void;
  includeNone?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest mr-1" style={{ color }}>
        {label}
      </span>
      {includeNone && (
        <button
          onClick={() => onChange(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            value === null ? 'text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          style={value === null ? { background: '#9ca3af' } : {}}
        >
          Geen
        </button>
      )}
      {METRIC_KEYS.map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            value === k ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          style={value === k ? { background: color } : {}}
        >
          {METRICS[k].label}
        </button>
      ))}
    </div>
  );
}

export default function SpendLineChart({ rows }: Props) {
  const [primary,   setPrimary]   = useState<MetricKey>('spend');
  const [secondary, setSecondary] = useState<MetricKey | null>(null);

  // Aggregate by week × platform
  const byWeek: Record<string, { li: CampaignRow[]; me: CampaignRow[] }> = {};
  for (const r of rows) {
    if (!r.date) continue;
    const wk = weekKey(r.date);
    if (!byWeek[wk]) byWeek[wk] = { li: [], me: [] };
    (r.platform === 'linkedin' ? byWeek[wk].li : byWeek[wk].me).push(r);
  }

  const data = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { li, me }]) => {
      const liTotals = sumRows(li);
      const meTotals = sumRows(me);
      const point: Record<string, unknown> = {
        date:              week,
        li_primary:        getMetricValue(liTotals, primary),
        me_primary:        getMetricValue(meTotals, primary),
      };
      if (secondary) {
        point.li_secondary = getMetricValue(liTotals, secondary);
        point.me_secondary = getMetricValue(meTotals, secondary);
      }
      return point;
    });

  const fmtPrimary   = METRICS[primary].format;
  const fmtSecondary = secondary ? METRICS[secondary].format : null;

  // Custom tooltip
  function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string; dataKey: string }[];
    label?: string;
  }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-[160px]">
        <p className="font-semibold text-gray-700 mb-2">w/v {String(label).slice(5)}</p>
        {payload.map((p) => {
          const isPrimary = p.dataKey.endsWith('_primary');
          const fmt = isPrimary ? fmtPrimary : (fmtSecondary ?? fmtPrimary);
          return (
            <div key={p.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="font-semibold tabular-nums">{fmt(p.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const hasSecondary = secondary !== null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Pickers */}
      <div className="space-y-2 mb-5">
        <MetricPicker label="Primair" color="#374151" value={primary} onChange={(k) => k && setPrimary(k)} />
        <MetricPicker label="Secundair" color="#9ca3af" value={secondary} onChange={setSecondary} includeNone />
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Geen data beschikbaar
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 4, right: hasSecondary ? 72 : 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => `w/v ${String(d).slice(5)}`} />

            {/* Left axis — primary */}
            <YAxis
              yAxisId="primary"
              orientation="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => fmtPrimary(v)}
              width={72}
            />

            {/* Right axis — secondary (only when active) */}
            {hasSecondary && fmtSecondary && (
              <YAxis
                yAxisId="secondary"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtSecondary(v)}
                width={72}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Primary lines — solid */}
            <Line yAxisId="primary" type="monotone" dataKey="li_primary" name={`LinkedIn — ${METRICS[primary].label}`}
              stroke={LINKEDIN_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="primary" type="monotone" dataKey="me_primary" name={`Meta — ${METRICS[primary].label}`}
              stroke={META_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />

            {/* Secondary lines — dashed */}
            {hasSecondary && secondary && (
              <>
                <Line yAxisId="secondary" type="monotone" dataKey="li_secondary"
                  name={`LinkedIn — ${METRICS[secondary].label}`}
                  stroke={LINKEDIN_COLOR} strokeWidth={1.5} strokeDasharray="5 3"
                  dot={false} activeDot={{ r: 3 }} />
                <Line yAxisId="secondary" type="monotone" dataKey="me_secondary"
                  name={`Meta — ${METRICS[secondary].label}`}
                  stroke={META_COLOR} strokeWidth={1.5} strokeDasharray="5 3"
                  dot={false} activeDot={{ r: 3 }} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
