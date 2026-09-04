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

export interface SearchSession {
  id: string;
  name: string;
  createdAt: string;
  domainCount: number;
  items: StoredSearchItem[];
}

const STORAGE_KEY = 'oldurl_local_search_history';
const SESSIONS_STORAGE_KEY = 'oldurl_search_sessions';

// In-memory cache for instantaneous 0ms tab switching
let memoryCache: StoredSearchItem[] | null = null;
let lastCloudFetchTime = 0;
let isCloudFetching = false;

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

export function getSearchSessions(): SearchSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  // Auto-generate a default session from search history if none saved yet
  const history = getLocalSearchHistory();
  if (history.length > 0) {
    return [
      {
        id: 'session_initial',
        name: `Recent Search (${history.length} domain${history.length > 1 ? 's' : ''})`,
        createdAt: history[0]?.createdAt || new Date().toISOString(),
        domainCount: history.length,
        items: history,
      },
    ];
  }

  return [];
}

export function saveSearchSession(name: string, items: StoredSearchItem[]): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  try {
    const existing = getSearchSessions().filter((s) => s.id !== 'session_initial');
    const newSession: SearchSession = {
      id: `session_${Date.now()}`,
      name: name || (items.length === 1 ? items[0].domain : `${items.length} Domains Checked`),
      createdAt: items[0]?.createdAt || new Date().toISOString(),
      domainCount: items.length,
      items: items.map((it, idx) => ({ ...it, id: String(idx + 1).padStart(2, '0') })),
    };
    const updated = [newSession, ...existing.filter((s) => s.id !== newSession.id)].slice(0, 50);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}

export function deleteSearchSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSearchSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {}
}

export function getLastScannedBatch(): StoredSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('last_scanned_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          ...item,
          id: String(idx + 1).padStart(2, '0'),
        }));
      }
    }
  } catch (e) {}

  // Fallback to the latest search session if present
  const sessions = getSearchSessions();
  if (sessions.length > 0 && sessions[0].items && sessions[0].items.length > 0) {
    return sessions[0].items;
  }

  return [];
}

export function getLocalSearchHistory(): StoredSearchItem[] {
  if (typeof window === 'undefined') return [];
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  const map = new Map<string, StoredSearchItem>();

  const loadFromRaw = (raw: string | null) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((item: any) => {
          if (item && item.domain) {
            const dom = String(item.domain).toLowerCase().trim();
            if (dom) {
              const existing = map.get(dom);
              const itemDate = item.createdAt || item.created_at || new Date().toISOString();
              if (!existing) {
                map.set(dom, {
                  id: '01',
                  domain: item.domain.trim(),
                  status: item.status || 'Available',
                  daysLeft: item.daysLeft || item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
                  dr: Number(item.dr) || 0,
                  registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
                  refDomains: item.refDomains || item.ref_domains || 0,
                  backlinks: item.backlinks || 0,
                  createdAt: itemDate,
                });
              }
            }
          }
        });
      }
    } catch (e) {}
  };

  try {
    loadFromRaw(localStorage.getItem(STORAGE_KEY));
  } catch (e) {}

  // Sort strictly by most recently searched first (createdAt descending)
  const result = Array.from(map.values())
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((item, idx) => ({
      ...item,
      id: String(idx + 1).padStart(2, '0'),
    }));

  memoryCache = result;
  return result;
}

export function saveLocalSearchHistory(items: StoredSearchItem[], sessionLabel?: string): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  try {
    // Also save search session for search-wise grouping
    saveSearchSession(sessionLabel || (items.length === 1 ? items[0].domain : `${items.length} Domains Check`), items);

    const existing = getLocalSearchHistory();
    const existingMap = new Map<string, StoredSearchItem>();
    const nowIso = new Date().toISOString();

    // New items take precedence (updating the timestamp and metrics for that domain)
    items.forEach((it) => {
      if (it && it.domain) {
        const dom = it.domain.toLowerCase().trim();
        existingMap.set(dom, {
          ...it,
          domain: it.domain.trim(),
          createdAt: it.createdAt || nowIso,
        });
      }
    });

    // Older items added only if not already present
    existing.forEach((it) => {
      if (it && it.domain) {
        const key = it.domain.toLowerCase().trim();
        if (!existingMap.has(key)) {
          existingMap.set(key, it);
        }
      }
    });

    // Keep most recent searches sorted by createdAt desc
    const merged = Array.from(existingMap.values())
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 1000)
      .map((item, idx) => ({
        ...item,
        id: String(idx + 1).padStart(2, '0'),
      }));

    memoryCache = merged;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 200)));
      } catch (err) {}
    }
  } catch (e) {}
}

export async function deleteHistoryItem(domain: string): Promise<void> {
  if (typeof window === 'undefined' || !domain) return;
  const lower = domain.toLowerCase().trim();
  const current = getLocalSearchHistory();
  const updated = current
    .filter((it) => it.domain.toLowerCase().trim() !== lower)
    .map((it, idx) => ({
      ...it,
      id: String(idx + 1).padStart(2, '0'),
    }));
  memoryCache = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}

  // Also remove from sessions
  try {
    const sessions = getSearchSessions().map((s) => ({
      ...s,
      items: s.items.filter((it) => it.domain.toLowerCase().trim() !== lower),
      domainCount: s.items.filter((it) => it.domain.toLowerCase().trim() !== lower).length,
    })).filter((s) => s.domainCount > 0);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      await supabase.from('search_history').delete().eq('user_id', user.id).eq('domain', domain.trim());
    }
  } catch (e) {}
}

export async function clearSearchHistory(): Promise<void> {
  if (typeof window === 'undefined') return;
  memoryCache = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    sessionStorage.removeItem('last_scanned_results');
  } catch (e) {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      await supabase.from('search_history').delete().eq('user_id', user.id);
    }
  } catch (e) {}
}

export async function syncToSupabase(items: StoredSearchItem[]): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || !items.length) return;

    // Deduplicate input chunk by domain
    const dedupedMap = new Map<string, StoredSearchItem>();
    items.forEach((it) => {
      if (it && it.domain) {
        dedupedMap.set(it.domain.toLowerCase().trim(), it);
      }
    });
    const uniqueList = Array.from(dedupedMap.values());

    const dbChunks = 50;
    for (let i = 0; i < uniqueList.length; i += dbChunks) {
      const chunk = uniqueList.slice(i, i + dbChunks).map((f) => ({
        user_id: user.id,
        domain: f.domain.trim(),
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

export async function fetchAllSearchHistory(forceRefresh = false): Promise<{
  items: StoredSearchItem[];
  totalChecked: number;
  availableCount: number;
  registeredCount: number;
  avgDr: number;
}> {
  const localItems = getLocalSearchHistory();

  const now = Date.now();
  // Return cached data immediately if queried within 30s
  if (!forceRefresh && lastCloudFetchTime > 0 && now - lastCloudFetchTime < 30000 && memoryCache && memoryCache.length > 0) {
    const total = memoryCache.length;
    const avail = memoryCache.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = Math.round(
      memoryCache.reduce((acc, s) => acc + (s.dr || 0), 0) / (total || 1)
    );
    return {
      items: memoryCache,
      totalChecked: total,
      availableCount: avail,
      registeredCount: reg,
      avgDr: avg,
    };
  }

  if (isCloudFetching) {
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

  try {
    isCloudFetching = true;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      // Fetch only recent searches (up to 250) to prevent old bulk spam dumps
      const { data: cloudHistory, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(250);

      lastCloudFetchTime = Date.now();

      if (!error && cloudHistory && cloudHistory.length > 0) {
        // Strict deduplication of cloud history by domain
        const uniqueCloudMap = new Map<string, StoredSearchItem>();
        cloudHistory.forEach((item) => {
          if (item && item.domain) {
            const lower = item.domain.toLowerCase().trim();
            if (!uniqueCloudMap.has(lower)) {
              uniqueCloudMap.set(lower, {
                id: '01',
                domain: item.domain,
                status: item.status || 'Available',
                daysLeft: item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
                dr: Number(item.dr) || 0,
                registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
                createdAt: item.created_at,
              });
            }
          }
        });

        // Master merge between cloud and local, strictly deduplicated by domain
        const masterMap = new Map<string, StoredSearchItem>();
        localItems.forEach((it) => {
          if (it && it.domain) masterMap.set(it.domain.toLowerCase().trim(), it);
        });
        uniqueCloudMap.forEach((it, key) => {
          if (!masterMap.has(key)) {
            masterMap.set(key, it);
          }
        });

        const finalItems = Array.from(masterMap.values())
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          })
          .map((item, idx) => ({
            ...item,
            id: String(idx + 1).padStart(2, '0'),
          }));

        memoryCache = finalItems;

        const total = finalItems.length;
        const avail = finalItems.filter((s) => s.status === 'Available').length;
        const reg = total - avail;
        const avg = Math.round(
          finalItems.reduce((acc, s) => acc + (s.dr || 0), 0) / (total || 1)
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
  } catch (e) {
  } finally {
    isCloudFetching = false;
  }

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
