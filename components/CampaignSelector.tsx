'use client';

import type { CampaignRow } from '@/types/campaign';

const LINKEDIN_COLOR = '#0077B5';
const META_COLOR = '#1877F2';

interface Props {
  rows: CampaignRow[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export default function CampaignSelector({ rows, selected, onChange }: Props) {
  // Unique campaigns, preserving first-seen platform
  const campaigns: { name: string; platform: 'linkedin' | 'meta' }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!seen.has(r.campaign_name)) {
      seen.add(r.campaign_name);
      campaigns.push({ name: r.campaign_name, platform: r.platform });
    }
  }

  const linkedin = campaigns.filter((c) => c.platform === 'linkedin');
  const meta     = campaigns.filter((c) => c.platform === 'meta');

  function toggle(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name); else next.add(name);
    onChange(next);
  }

  function selectAll()   { onChange(new Set(campaigns.map((c) => c.name))); }
  function deselectAll() { onChange(new Set()); }

  function selectGroup(platform: 'linkedin' | 'meta') {
    const next = new Set(selected);
    campaigns.filter((c) => c.platform === platform).forEach((c) => next.add(c.name));
    onChange(next);
  }

  function deselectGroup(platform: 'linkedin' | 'meta') {
    const next = new Set(selected);
    campaigns.filter((c) => c.platform === platform).forEach((c) => next.delete(c.name));
    onChange(next);
  }

  function isGroupChecked(platform: 'linkedin' | 'meta') {
    return campaigns.filter((c) => c.platform === platform).every((c) => selected.has(c.name));
  }

  function Group({ platform, list, color }: { platform: 'linkedin' | 'meta'; list: typeof campaigns; color: string }) {
    const label = platform === 'linkedin' ? 'LinkedIn' : 'Meta';
    const allChecked = isGroupChecked(platform);
    return (
      <div>
        {/* Group header row */}
        <label className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={() => allChecked ? deselectGroup(platform) : selectGroup(platform)}
            className="w-3.5 h-3.5 rounded accent-current"
            style={{ accentColor: color }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {label}
          </span>
        </label>
        {/* Campaign rows */}
        {list.map((c) => (
          <label
            key={c.name}
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={selected.has(c.name)}
              onChange={() => toggle(c.name)}
              className="w-3.5 h-3.5 shrink-0"
              style={{ accentColor: color }}
            />
            <span className="text-xs text-gray-700 leading-snug">{c.name}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Campagnes
        </span>
        <div className="flex gap-2">
          <button onClick={selectAll}   className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Alles aan</button>
          <span className="text-gray-200">|</span>
          <button onClick={deselectAll} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Alles uit</button>
        </div>
      </div>
      {/* Lists */}
      <div className="p-1 max-h-[70vh] overflow-y-auto space-y-1">
        {linkedin.length > 0 && <Group platform="linkedin" list={linkedin} color={LINKEDIN_COLOR} />}
        {meta.length    > 0 && <Group platform="meta"     list={meta}     color={META_COLOR} />}
      </div>
      {/* Footer count */}
      <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400">
        {selected.size} / {campaigns.length} geselecteerd
      </div>
    </div>
  );
}
