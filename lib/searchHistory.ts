import { supabase } from './supabaseClient';

export interface StoredSearchItem {
  id: string;
  domain: string;
  status: 'Available' | 'Expiring Soon' | 'Registered';
  daysLeft: string;
  dr: number;
  registrar: string;
  refDomains?: number;
  backlinks?: number;
  createdAt?: string;
}

const STORAGE_KEY = 'oldurl_local_search_history';

export function getLocalSearchHistory(): StoredSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem('last_scanned_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: String(idx + 1).padStart(2, '0'),
          domain: item.domain,
          status: item.status || 'Available',
          daysLeft: item.daysLeft || item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
          dr: Number(item.dr) || 0,
          registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
          refDomains: item.refDomains || item.ref_domains || 0,
          backlinks: item.backlinks || 0,
          createdAt: item.createdAt || item.created_at || 'Just now',
        }));
      }
    }
  } catch (e) {}
  return [];
}

export function saveLocalSearchHistory(items: StoredSearchItem[]): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  try {
    const existing = getLocalSearchHistory();
    const existingMap = new Map<string, StoredSearchItem>();

    // New items take precedence
    items.forEach((it, idx) => {
      existingMap.set(it.domain.toLowerCase(), {
        ...it,
        id: String(idx + 1).padStart(2, '0'),
      });
    });

    existing.forEach((it) => {
      if (!existingMap.has(it.domain.toLowerCase())) {
        existingMap.set(it.domain.toLowerCase(), it);
      }
    });

    const merged = Array.from(existingMap.values()).slice(0, 2500);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      // If quota exceeded, store top 500
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 500)));
      } catch (err) {}
    }

    try {
      sessionStorage.setItem('last_scanned_results', JSON.stringify(items));
    } catch (e) {}
  } catch (e) {}
}

export async function syncToSupabase(items: StoredSearchItem[]): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !items.length) return;

    const dbChunks = 50;
    for (let i = 0; i < items.length; i += dbChunks) {
      const chunk = items.slice(i, i + dbChunks).map((f) => ({
        user_id: user.id,
        domain: f.domain,
        status: f.status,
        dr: Number(f.dr) || 0,
        days_left: f.daysLeft || 'Active',
        registrar: f.registrar || (f.status === 'Available' ? '—' : 'Registered / Active'),
      }));
      await supabase.from('search_history').insert(chunk);
    }
  } catch (e) {
    console.warn('Sync to Supabase note:', e);
  }
}

export async function fetchAllSearchHistory(): Promise<{
  items: StoredSearchItem[];
  totalChecked: number;
  availableCount: number;
  registeredCount: number;
  avgDr: number;
}> {
  const localItems = getLocalSearchHistory();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: cloudHistory, count, error } = await supabase
        .from('search_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2500);

      if (!error && cloudHistory && cloudHistory.length > 0) {
        const cloudMapped: StoredSearchItem[] = cloudHistory.map((item, idx) => ({
          id: String(idx + 1).padStart(2, '0'),
          domain: item.domain,
          status: item.status || 'Available',
          daysLeft: item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
          dr: Number(item.dr) || 0,
          registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
          createdAt: item.created_at,
        }));

        const finalItems = cloudMapped.length >= localItems.length ? cloudMapped : localItems;
        const total = count || finalItems.length;
        const avail = finalItems.filter((s) => s.status === 'Available').length;
        const reg = total - avail;
        const avg = Math.round(
          finalItems.reduce((acc, s) => acc + (s.dr || 0), 0) / (finalItems.length || 1)
        );

        return {
          items: finalItems,
          totalChecked: total,
          availableCount: avail,
          registeredCount: reg,
          avgDr: avg,
        };
      }
    }
  } catch (e) {}

  // Fallback to local storage (works for both guests and authenticated users)
  const total = localItems.length;
  const avail = localItems.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = Math.round(
    localItems.reduce((acc, s) => acc + (s.dr || 0), 0) / (total || 1)
  );

  return {
    items: localItems,
    totalChecked: total,
    availableCount: avail,
    registeredCount: reg,
    avgDr: avg,
  };
}
