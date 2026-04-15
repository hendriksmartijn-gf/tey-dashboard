'use client';

import { useState, useEffect, useCallback } from 'react';
import KpiCard, { KpiCardSkeleton } from '@/components/KpiCard';
import SpendLineChart, { SpendLineChartSkeleton } from '@/components/SpendLineChart';
import ImpressionsBarChart, { ImpressionsBarChartSkeleton } from '@/components/ImpressionsBarChart';
import CampaignTable, { CampaignTableSkeleton } from '@/components/CampaignTable';
import type { CampaignRow } from '@/types/campaign';

// ── formatting helpers ───────────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('nl-NL');
const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

// ── KPI computation ──────────────────────────────────────────────────────────
function computeKpis(rows: CampaignRow[]) {
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0;
  for (const r of rows) {
    totalSpend       += r.spend;
    totalImpressions += r.impressions;
    totalClicks      += r.clicks;
    totalConversions += r.conversions;
  }
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const cpc = totalConversions > 0 ? totalSpend / totalConversions : 0;
  return { totalSpend, totalImpressions, totalClicks, totalConversions, ctr, cpc };
}

// ── component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [rows,    setRows]    = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const data: CampaignRow[] = await res.json();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = computeKpis(rows);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900 tracking-tight">Marketing Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              LinkedIn + Meta
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-500 text-lg leading-none">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to load data</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-xs font-semibold text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  title="Total Spend"
                  value={fmtEur(kpis.totalSpend)}
                  subtitle="LinkedIn + Meta"
                />
                <KpiCard
                  title="Impressions"
                  value={fmtNum(kpis.totalImpressions)}
                  subtitle="Total views"
                />
                <KpiCard
                  title="Clicks"
                  value={fmtNum(kpis.totalClicks)}
                  subtitle="Total clicks"
                />
                <KpiCard
                  title="Avg CTR"
                  value={fmtPct(kpis.ctr * 100)}
                  subtitle="Clicks / impressions"
                />
                <KpiCard
                  title="Conversions"
                  value={fmtNum(kpis.totalConversions)}
                  subtitle="Total conversions"
                />
                <KpiCard
                  title="Cost / Conv."
                  value={kpis.totalConversions > 0 ? fmtEur(kpis.cpc) : '—'}
                  subtitle="Spend per conversion"
                />
              </>
            )}
          </div>
        </section>

        {/* Charts */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Charts
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {loading ? (
              <>
                <SpendLineChartSkeleton />
                <ImpressionsBarChartSkeleton />
              </>
            ) : (
              <>
                <SpendLineChart rows={rows} />
                <ImpressionsBarChart rows={rows} />
              </>
            )}
          </div>
        </section>

        {/* Data table */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            All Campaigns
          </h2>
          {loading ? <CampaignTableSkeleton /> : <CampaignTable rows={rows} />}
        </section>
      </div>
    </main>
  );
}
