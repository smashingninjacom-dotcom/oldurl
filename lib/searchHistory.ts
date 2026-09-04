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

export function formatCheckDate(dateStr?: string): string {
  if (!dateStr || dateStr === 'Just now' || dateStr === 'Recent') return 'Just now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

export function getLocalSearchHistory(): StoredSearchItem[] {
  if (typeof window === 'undefined') return [];
  const map = new Map<string, StoredSearchItem>();

  const loadFromRaw = (raw: string | null) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((item: any) => {
          if (item && item.domain) {
            const dom = String(item.domain).toLowerCase().trim();
            if (dom && !map.has(dom)) {
              map.set(dom, {
                id: '01',
                domain: item.domain,
                status: item.status || 'Available',
                daysLeft: item.daysLeft || item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
                dr: Number(item.dr) || 0,
                registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
                refDomains: item.refDomains || item.ref_domains || 0,
                backlinks: item.backlinks || 0,
                createdAt: item.createdAt || item.created_at || new Date().toISOString(),
              });
            }
          }
        });
      }
    } catch (e) {}
  };

  try {
    loadFromRaw(localStorage.getItem(STORAGE_KEY));
    loadFromRaw(sessionStorage.getItem('last_scanned_results'));
    loadFromRaw(localStorage.getItem('search_history'));
    loadFromRaw(localStorage.getItem('oldurl_search_history'));
  } catch (e) {}

  return Array.from(map.values()).map((item, idx) => ({
    ...item,
    id: String(idx + 1).padStart(2, '0'),
  }));
}

export function saveLocalSearchHistory(items: StoredSearchItem[]): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  try {
    const existing = getLocalSearchHistory();
    const existingMap = new Map<string, StoredSearchItem>();
    const nowIso = new Date().toISOString();

    // New items take precedence
    items.forEach((it, idx) => {
      existingMap.set(it.domain.toLowerCase(), {
        ...it,
        id: String(idx + 1).padStart(2, '0'),
        createdAt: it.createdAt || nowIso,
      });
    });

    existing.forEach((it) => {
      if (!existingMap.has(it.domain.toLowerCase())) {
        existingMap.set(it.domain.toLowerCase(), it);
      }
    });

    const merged = Array.from(existingMap.values());

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 5000)));
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
        .limit(100000);

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
