// Public (no auth) fetcher for the marketing site's "See FlowFix in
// action" block. Hits `/api/public/recent-activity` which returns
// anonymized, masked items. The unified "All" list page uses the
// authenticated fetcher in `api-items.ts` instead.

export type PublicBadgeTone = 'primary' | 'accent' | 'warning';

export type PublicActivityItem = {
  type: 'customer' | 'job' | 'call';
  createdAt: string;
  headline: string;
  subtitle: string;
  badge: { label: string; tone: PublicBadgeTone };
};

export type PublicActivityResponse = {
  items: PublicActivityItem[];
  asOf: string;
  note?: string;
};

/**
 * `noStore: true` keeps the marketing page dynamic — every visit
 * shows fresh activity. No JWT, no Clerk.
 */
export async function fetchPublicRecentActivity(
  limit = 9,
): Promise<PublicActivityResponse> {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  const res = await fetch(`/api/public/recent-activity?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as PublicActivityResponse;
}
