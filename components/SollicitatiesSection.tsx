'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ConversionByJob, ApplicationStart } from '@/lib/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNum = (n: number) => n.toLocaleString('nl-NL');

const TITLE_PREFIX = 'Forensisch centrum Teylingereind - ';
function shortTitle(raw: string): string {
  return raw.startsWith(TITLE_PREFIX) ? raw.slice(TITLE_PREFIX.length) : raw;
}

function sourceToChannel(source: string): 'linkedin' | 'meta' | 'google' | 'other' {
  const s = source.toLowerCase();
  if (s.includes('linkedin') || s.includes('lnkd'))                                   return 'linkedin';
  if (s.includes('facebook') || s.includes('instagram') || s.includes('fb') ||
      s.includes('meta')     || s === 'ig')                                            return 'meta';
  if (s.includes('google')   || s.includes('goog'))                                   return 'google';
  return 'other';
}

// ── Multiselect dropdown ──────────────────────────────────────────────────────

interface DropdownProps {
  allTitles: string[];
  selected:  Set<string>;
  onChange:  (next: Set<string>) => void;
}

function VacatureDropdown({ allTitles, selected, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allSelected  = selected.size === allTitles.length;
  const noneSelected = selected.size === 0;

  function toggle(title: string) {
    const next = new Set(selected);
    if (next.has(title)) next.delete(title); else next.add(title);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 transition-all"
        style={{
          background: '#ffffff',
          border: `1.5px solid ${open ? '#6331F4' : '#DCE0E6'}`,
          borderRadius: '8px',
          color: '#12101F',
          boxShadow: open ? '0 0 0 3px rgba(99,49,244,0.1)' : undefined,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#6331F4', flexShrink: 0 }}>
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {allSelected
          ? 'Alle vacatures'
          : noneSelected
          ? 'Geen vacatures'
          : `${selected.size} van ${allTitles.length} vacatures`}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ color: '#8C9BAF', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 z-30 mt-1.5 bg-white"
          style={{
            border: '1px solid #DCE0E6',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(18,16,34,0.12)',
            minWidth: '340px',
            maxWidth: '480px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #DCE0E6' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8C9BAF' }}>Vacatures</span>
            <div className="flex gap-3">
              <button
                onClick={() => onChange(new Set(allTitles))}
                className="text-xs font-semibold"
                style={{ color: allSelected ? '#BCC4CF' : '#6331F4' }}
              >
                Alles
              </button>
              <span style={{ color: '#DCE0E6' }}>|</span>
              <button
                onClick={() => onChange(new Set())}
                className="text-xs font-semibold"
                style={{ color: noneSelected ? '#BCC4CF' : '#555E6C' }}
              >
                Geen
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto py-1" style={{ maxHeight: '300px' }}>
            {allTitles.map((title) => {
              const checked = selected.has(title);
              return (
                <label
                  key={title}
                  className="flex items-start gap-2.5 px-4 py-2 cursor-pointer select-none transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F4F8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(title)}
                    className="mt-0.5 w-3.5 h-3.5 shrink-0"
                    style={{ accentColor: '#6331F4' }}
                  />
                  <span className="text-xs leading-snug" style={{ color: checked ? '#12101F' : '#8C9BAF' }}>
                    {shortTitle(title)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5" style={{ borderTop: '1px solid #DCE0E6' }}>
            <span className="text-xs" style={{ color: '#8C9BAF' }}>
              <span className="font-semibold" style={{ color: '#12101F' }}>{selected.size}</span>
              {' '}/ {allTitles.length} geselecteerd
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsSlice {
  conversionsByJob:  ConversionByJob[];
  applicationStarts: ApplicationStart[];
}

interface Props {
  dateFrom?: string;
  dateTo?:   string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-lg" style={{ border: '1px solid #DCE0E6', height: '160px' }} />
      <div className="bg-white rounded-lg" style={{ border: '1px solid #DCE0E6', height: '320px' }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SollicitatiesSection({ dateFrom, dateTo }: Props) {
  const [data,    setData]    = useState<AnalyticsSlice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateFrom) params.set('startDate', dateFrom);
    if (dateTo)   params.set('endDate',   dateTo);

    fetch(`/api/analytics?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<AnalyticsSlice>;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // All unique job titles (union of completions + starts)
  const allTitles = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const r of data.conversionsByJob)  set.add(r.jobTitle);
    for (const r of data.applicationStarts) set.add(r.jobTitle);
    return Array.from(set).sort((a, b) => shortTitle(a).localeCompare(shortTitle(b)));
  }, [data]);

  // Init selection to all when data loads
  useEffect(() => {
    setSelectedTitles(new Set(allTitles));
  }, [allTitles]);

  // Pivot completions by job × platform, filtered by selection
  const jobRows = useMemo(() => {
    if (!data) return [];

    const compMap = new Map<string, { linkedin: number; meta: number; google: number; other: number }>();
    for (const r of data.conversionsByJob) {
      if (selectedTitles.size > 0 && !selectedTitles.has(r.jobTitle)) continue;
      const ch  = sourceToChannel(r.source);
      const cur = compMap.get(r.jobTitle) ?? { linkedin: 0, meta: 0, google: 0, other: 0 };
      cur[ch] += r.completions;
      compMap.set(r.jobTitle, cur);
    }

    const startsMap = new Map<string, number>();
    for (const r of data.applicationStarts) {
      if (selectedTitles.size > 0 && !selectedTitles.has(r.jobTitle)) continue;
      startsMap.set(r.jobTitle, (startsMap.get(r.jobTitle) ?? 0) + r.starts);
    }

    const allFiltered = new Set([...compMap.keys(), ...startsMap.keys()]);
    return Array.from(allFiltered)
      .map((jobTitle) => {
        const v         = compMap.get(jobTitle)   ?? { linkedin: 0, meta: 0, google: 0, other: 0 };
        const starts    = startsMap.get(jobTitle) ?? 0;
        const completed = v.linkedin + v.meta + v.google + v.other;
        return {
          jobTitle,
          linkedin: v.linkedin,
          meta:     v.meta,
          google:   v.google,
          other:    v.other,
          starts,
          completed,
          convRate: starts > 0 ? completed / starts : null,
        };
      })
      .sort((a, b) => b.completed - a.completed || b.starts - a.starts);
  }, [data, selectedTitles]);

  // Overall funnel
  const funnel = useMemo(() => {
    const starts    = jobRows.reduce((s, r) => s + r.starts, 0);
    const completed = jobRows.reduce((s, r) => s + r.completed, 0);
    return { starts, completed, rate: starts > 0 ? completed / starts : null };
  }, [jobRows]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <strong>Sollicitaties:</strong> {error}
        <button onClick={fetchData} className="ml-3 underline font-semibold">Opnieuw</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Vacature filter ── */}
      <div className="flex items-center gap-3">
        <VacatureDropdown allTitles={allTitles} selected={selectedTitles} onChange={setSelectedTitles} />
        {selectedTitles.size < allTitles.length && selectedTitles.size > 0 && (
          <span className="text-xs font-semibold" style={{ color: '#6331F4' }}>gefilterd</span>
        )}
      </div>

      {/* ── Sollicitatiefunnel ── */}
      {funnel.starts > 0 && (
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #DCE0E6' }}>
            <span className="gf-eyebrow">Sollicitatiefunnel</span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-stretch gap-0 mb-5">
              {/* Started */}
              <div className="flex-1 rounded-l-lg px-5 py-4" style={{ background: '#F0F4F8' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8C9BAF' }}>Formulier gestart</p>
                <p className="text-3xl font-bold tabular-nums" style={{ color: '#12101F' }}>{fmtNum(funnel.starts)}</p>
                <p className="text-xs mt-1" style={{ color: '#BCC4CF' }}>application_form_start</p>
              </div>

              <div className="flex items-center px-3" style={{ color: '#BCC4CF' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Completed */}
              <div className="flex-1 px-5 py-4" style={{ background: '#F0F4F8' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8C9BAF' }}>Sollicitatie voltooid</p>
                <p className="text-3xl font-bold tabular-nums" style={{ color: '#12101F' }}>{fmtNum(funnel.completed)}</p>
                <p className="text-xs mt-1" style={{ color: '#BCC4CF' }}>Sollicitatie_voltooid_recruitee</p>
              </div>

              <div className="flex items-center px-3" style={{ color: '#BCC4CF' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Rate */}
              <div
                className="flex-1 rounded-r-lg px-5 py-4"
                style={{
                  background: funnel.rate !== null && funnel.rate >= 0.5 ? 'rgba(22,163,74,0.06)' : '#F0F4F8',
                  border:     funnel.rate !== null && funnel.rate >= 0.5 ? '1px solid rgba(22,163,74,0.2)' : undefined,
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8C9BAF' }}>Afrondingsratio</p>
                <p className="text-3xl font-bold tabular-nums" style={{ color: funnel.rate !== null && funnel.rate >= 0.5 ? '#16A34A' : '#12101F' }}>
                  {funnel.rate !== null ? `${(funnel.rate * 100).toFixed(1)}%` : '—'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#BCC4CF' }}>Gestart → voltooid</p>
              </div>
            </div>

            {funnel.rate !== null && (
              <p className="text-xs" style={{ color: '#8C9BAF' }}>
                <span style={{ color: '#BCC4CF' }}>↳ </span>
                <span className="font-semibold" style={{ color: '#555E6C' }}>{fmtNum(funnel.starts - funnel.completed)}</span>
                {' '}mensen startten maar voltooiden de sollicitatie niet
                {' '}(<span className="font-semibold" style={{ color: '#555E6C' }}>{((1 - funnel.rate) * 100).toFixed(1)}%</span> uitval)
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Sollicitaties per vacature ── */}
      {jobRows.length > 0 && (
        <div className="bg-white overflow-hidden" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #DCE0E6' }}>
            <span className="gf-eyebrow">Sollicitaties per vacature</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#F0F4F8' }}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#8C9BAF' }}>Vacature</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#0077B5' }}>LinkedIn</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#1877F2' }}>Meta</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#F59E0B' }}>Google</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Overig</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Gestart</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#12101F' }}>Voltooid</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C9BAF' }}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {jobRows.map((r, i) => {
                  const rateColor = r.convRate === null ? '#BCC4CF'
                    : r.convRate >= 0.7 ? '#16A34A'
                    : r.convRate >= 0.4 ? '#F59E0B'
                    : '#E02D3C';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F0F4F8' }} className="last:border-0 hover:bg-[#F0F4F8]/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium" title={r.jobTitle} style={{ color: '#12101F', maxWidth: '380px' }}>
                        {shortTitle(r.jobTitle)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: r.linkedin > 0 ? '#0077B5' : '#BCC4CF', fontWeight: r.linkedin > 0 ? 600 : 400 }}>
                        {r.linkedin > 0 ? fmtNum(r.linkedin) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: r.meta > 0 ? '#1877F2' : '#BCC4CF', fontWeight: r.meta > 0 ? 600 : 400 }}>
                        {r.meta > 0 ? fmtNum(r.meta) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: r.google > 0 ? '#F59E0B' : '#BCC4CF', fontWeight: r.google > 0 ? 600 : 400 }}>
                        {r.google > 0 ? fmtNum(r.google) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: r.other > 0 ? '#555E6C' : '#BCC4CF', fontWeight: r.other > 0 ? 600 : 400 }}>
                        {r.other > 0 ? fmtNum(r.other) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: r.starts > 0 ? '#555E6C' : '#BCC4CF' }}>
                        {r.starts > 0 ? fmtNum(r.starts) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-bold" style={{ color: '#12101F' }}>
                        {fmtNum(r.completed)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold whitespace-nowrap" style={{ color: rateColor }}>
                        {r.convRate !== null ? `${(r.convRate * 100).toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {jobRows.length === 0 && (
        <div className="bg-white p-10 text-center text-sm" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', color: '#8C9BAF' }}>
          Geen sollicitatiedata beschikbaar voor de geselecteerde periode
        </div>
      )}

    </div>
  );
}
