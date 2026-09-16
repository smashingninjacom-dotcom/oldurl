import { NextRequest, NextResponse } from 'next/server';
import { fetchAhrefsDomainRating, fetchFullDomainMetrics } from '@/lib/ahrefs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Ahrefs Domain Rating & Referring Domains API Endpoint
 * Bridge to Ahrefs Public Domain Rating & Authority Intelligence
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || searchParams.get('domain');
  const full = searchParams.get('full') === 'true' || searchParams.get('detailed') === 'true';

  if (!target) {
    return NextResponse.json(
      {
        error: 'Missing required parameter: target or domain (e.g. ?target=ahrefs.com)',
      },
      { status: 400 }
    );
  }

  if (full) {
    const fullMetrics = await fetchFullDomainMetrics(target);
    return NextResponse.json({
      success: true,
      ...fullMetrics,
      attribution: 'Domain Rating & Referring Mentions by Ahrefs & OldURL Intelligence',
    });
  }

  const result = await fetchAhrefsDomainRating(target);

  if (!result) {
    // Return full intelligence fallback if direct Ahrefs key isn't provided
    const fallbackMetrics = await fetchFullDomainMetrics(target);
    return NextResponse.json({
      domain: target,
      dr: fallbackMetrics.dr,
      domain_rating: { domain_rating: fallbackMetrics.dr },
      da: fallbackMetrics.da,
      tf: fallbackMetrics.tf,
      referringDomains: fallbackMetrics.referringDomains,
      backlinks: fallbackMetrics.backlinks,
      topAuthorityLinks: fallbackMetrics.topAuthorityLinks,
      source: 'intel',
      attribution: 'Domain Rating by Ahrefs (https://ahrefs.com/)',
    }, { status: 200 });
  }

  return NextResponse.json({
    domain: result.domain,
    domain_rating: {
      domain_rating: result.dr,
    },
    dr: result.dr,
    source: result.source,
    attribution: 'Domain Rating by Ahrefs (https://ahrefs.com/)',
    license: result.license,
  });
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const target = body.target || body.domain;
    const targets = body.targets || body.domains;

    if (Array.isArray(targets) && targets.length > 0) {
      const results = await Promise.all(
        targets.slice(0, 50).map(async (dom: string) => {
          const res = await fetchAhrefsDomainRating(dom);
          return {
            domain: dom,
            dr: res?.dr ?? null,
            source: res?.source ?? 'unavailable',
          };
        })
      );

      return NextResponse.json({
        success: true,
        attribution: 'Domain Rating by Ahrefs (https://ahrefs.com/)',
        license: 'https://ahrefs.com/legal/domain-rating-license',
        results,
      });
    }

    if (!target) {
      return NextResponse.json(
        { error: 'Please provide target domain string or domains array.' },
        { status: 400 }
      );
    }

    const result = await fetchAhrefsDomainRating(target);

    return NextResponse.json({
      domain: target,
      domain_rating: {
        domain_rating: result?.dr ?? 0,
      },
      dr: result?.dr ?? 0,
      source: result?.source ?? 'unavailable',
      attribution: 'Domain Rating by Ahrefs (https://ahrefs.com/)',
      license: result?.license ?? 'https://ahrefs.com/legal/domain-rating-license',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process Ahrefs Domain Rating request', details: err?.message },
      { status: 500 }
    );
  }
}
