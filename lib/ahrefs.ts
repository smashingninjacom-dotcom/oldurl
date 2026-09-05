/**
 * Ahrefs Domain Rating (DR) API Client
 * Docs: https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free
 * Endpoint: GET https://api.ahrefs.com/v3/public/domain-rating-free?target=<domain>
 *
 * Attribution required by Ahrefs: "Domain Rating by Ahrefs" (https://ahrefs.com/)
 */

export interface AhrefsDrResponse {
  dr: number;
  domain: string;
  source: 'ahrefs' | 'cache' | 'fallback';
  license: string;
}

// In-memory cache for Ahrefs DR results to ensure high performance and minimize API calls (24h TTL)
const ahrefsDrCache = new Map<string, { dr: number; timestamp: number }>();
const DR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchAhrefsDomainRating(domain: string): Promise<AhrefsDrResponse | null> {
  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/[^a-z0-9.-]/g, '');

  if (!cleanDomain || !cleanDomain.includes('.')) {
    return null;
  }

  // 1. Check in-memory cache first (0ms response)
  const cached = ahrefsDrCache.get(cleanDomain);
  if (cached && Date.now() - cached.timestamp < DR_CACHE_TTL_MS) {
    return {
      dr: cached.dr,
      domain: cleanDomain,
      source: 'cache',
      license: 'https://ahrefs.com/legal/domain-rating-license',
    };
  }

  // 2. Fetch Ahrefs API key from environment
  const apiKey =
    process.env.AHREFS_API_KEY ||
    process.env.AHREFS_API_TOKEN ||
    process.env.AHREFS_TOKEN ||
    process.env.NEXT_PUBLIC_AHREFS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://api.ahrefs.com/v3/public/domain-rating-free?target=${encodeURIComponent(cleanDomain)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const rawDr =
        typeof data?.domain_rating?.domain_rating === 'number'
          ? data.domain_rating.domain_rating
          : typeof data?.domain_rating === 'number'
          ? data.domain_rating
          : null;

      if (rawDr !== null && !isNaN(rawDr)) {
        const roundedDr = Math.min(100, Math.max(0, Math.round(rawDr)));
        ahrefsDrCache.set(cleanDomain, { dr: roundedDr, timestamp: Date.now() });
        return {
          dr: roundedDr,
          domain: cleanDomain,
          source: 'ahrefs',
          license: data?.domain_rating?.license || data?.license || 'https://ahrefs.com/legal/domain-rating-license',
        };
      }
    }
  } catch (error) {
    console.warn('Ahrefs Domain Rating API notice:', error);
  }

  return null;
}
