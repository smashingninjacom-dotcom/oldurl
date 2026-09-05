import { supabase } from './supabaseClient';

export type PlanId = 'free' | 'starter' | 'growth' | 'agency';

export interface PlanConfig {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyLookups: number;
  monthlyAnalytics: number;
  description: string;
  badge?: string;
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyLookups: 500,
    monthlyAnalytics: 0,
    description: 'For individuals & quick tests',
    features: [
      '500 domain lookups / mo',
      'Domain expiry & WHOIS check',
      'Domain Rating (DR) score',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    monthlyPrice: 19,
    annualPrice: 15,
    monthlyLookups: 3500,
    monthlyAnalytics: 100,
    description: 'For freelancers & small builders',
    features: [
      '3,500 domain lookups / mo',
      'Bulk CSV & XLSX upload',
      'Export to CSV & PDF',
      '100 deep domain analytics',
      'Search history',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan',
    monthlyPrice: 49,
    annualPrice: 39,
    monthlyLookups: 20000,
    monthlyAnalytics: 300,
    badge: 'Most Popular',
    description: 'For SEOs & growing teams',
    features: [
      '20,000 domain lookups / mo',
      'Fast bulk CSV / XML uploads',
      '300 deep domain analytics',
      'Authority backlink breakdown',
      'Priority email support',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency Plan',
    monthlyPrice: 99,
    annualPrice: 79,
    monthlyLookups: 55000,
    monthlyAnalytics: 1500,
    description: 'For high-volume crawlers',
    features: [
      '55,000 domain lookups / mo',
      '1,500 deep domain analytics',
      'Referring domain breakdown',
      'Priority domain highlighting',
      'Dedicated account manager',
    ],
  },
};

export interface UserQuotaData {
  planId: PlanId;
  planName: string;
  plan: PlanConfig;
  lookupsLimit: number;
  lookupsUsed: number;
  lookupsRemaining: number;
  lookupsPercent: number;
  analyticsLimit: number;
  analyticsUsed: number;
  analyticsRemaining: number;
  analyticsPercent: number;
}

export function parsePlanId(planName?: string): PlanId {
  if (!planName) return 'free';
  const lower = planName.toLowerCase().trim();
  if (lower.includes('agency')) return 'agency';
  if (lower.includes('growth')) return 'growth';
  if (lower.includes('starter')) return 'starter';
  return 'free';
}

export function getUserQuotaData(profile?: any): UserQuotaData {
  let p = profile;
  if (!p && typeof window !== 'undefined') {
    try {
      const cachedUser = localStorage.getItem('oldurl_cached_user');
      const uid = cachedUser ? JSON.parse(cachedUser)?.id : null;
      if (uid) {
        const raw = localStorage.getItem(`oldurl_cached_profile_${uid}`);
        if (raw) p = JSON.parse(raw);
      }
    } catch (e) {}
  }

  const planId = parsePlanId(p?.plan);
  const plan = PLANS[planId] || PLANS.free;

  const lookupsLimit = p?.quota_limit ?? plan.monthlyLookups;
  const rawUsed = Math.max(0, Number(p?.quota_used) || 0);
  // Auto-heal contaminated legacy quota_used if it was accidentally set to all-time domain history (> lookupsLimit on free plan)
  const lookupsUsed = (rawUsed > lookupsLimit && planId === 'free') ? 0 : rawUsed;
  const lookupsRemaining = Math.max(0, lookupsLimit - lookupsUsed);
  const lookupsPercent = lookupsLimit > 0 ? Math.min(100, Math.round((lookupsUsed / lookupsLimit) * 100)) : 0;

  if (typeof window !== 'undefined' && p && rawUsed > lookupsLimit && planId === 'free') {
    try {
      p.quota_used = 0;
      const cachedUser = localStorage.getItem('oldurl_cached_user');
      const uid = cachedUser ? JSON.parse(cachedUser)?.id : null;
      if (uid) {
        localStorage.setItem(`oldurl_cached_profile_${uid}`, JSON.stringify(p));
        localStorage.setItem('oldurl_cached_profile', JSON.stringify(p));
        supabase.from('profiles').update({ quota_used: 0 }).eq('id', uid).then(() => {});
      }
    } catch (e) {}
  }

  const analyticsLimit = p?.analytics_limit ?? plan.monthlyAnalytics;
  const analyticsUsed = Math.max(0, Number(p?.analytics_used) || 0);
  const analyticsRemaining = Math.max(0, analyticsLimit - analyticsUsed);
  const analyticsPercent = analyticsLimit > 0 ? Math.min(100, Math.round((analyticsUsed / analyticsLimit) * 100)) : 0;

  return {
    planId,
    planName: plan.name,
    plan,
    lookupsLimit,
    lookupsUsed,
    lookupsRemaining,
    lookupsPercent,
    analyticsLimit,
    analyticsUsed,
    analyticsRemaining,
    analyticsPercent,
  };
}

export async function consumeLookups(count: number): Promise<UserQuotaData> {
  let profile: any = null;
  let uid = 'guest';
  if (typeof window !== 'undefined') {
    try {
      const cachedUser = localStorage.getItem('oldurl_cached_user');
      if (cachedUser) uid = JSON.parse(cachedUser)?.id || 'guest';
      const raw = localStorage.getItem(`oldurl_cached_profile_${uid}`) || localStorage.getItem('oldurl_cached_profile');
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}
  }

  const currentQuota = getUserQuotaData(profile);
  const newLookupsUsed = currentQuota.lookupsUsed + count;

  const updatedProfile = {
    ...(profile || {}),
    plan: currentQuota.plan.name,
    quota_limit: currentQuota.lookupsLimit,
    quota_used: newLookupsUsed,
    analytics_limit: currentQuota.analyticsLimit,
    analytics_used: currentQuota.analyticsUsed,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`oldurl_cached_profile_${uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem('oldurl_cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('oldurl_quota_updated', { detail: updatedProfile }));
    } catch (e) {}
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          quota_used: newLookupsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
  } catch (e) {}

  return getUserQuotaData(updatedProfile);
}

export async function consumeAnalytics(count: number): Promise<UserQuotaData> {
  let profile: any = null;
  let uid = 'guest';
  if (typeof window !== 'undefined') {
    try {
      const cachedUser = localStorage.getItem('oldurl_cached_user');
      if (cachedUser) uid = JSON.parse(cachedUser)?.id || 'guest';
      const raw = localStorage.getItem(`oldurl_cached_profile_${uid}`) || localStorage.getItem('oldurl_cached_profile');
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}
  }

  const currentQuota = getUserQuotaData(profile);
  const newAnalyticsUsed = currentQuota.analyticsUsed + count;

  const updatedProfile = {
    ...(profile || {}),
    plan: currentQuota.plan.name,
    quota_limit: currentQuota.lookupsLimit,
    quota_used: currentQuota.lookupsUsed,
    analytics_limit: currentQuota.analyticsLimit,
    analytics_used: newAnalyticsUsed,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`oldurl_cached_profile_${uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem('oldurl_cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('oldurl_quota_updated', { detail: updatedProfile }));
    } catch (e) {}
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          analytics_used: newAnalyticsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
  } catch (e) {}

  return getUserQuotaData(updatedProfile);
}


export async function switchUserPlan(targetPlanId: PlanId): Promise<UserQuotaData> {
  const plan = PLANS[targetPlanId] || PLANS.free;

  let profile: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('oldurl_cached_profile');
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}
  }

  const updatedProfile = {
    ...(profile || {}),
    plan: plan.name,
    quota_limit: plan.monthlyLookups,
    quota_used: profile?.quota_used ?? 0,
    analytics_limit: plan.monthlyAnalytics,
    analytics_used: profile?.analytics_used ?? 0,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('oldurl_cached_profile', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('oldurl_quota_updated', { detail: updatedProfile }));
    } catch (e) {}
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          plan: plan.name,
          quota_limit: plan.monthlyLookups,
          analytics_limit: plan.monthlyAnalytics,
          updated_at: new Date().toISOString(),
        });
    }
  } catch (e) {}

  return getUserQuotaData(updatedProfile);
}
