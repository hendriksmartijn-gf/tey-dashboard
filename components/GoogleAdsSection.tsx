'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { GoogleAdsCampaignRow, GoogleAdsDayRow } from '@/lib/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const GOOGLE_COLOR = '#4285F4';
const CPA_COLOR    = '#EA4335';

const NETWORK_LABEL: Record<string, string> = {
  'SEARCH':          'Search',
  'DISPLAY':         'Display',
  'YOUTUBE':         'YouTube',
  'CROSS_NETWORK':   'Cross-network',
  'SMART':           'Smart',
  '(not set)':       'Overig',
  '(unknown)':       'Onbekend',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function GoogleAdsSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-5" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  campaigns: GoogleAdsCampaignRow[];
  byDay:     GoogleAdsDayRow[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GoogleAdsSection({ campaigns, byDay }: Props) {
  if (campaigns.length === 0 && byDay.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Geen Google Ads data beschikbaar. Controleer of de Google Ads koppeling actief is in GA4.
      </div>
    );
  }

  // Totals
  const totals = campaigns.reduce(
    (acc, c) => ({
      spend:       acc.spend       + c.spend,
      clicks:      acc.clicks      + c.clicks,
      impressions: acc.impressions + c.impressions,
      completions: acc.completions + c.completions,
    }),
    { spend: 0, clicks: 0, impressions: 0, completions: 0 }
  );
  const totalCpc = totals.clicks      > 0 ? totals.spend / totals.clicks      : 0;
  const totalCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const totalCpa = totals.completions > 0 ? totals.spend / totals.completions  : 0;

  // Trend data — spend + CPA per day
  const trendData = byDay.map((r) => ({
    date:  r.date.slice(5),
    spend: r.spend,
    cpa:   r.completions > 0 ? r.spend / r.completions : null,
  }));

  return (
    <div className="space-y-4">

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Budget (Google Ads)', value: fmtEur(totals.spend),        sub: 'Totaal gespendeerd' },
          { label: 'Clicks',             value: fmtNum(totals.clicks),        sub: `CPC: ${totalCpc > 0 ? fmtEur(totalCpc) : '—'}` },
          { label: 'CTR',                value: fmtPct(totalCtr),             sub: `${fmtNum(totals.impressions)} impressies` },
          { label: 'CPA (Google Ads)',   value: totalCpa > 0 ? fmtEur(totalCpa) : '—', sub: `${fmtNum(totals.completions)} sollicitaties` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Spend + CPA trend ── */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            Spend & CPA per dag
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 72, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                yAxisId="spend"
                orientation="left"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtEur(v)}
                width={72}
              />
              <YAxis
                yAxisId="cpa"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtEur(v)}
                width={72}
              />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [fmtEur(Number(v)), String(name)]}
                labelFormatter={(l) => String(l)}
              />
              <Legend />
              <Line yAxisId="spend" type="monotone" dataKey="spend" name="Spend"       stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="cpa"   type="monotone" dataKey="cpa"   name="CPA"         stroke={CPA_COLOR}    strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Campaign table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Campagnes — gesorteerd op spend
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left   text-xs font-semibold uppercase tracking-wider text-gray-400">Campagne</th>
                <th className="px-5 py-3 text-left   text-xs font-semibold uppercase tracking-wider text-gray-400">Netwerk</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Budget</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400">Clicks</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">CPC</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400">CTR</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">Sollicitaties</th>
                <th className="px-5 py-3 text-right  text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-800 font-medium max-w-xs truncate" title={c.campaign}>
                    {c.campaign}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {NETWORK_LABEL[c.network] ?? c.network}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtEur(c.spend)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{fmtNum(c.clicks)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{c.cpc > 0 ? fmtEur(c.cpc) : '—'}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{fmtPct(c.ctr)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{fmtNum(c.completions)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap">
                    {c.cpa > 0 ? fmtEur(c.cpa) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
