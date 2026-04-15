'use client';

import { useState, useEffect, useCallback } from 'react';
import KpiCard, { KpiCardSkeleton } from '@/components/KpiCard';
import SpendLineChart, { SpendLineChartSkeleton } from '@/components/SpendLineChart';
import ImpressionsBarChart, { ImpressionsBarChartSkeleton } from '@/components/ImpressionsBarChart';
import CampaignTable, { CampaignTableSkeleton } from '@/components/CampaignTable';
import CampaignSelector from '@/components/CampaignSelector';
import type { CampaignRow } from '@/types/campaign';
import { getMetricValue, sumRows } from '@/types/campaign';
import LinkedInSection from '@/components/LinkedInSection';
import MetaSection from '@/components/MetaSection';

const fmtNum = (n: number) => n.toLocaleString('nl-NL');
const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function DashboardPage() {
  const [rows,     setRows]     = useState<CampaignRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

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
      // Select all campaigns on first load
      setSelected(new Set(data.map((r) => r.campaign_name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter((r) => selected.has(r.campaign_name));
  const totals   = sumRows(filtered);
  const ctr      = getMetricValue(totals, 'ctr');
  const cpc      = getMetricValue(totals, 'cpc');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
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
            {loading ? 'Laden…' : 'Vernieuwen'}
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-8">
            <span className="text-red-500 text-lg leading-none">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to load data</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <button onClick={fetchData} className="mt-2 text-xs font-semibold text-red-700 underline hover:no-underline">
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* ── Left sidebar: campaign selector ── */}
          <aside className="w-80 shrink-0 space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded" />
                ))}
              </div>
            ) : (
              <CampaignSelector rows={rows} selected={selected} onChange={setSelected} />
            )}
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* KPI cards */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Overzicht</h2>
              <div className="grid grid-cols-3 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
                ) : (
                  <>
                    <KpiCard title="Spend"        value={fmtEur(totals.spend)}       subtitle="LinkedIn + Meta" />
                    <KpiCard title="Impressions"  value={fmtNum(totals.impressions)}  subtitle="Totaal" />
                    <KpiCard title="Clicks"       value={fmtNum(totals.clicks)}       subtitle="Totaal" />
                    <KpiCard title="Gem. CTR"     value={fmtPct(ctr * 100)}           subtitle="Clicks / impressions" />
                    <KpiCard title="Conversies"   value={fmtNum(totals.thruplays > 0 ? totals.thruplays : 0)} subtitle="ThruPlays" />
                    <KpiCard title="Kosten/conv." value={totals.clicks > 0 ? fmtEur(cpc) : '—'} subtitle="Spend per klik" />
                  </>
                )}
              </div>
            </section>

            {/* Charts */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Grafieken</h2>
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <><SpendLineChartSkeleton /><ImpressionsBarChartSkeleton /></>
                ) : (
                  <><SpendLineChart rows={filtered} /><ImpressionsBarChart rows={filtered} /></>
                )}
              </div>
            </section>

            {/* Table */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Alle campagnes</h2>
              {loading ? <CampaignTableSkeleton /> : <CampaignTable rows={filtered} />}
            </section>

            <LinkedInSection />
            <MetaSection />

          </div>
        </div>
      </div>
    </main>
  );
}
