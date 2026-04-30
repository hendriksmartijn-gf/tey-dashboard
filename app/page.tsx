'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import KpiCard, { KpiCardSkeleton } from '@/components/KpiCard';
import ChannelCard, { ChannelCardSkeleton } from '@/components/ChannelCard';
import CampaignRankTable, { CampaignRankTableSkeleton } from '@/components/CampaignRankTable';
import CpaTrendChart, { CpaTrendChartSkeleton } from '@/components/CpaTrendChart';
import AnalyticsSection from '@/components/AnalyticsSection';
import type { CampaignRow, Platform } from '@/types/campaign';
import { sumRows } from '@/types/campaign';

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const PLATFORM_COLOR: Record<Platform, string> = {
  linkedin: '#0077B5',
  meta:     '#1877F2',
};
const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  meta:     'Meta',
};

// ── Channel comparison table ─────────────────────────────────────────────────

interface CompareRowProps {
  label: string;
  liValue: string;
  meValue: string;
  liRaw: number;
  meRaw: number;
  lowerIsBetter?: boolean;
  neutral?: boolean;
}

function CompareRow({ label, liValue, meValue, liRaw, meRaw, lowerIsBetter = false, neutral = false }: CompareRowProps) {
  const liWins = !neutral && (lowerIsBetter ? liRaw < meRaw : liRaw > meRaw) && liRaw !== meRaw;
  const meWins = !neutral && (lowerIsBetter ? meRaw < liRaw : meRaw > liRaw) && liRaw !== meRaw;
  const diffPct = liRaw > 0 ? ((meRaw - liRaw) / liRaw) * 100 : null;

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-3 px-4 text-xs text-gray-500 font-medium w-40">{label}</td>
      <td className={`py-3 px-4 text-sm tabular-nums font-semibold ${liWins ? 'text-green-700' : 'text-gray-800'}`}>
        {liWins && <span className="mr-1 text-green-500">✓</span>}
        {liValue}
      </td>
      <td className={`py-3 px-4 text-sm tabular-nums font-semibold ${meWins ? 'text-green-700' : 'text-gray-800'}`}>
        {meWins && <span className="mr-1 text-green-500">✓</span>}
        {meValue}
      </td>
      <td className="py-3 px-4 text-xs text-gray-400 text-right tabular-nums">
        {!neutral && diffPct !== null && liRaw !== meRaw && (
          <span className={diffPct > 0 === !lowerIsBetter ? 'text-green-600' : 'text-red-400'}>
            Meta {diffPct > 0 ? '+' : ''}{diffPct.toFixed(0)}%
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Campaign spotlight card ──────────────────────────────────────────────────

interface SpotlightCardProps {
  badge: string;
  badgeColor: string;
  title: string;
  campaignName: string;
  platform: Platform;
  metric: string;
  metricLabel: string;
}

function SpotlightCard({ badge, badgeColor, title, campaignName, platform, metric, metricLabel }: SpotlightCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{badge}</span>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: badgeColor }}>{title}</span>
      </div>
      <p className="text-base font-bold text-gray-900 leading-snug mb-2 truncate" title={campaignName}>
        {campaignName}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ background: PLATFORM_COLOR[platform] }}
        >
          {PLATFORM_LABEL[platform]}
        </span>
        <span className="text-xs text-gray-400">
          {metricLabel}: <span className="font-semibold text-gray-700">{metric}</span>
        </span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [rows,    setRows]    = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setRows(await res.json() as CampaignRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Date-filtered rows
  const filtered = useMemo(() =>
    rows.filter((r) =>
      (!dateFrom || r.date >= dateFrom) &&
      (!dateTo   || r.date <= dateTo)
    ),
    [rows, dateFrom, dateTo]
  );

  // Overall totals
  const totals   = useMemo(() => sumRows(filtered), [filtered]);
  const overallCpa = totals.conversions > 0 ? totals.spend / totals.conversions : null;

  // Per-channel totals
  const liTotals = useMemo(() => sumRows(filtered.filter((r) => r.platform === 'linkedin')), [filtered]);
  const meTotals = useMemo(() => sumRows(filtered.filter((r) => r.platform === 'meta')),     [filtered]);
  const liCpa    = liTotals.conversions > 0 ? liTotals.spend / liTotals.conversions : null;
  const meCpa    = meTotals.conversions > 0 ? meTotals.spend / meTotals.conversions : null;
  const liCtr    = liTotals.impressions > 0 ? liTotals.clicks / liTotals.impressions : 0;
  const meCtr    = meTotals.impressions > 0 ? meTotals.clicks / meTotals.impressions : 0;
  const liCpc    = liTotals.clicks > 0 ? liTotals.spend / liTotals.clicks : 0;
  const meCpc    = meTotals.clicks > 0 ? meTotals.spend / meTotals.clicks : 0;
  const liWins   = liCpa !== null && meCpa !== null && liCpa <= meCpa;
  const meWins   = liCpa !== null && meCpa !== null && meCpa < liCpa;
  const bestChannel =
    liCpa !== null && meCpa !== null
      ? liCpa <= meCpa ? 'LinkedIn' : 'Meta'
      : liCpa !== null ? 'LinkedIn'
      : meCpa !== null ? 'Meta'
      : '—';

  // Campaign-level aggregation (for spotlight)
  const campaignSummaries = useMemo(() => {
    const map = new Map<string, { platform: Platform; spend: number; applicants: number; clicks: number; impressions: number }>();
    for (const r of filtered) {
      const key = `${r.platform}::${r.campaign_name}`;
      const cur = map.get(key) ?? { platform: r.platform, spend: 0, applicants: 0, clicks: 0, impressions: 0 };
      cur.spend       += r.spend;
      cur.applicants  += r.conversions;
      cur.clicks      += r.clicks;
      cur.impressions += r.impressions;
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([key, v]) => ({
      campaign_name: key.split('::')[1],
      platform:      v.platform,
      spend:         v.spend,
      applicants:    v.applicants,
      clicks:        v.clicks,
      cpa:           v.applicants > 0 ? v.spend / v.applicants : Infinity,
      cpc:           v.clicks     > 0 ? v.spend / v.clicks     : Infinity,
    }));
  }, [filtered]);

  const bestCpaCampaign  = useMemo(() =>
    [...campaignSummaries].filter((c) => c.applicants > 0).sort((a, b) => a.cpa - b.cpa)[0] ?? null,
    [campaignSummaries]
  );
  const bestCpcCampaign  = useMemo(() =>
    [...campaignSummaries].filter((c) => c.clicks > 0).sort((a, b) => a.cpc - b.cpc)[0] ?? null,
    [campaignSummaries]
  );

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900 tracking-tight">Recruitment Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              LinkedIn · Meta
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs font-semibold text-gray-400 hover:text-gray-900 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Laden…' : 'Vernieuwen'}
          </button>
        </div>
      </header>

      {/* ── Date filter ── */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-10">
        <div className="max-w-[1280px] mx-auto px-6 h-12 flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Periode</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <span className="text-xs text-gray-400">t/m</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Wis filter
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-500 text-lg leading-none">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Fout bij laden</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <button onClick={fetchData} className="mt-2 text-xs font-semibold text-red-700 underline hover:no-underline">
                Opnieuw proberen
              </button>
            </div>
          </div>
        )}

        {/* ── Top KPIs ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Totaaloverzicht</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard title="Budget gespendeerd"   value={fmtEur(totals.spend)}                                    subtitle="LinkedIn + Meta" />
                <KpiCard title="Totaal sollicitanten" value={fmtNum(totals.conversions)}                               subtitle="Alle kanalen" />
                <KpiCard title="Kosten per sollicitant" value={overallCpa !== null ? fmtEur(overallCpa) : '—'}         subtitle="Spend ÷ sollicitanten" />
                <KpiCard
                  title="Beste kanaal"
                  value={bestChannel}
                  subtitle={
                    bestChannel !== '—'
                      ? `Laagste CPA: ${bestChannel === 'LinkedIn' && liCpa !== null ? fmtEur(liCpa) : meCpa !== null ? fmtEur(meCpa) : '—'}`
                      : 'Geen conversiedata'
                  }
                />
              </>
            )}
          </div>
        </section>

        {/* ── Channel comparison ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Kanaalvergelijking</h2>

          {/* Channel cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {loading ? (
              <><ChannelCardSkeleton /><ChannelCardSkeleton /></>
            ) : (
              <>
                <ChannelCard platform="linkedin" spend={liTotals.spend} applicants={liTotals.conversions} clicks={liTotals.clicks} impressions={liTotals.impressions} isWinner={liWins} />
                <ChannelCard platform="meta"     spend={meTotals.spend} applicants={meTotals.conversions} clicks={meTotals.clicks} impressions={meTotals.impressions} isWinner={meWins} />
              </>
            )}
          </div>

          {/* Metric-by-metric comparison table */}
          {!loading && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-40">Metric</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-[#0077B5]">LinkedIn</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-[#1877F2]">Meta</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Verschil</th>
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Budget"          liValue={fmtEur(liTotals.spend)}         meValue={fmtEur(meTotals.spend)}         liRaw={liTotals.spend}       meRaw={meTotals.spend}       neutral />
                  <CompareRow label="Impressies"       liValue={fmtNum(liTotals.impressions)}   meValue={fmtNum(meTotals.impressions)}   liRaw={liTotals.impressions} meRaw={meTotals.impressions} />
                  <CompareRow label="Clicks"           liValue={fmtNum(liTotals.clicks)}        meValue={fmtNum(meTotals.clicks)}        liRaw={liTotals.clicks}      meRaw={meTotals.clicks} />
                  <CompareRow label="CTR"              liValue={fmtPct(liCtr)}                  meValue={fmtPct(meCtr)}                  liRaw={liCtr}                meRaw={meCtr} />
                  <CompareRow label="Kosten per klik"  liValue={liCpc > 0 ? fmtEur(liCpc) : '—'} meValue={meCpc > 0 ? fmtEur(meCpc) : '—'} liRaw={liCpc}            meRaw={meCpc}                lowerIsBetter />
                  <CompareRow label="Sollicitanten"    liValue={fmtNum(liTotals.conversions)}   meValue={fmtNum(meTotals.conversions)}   liRaw={liTotals.conversions} meRaw={meTotals.conversions} />
                  <CompareRow label="Kosten/soll."     liValue={liCpa !== null ? fmtEur(liCpa) : '—'} meValue={meCpa !== null ? fmtEur(meCpa) : '—'} liRaw={liCpa ?? 0} meRaw={meCpa ?? 0} lowerIsBetter />
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── CPA trend ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Trend</h2>
          {loading ? <CpaTrendChartSkeleton /> : <CpaTrendChart rows={filtered} />}
        </section>

        {/* ── Campaign spotlight ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Uitschieters</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KpiCardSkeleton /><KpiCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestCpaCampaign ? (
                <SpotlightCard
                  badge="🏆"
                  badgeColor="#16a34a"
                  title="Beste campagne"
                  campaignName={bestCpaCampaign.campaign_name}
                  platform={bestCpaCampaign.platform}
                  metric={fmtEur(bestCpaCampaign.cpa)}
                  metricLabel="CPA"
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-sm text-gray-400">
                  Geen conversiedata beschikbaar
                </div>
              )}
              {bestCpcCampaign ? (
                <SpotlightCard
                  badge="🖱️"
                  badgeColor="#2563eb"
                  title="Meest geklikt per €"
                  campaignName={bestCpcCampaign.campaign_name}
                  platform={bestCpcCampaign.platform}
                  metric={fmtEur(bestCpcCampaign.cpc)}
                  metricLabel="CPC"
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-sm text-gray-400">
                  Geen klikdata beschikbaar
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Campaign rankings ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Campagnes</h2>
          {loading ? <CampaignRankTableSkeleton /> : <CampaignRankTable rows={filtered} />}
        </section>

        {/* ── Google Analytics ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Website — Google Analytics</h2>
          <AnalyticsSection dateFrom={dateFrom} dateTo={dateTo} />
        </section>

      </div>
    </main>
  );
}
