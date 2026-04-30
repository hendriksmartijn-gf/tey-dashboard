'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { AnalyticsDayRow } from '@/lib/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNum = (n: number) => n.toLocaleString('nl-NL');

// Map GA4 channel groupings to cleaner labels + colours
const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  'Paid Social':      { label: 'Betaald social',   color: '#6366f1' },
  'Organic Social':   { label: 'Organisch social',  color: '#818cf8' },
  'Paid Search':      { label: 'Betaald zoeken',    color: '#f59e0b' },
  'Organic Search':   { label: 'Organisch zoeken',  color: '#10b981' },
  'Direct':           { label: 'Direct',            color: '#3b82f6' },
  'Referral':         { label: 'Referral',          color: '#8b5cf6' },
  'Email':            { label: 'E-mail',            color: '#ec4899' },
  'Unassigned':       { label: 'Overig',            color: '#d1d5db' },
};

function channelColor(ch: string) {
  return CHANNEL_CONFIG[ch]?.color ?? '#9ca3af';
}
function channelLabel(ch: string) {
  return CHANNEL_CONFIG[ch]?.label ?? ch;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="h-2.5 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-2 bg-gray-100 rounded w-3/4" />
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

function MiniKpi({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  dateFrom?: string;
  dateTo?: string;
}

export default function AnalyticsSection({ dateFrom, dateTo }: Props) {
  const [data,    setData]    = useState<AnalyticsDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
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
        return res.json() as Promise<{ byDay: AnalyticsDayRow[] }>;
      })
      .then((d) => setData(d.byDay))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  // ── Aggregations ────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => ({
        sessions:  acc.sessions  + r.sessions,
        users:     acc.users     + r.users,
        keyEvents: acc.keyEvents + r.keyEvents,
      }),
      { sessions: 0, users: 0, keyEvents: 0 }
    );
  }, [data]);

  // Sessions per day (all channels combined)
  const byDay = useMemo(() => {
    const map = new Map<string, { sessions: number; keyEvents: number }>();
    for (const r of data) {
      const cur = map.get(r.date) ?? { sessions: 0, keyEvents: 0 };
      cur.sessions  += r.sessions;
      cur.keyEvents += r.keyEvents;
      map.set(r.date, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), ...v })); // trim to MM-DD
  }, [data]);

  // Sessions by channel (totalled)
  const byChannel = useMemo(() => {
    const map = new Map<string, { sessions: number; keyEvents: number }>();
    for (const r of data) {
      const cur = map.get(r.channel) ?? { sessions: 0, keyEvents: 0 };
      cur.sessions  += r.sessions;
      cur.keyEvents += r.keyEvents;
      map.set(r.channel, cur);
    }
    return Array.from(map.entries())
      .map(([channel, v]) => ({ channel: channelLabel(channel), rawChannel: channel, ...v }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [data]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <SectionSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        <strong>Google Analytics:</strong> {error}
      </div>
    );
  }

  const convRate = totals.sessions > 0
    ? ((totals.keyEvents / totals.sessions) * 100).toFixed(1)
    : '—';

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <MiniKpi
          title="Sessies"
          value={fmtNum(totals.sessions)}
          subtitle="Websitebezoekers"
        />
        <MiniKpi
          title="Unieke bezoekers"
          value={fmtNum(totals.users)}
          subtitle="Actieve gebruikers"
        />
        <MiniKpi
          title="Conversiepercentage"
          value={`${convRate}%`}
          subtitle={`${fmtNum(totals.keyEvents)} key events`}
        />
      </div>

      {/* Sessions over time */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
          Sessies per dag
        </p>
        {byDay.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [fmtNum(Number(v)), name === 'sessions' ? 'Sessies' : 'Key events']}
                labelFormatter={(l) => String(l)}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessies"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="keyEvents"
                name="Key events"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sessions by channel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
          Sessies per kanaal
        </p>
        {byChannel.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Geen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byChannel} margin={{ top: 4, right: 16, left: 8, bottom: 4 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                formatter={(v: unknown) => [fmtNum(Number(v)), 'Sessies']}
              />
              <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                {byChannel.map((entry) => (
                  <Cell key={entry.rawChannel} fill={channelColor(entry.rawChannel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
