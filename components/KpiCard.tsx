interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean; // highlight border with purple
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-[#DCE0E6] p-5 animate-pulse" style={{ boxShadow: '0 8px 24px rgba(18,16,34,0.08)' }}>
      <div className="h-2.5 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-9 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

export default function KpiCard({ title, value, subtitle, accent }: KpiCardProps) {
  return (
    <div
      className="bg-white rounded-lg p-5"
      style={{
        border: `1px solid ${accent ? '#6331F4' : '#DCE0E6'}`,
        boxShadow: '0 8px 24px rgba(18,16,34,0.08)',
      }}
    >
      <p className="gf-eyebrow mb-2">{title}</p>
      <p className="gf-display text-[2rem] font-light text-[#12101F] tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-[#8C9BAF] mt-1.5">{subtitle}</p>}
    </div>
  );
}
