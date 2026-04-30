interface Props {
  platform: 'linkedin' | 'meta';
  spend: number;
  applicants: number;
  clicks: number;
  impressions: number;
  isWinner: boolean;
}

const fmtEur = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtEur2 = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const fmtNum = (n: number) => n.toLocaleString('nl-NL');
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const CONFIG = {
  linkedin: { label: 'LinkedIn', color: '#0077B5' },
  meta:     { label: 'Meta / Facebook', color: '#1877F2' },
};

export function ChannelCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-5" />
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-6" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-1.5" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChannelCard({ platform, spend, applicants, clicks, impressions, isWinner }: Props) {
  const cfg = CONFIG[platform];
  const cpa = applicants > 0 ? spend / applicants : null;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-6 relative ${isWinner ? 'border-green-300' : 'border-gray-100'}`}>
      {isWinner && (
        <span className="absolute top-4 right-4 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
          Beste CPA
        </span>
      )}

      {/* Platform label */}
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: cfg.color }}>
        {cfg.label}
      </p>

      {/* CPA — hero metric */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Kosten per sollicitant</p>
        <p className="text-4xl font-bold text-gray-900 tabular-nums">
          {cpa !== null ? fmtEur2(cpa) : '—'}
        </p>
      </div>

      {/* Supporting metrics */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Budget gespendeerd</p>
          <p className="text-sm font-semibold text-gray-800">{fmtEur(spend)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Sollicitanten</p>
          <p className="text-sm font-semibold text-gray-800">{fmtNum(applicants)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">CTR</p>
          <p className="text-sm font-semibold text-gray-800">{fmtPct(ctr)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Kosten per klik</p>
          <p className="text-sm font-semibold text-gray-800">{cpc > 0 ? fmtEur2(cpc) : '—'}</p>
        </div>
      </div>
    </div>
  );
}
