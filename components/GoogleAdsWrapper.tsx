'use client';

import { useState, useEffect, useCallback } from 'react';
import GoogleAdsSection, { GoogleAdsSectionSkeleton } from '@/components/GoogleAdsSection';
import type { GoogleAdsCampaignRow, GoogleAdsDayRow } from '@/lib/analytics';

interface Props {
  dateFrom?: string;
  dateTo?:   string;
}

export default function GoogleAdsWrapper({ dateFrom, dateTo }: Props) {
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaignRow[]>([]);
  const [byDay,     setByDay]     = useState<GoogleAdsDayRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

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
        return res.json() as Promise<{ googleAds: { campaigns: GoogleAdsCampaignRow[]; byDay: GoogleAdsDayRow[] } }>;
      })
      .then((data) => {
        setCampaigns(data.googleAds?.campaigns ?? []);
        setByDay(data.googleAds?.byDay ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <GoogleAdsSectionSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <strong>Google Ads:</strong> {error}
        <button onClick={fetchData} className="ml-3 underline font-semibold">Opnieuw</button>
      </div>
    );
  }

  return <GoogleAdsSection campaigns={campaigns} byDay={byDay} />;
}
