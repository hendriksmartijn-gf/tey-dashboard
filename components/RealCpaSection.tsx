'use client';

import type { Channel } from '@/lib/channel';
import { CHANNEL_COLOR, CHANNEL_LABEL } from '@/lib/channel';

interface Props {
  /** Paid ad spend per channel for the selected period (all campaigns, not campaign-filtered). */
  spend:       Record<'linkedin' | 'meta' | 'google', number>;
  /** Completed applications (Recruitee, via GA4) per channel for the selected period. */
  completions: Record<Channel, number>;
  loading:     boolean;
  available:   boolean;
}

const fmtEur2 = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEur0 = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');

const PAID: ('linkedin' | 'meta' | 'google')[] = ['linkedin', 'meta', 'google'];

export function RealCpaSectionSkeleton() {
  return (
    <div className="bg-white p-5 animate-pulse" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-5" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
      </div>
    </div>
  );
}

export default function RealCpaSection({ spend, completions, loading, available }: Props) {
  if (loading) return <RealCpaSectionSkeleton />;

  if (!available) {
    return (
      <div className="bg-white p-6 text-sm" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', color: '#8C9BAF' }}>
        Echte sollicitatiedata (GA4/Recruitee) is niet beschikbaar voor deze periode.
      </div>
    );
  }

  const paidSpend       = spend.linkedin + spend.meta + spend.google;
  const paidCompletions = completions.linkedin + completions.meta + completions.google;
  const totalCpa        = paidCompletions > 0 ? paidSpend / paidCompletions : null;

  // Cheapest qualifying channel (>=1 real completion) for highlighting.
  const cpaByChannel = PAID.map((ch) => ({
    ch,
    cpa: completions[ch] > 0 ? spend[ch] / completions[ch] : null,
  }));
  const cheapest = cpaByChannel
    .filter((c) => c.cpa !== null)
    .sort((a, b) => (a.cpa! - b.cpa!))[0]?.ch;

  return (
    <div className="bg-white overflow-hidden" style={{ border: '1px solid #DCE0E6', borderRadius: '8px', boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
      <div className="px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid #DCE0E6' }}>
        <span className="gf-eyebrow">Echte kosten per sollicitatie</span>
        <span className="text-xs" style={{ color: '#BCC4CF' }}>
          Voltooide sollicitaties (Recruitee, via GA4) — niet de pixel-conversies van de platforms
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* Total */}
        <div className="p-5" style={{ borderRight: '1px solid #F0F4F8', borderBottom: '1px solid #F0F4F8', background: '#FAFBFF' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6331F4' }}>Alle kanalen</p>
          <p className="gf-display text-[1.9rem] font-light tabular-nums" style={{ color: '#12101F' }}>
            {totalCpa !== null ? fmtEur2(totalCpa) : '—'}
          </p>
          <p className="text-xs mt-1.5" style={{ color: '#8C9BAF' }}>
            {fmtEur0(paidSpend)} ÷ {fmtNum(paidCompletions)} sollicitaties
          </p>
        </div>

        {/* Per channel */}
        {PAID.map((ch, idx) => {
          const cpa     = completions[ch] > 0 ? spend[ch] / completions[ch] : null;
          const isCheap = ch === cheapest && cpa !== null;
          return (
            <div
              key={ch}
              className="p-5"
              style={{
                borderRight: idx < 2 ? '1px solid #F0F4F8' : undefined,
                borderBottom: '1px solid #F0F4F8',
                background: isCheap ? 'rgba(22,163,74,0.04)' : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLOR[ch] }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CHANNEL_COLOR[ch] }}>
                  {CHANNEL_LABEL[ch]}
                </p>
                {isCheap && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    goedkoopst
                  </span>
                )}
              </div>
              <p className="gf-display text-[1.9rem] font-light tabular-nums" style={{ color: isCheap ? '#16A34A' : '#12101F' }}>
                {cpa !== null ? fmtEur2(cpa) : '—'}
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#8C9BAF' }}>
                {fmtEur0(spend[ch])} ÷ {fmtNum(completions[ch])} soll.
              </p>
            </div>
          );
        })}
      </div>

      {/* Organic / other context */}
      {completions.other > 0 && (
        <div className="px-5 py-3 flex items-center gap-2 text-xs" style={{ background: '#F8FAFC', color: '#8C9BAF' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLOR.other }} />
          <span>
            <span className="font-semibold" style={{ color: '#555E6C' }}>{fmtNum(completions.other)}</span> sollicitaties kwamen via overige/organische bronnen (geen advertentiekosten toegerekend)
          </span>
        </div>
      )}

      <div className="px-5 py-3 text-xs" style={{ borderTop: '1px solid #F0F4F8', color: '#BCC4CF' }}>
        Toerekening op kanaalniveau (GA4 sessiebron). Onafhankelijk van je campagneselectie hierboven — het gaat om al het verkeer per kanaal in deze periode.
      </div>
    </div>
  );
}
