'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import KpiCard, { KpiCardSkeleton } from '@/components/KpiCard';
import ChannelCard, { ChannelCardSkeleton } from '@/components/ChannelCard';
import CampaignRankTable, { CampaignRankTableSkeleton } from '@/components/CampaignRankTable';
import CpaTrendChart, { CpaTrendChartSkeleton } from '@/components/CpaTrendChart';
import type { CampaignRow } from '@/types/campaign';
import { sumRows } from '@/types/campaign';

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');

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
  const totals = useMemo(() => sumRows(filtered), [filtered]);
  const overallCpa = totals.conversions > 0 ? totals.spend / totals.conversions : null;

  // Per-channel totals
  const liRows = useMemo(() => filtered.filter((r) => r.platform === 'linkedin'), [filtered]);
  const meRows = useMemo(() => filtered.filter((r) => r.platform === 'meta'),     [filtered]);
  const liTotals = useMemo(() => sumRows(liRows), [liRows]);
  const meTotals = useMemo(() => sumRows(meRows), [meRows]);

  const liCpa = liTotals.conversions > 0 ? liTotals.spend / liTotals.conversions : null;
  const meCpa = meTotals.conversions > 0 ? meTotals.spend / meTotals.conversions : null;

  // Which channel wins (lowest CPA)?
  const liWins = liCpa !== null && meCpa !== null && liCpa <= meCpa;
  const meWins = liCpa !== null && meCpa !== null && meCpa < liCpa;
  const bestChannel =
    liCpa !== null && meCpa !== null
      ? liCpa <= meCpa ? 'LinkedIn' : 'Meta'
      : liCpa !== null ? 'LinkedIn'
      : meCpa !== null ? 'Meta'
      : '—';

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
                <KpiCard
                  title="Budget gespendeerd"
                  value={fmtEur(totals.spend)}
                  subtitle="LinkedIn + Meta"
                />
                <KpiCard
                  title="Totaal sollicitanten"
                  value={fmtNum(totals.conversions)}
                  subtitle="Alle kanalen"
                />
                <KpiCard
                  title="Kosten per sollicitant"
                  value={overallCpa !== null ? fmtEur(overallCpa) : '—'}
                  subtitle="Spend ÷ sollicitanten"
                />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <><ChannelCardSkeleton /><ChannelCardSkeleton /></>
            ) : (
              <>
                <ChannelCard
                  platform="linkedin"
                  spend={liTotals.spend}
                  applicants={liTotals.conversions}
                  clicks={liTotals.clicks}
                  impressions={liTotals.impressions}
                  isWinner={liWins}
                />
                <ChannelCard
                  platform="meta"
                  spend={meTotals.spend}
                  applicants={meTotals.conversions}
                  clicks={meTotals.clicks}
                  impressions={meTotals.impressions}
                  isWinner={meWins}
                />
              </>
            )}
          </div>
        </section>

        {/* ── CPA trend ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Trend</h2>
          {loading ? <CpaTrendChartSkeleton /> : <CpaTrendChart rows={filtered} />}
        </section>

        {/* ── Campaign rankings ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Campagnes</h2>
          {loading ? <CampaignRankTableSkeleton /> : <CampaignRankTable rows={filtered} />}
        </section>

      </div>
    </main>
  );
}
