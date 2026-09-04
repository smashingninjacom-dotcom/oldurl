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
const STATS_STORAGE_KEY = 'oldurl_search_history_stats';

export interface HistoryStats {
  totalChecked: number;
  availableCount: number;
  registeredCount: number;
  avgDr: number;
}

// In-memory cache for instantaneous 0ms tab switching
let memoryCache: StoredSearchItem[] | null = null;
let cachedStatsMemory: HistoryStats | null = null;
let lastCloudFetchTime = 0;
let isCloudFetching = false;

// IndexedDB persistence for handling tens of thousands of domains smoothly
const IDB_NAME = 'oldurl_local_db';
const IDB_VERSION = 1;
const IDB_STORE = 'search_history';

function openHistoryDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'domain' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function saveToIndexedDB(items: StoredSearchItem[]): Promise<void> {
  if (!items || !items.length || typeof window === 'undefined') return;
  try {
    const db = await openHistoryDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    items.forEach((item) => {
      if (item && item.domain) {
        store.put(item);
      }
    });
    tx.oncomplete = () => db.close();
  } catch (e) {}
}

export async function loadFromIndexedDB(): Promise<StoredSearchItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await openHistoryDB();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          db.close();
          const list = req.result;
          if (Array.isArray(list) && list.length > 0) {
            resolve(list);
          } else {
            resolve([]);
          }
        };
        req.onerror = () => {
          db.close();
          resolve([]);
        };
      } catch (e) {
        db.close();
        resolve([]);
      }
    });
  } catch (e) {
    return [];
  }
}

// Automatically bootstrap memoryCache from IndexedDB in browser
if (typeof window !== 'undefined') {
  loadFromIndexedDB().then((idbItems) => {
    if (idbItems && idbItems.length > 0) {
      if (!memoryCache || idbItems.length > memoryCache.length) {
        memoryCache = idbItems.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        }).map((item, idx) => ({ ...item, id: String(idx + 1).padStart(2, '0') }));

        const total = memoryCache.length;
        const avail = memoryCache.filter((s) => s.status === 'Available').length;
        const reg = total - avail;
        const avg = total > 0 ? Math.round(memoryCache.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
        const stats = { totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg };
        saveCachedHistoryStats(stats);
        try {
          window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: total } }));
        } catch (e) {}
      }
    }
  }).catch(() => {});
}

export function getCachedHistoryStats(): HistoryStats {
  if (cachedStatsMemory && cachedStatsMemory.totalChecked > 0) {
    return cachedStatsMemory;
  }
  if (typeof window === 'undefined') {
    return { totalChecked: 0, availableCount: 0, registeredCount: 0, avgDr: 0 };
  }
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalChecked === 'number' && parsed.totalChecked > 0) {
        cachedStatsMemory = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  const local = getLocalSearchHistory();
  const total = local.length;
  const avail = local.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = total > 0 ? Math.round(local.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
  const stats = { totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg };
  if (total > 0) {
    cachedStatsMemory = stats;
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}
  }
  return stats;
}

export function saveCachedHistoryStats(stats: HistoryStats): void {
  cachedStatsMemory = stats;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}
}

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

  return [];
}

export function saveSearchSession(name: string, items: StoredSearchItem[]): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  try {
    const existing = getSearchSessions();
    const sessionName = name || (items.length === 1 ? items[0].domain : `${items.length} Domains Checked`);
    const newSession: SearchSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      createdAt: items[0]?.createdAt || new Date().toISOString(),
      domainCount: items.length,
      items: items.map((it, idx) => ({ ...it, id: String(idx + 1).padStart(2, '0') })),
    };
    const updated = [newSession, ...existing.filter((s) => s.id !== newSession.id)].slice(0, 100);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('oldurl_latest_search_batch', JSON.stringify(newSession.items));
    try {
      sessionStorage.setItem('last_scanned_results', JSON.stringify(newSession.items));
    } catch (err) {}
  } catch (e) {}
}

export function deleteSearchSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSearchSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {}
}

let latestBatchMemory: StoredSearchItem[] | null = null;
let pendingDomainsMemory: string[] | null = null;
let pendingAnalyticsMemory: string[] | null = null;

export function setPendingDomainsToScan(domains: string[]): void {
  if (!domains || !domains.length) return;
  pendingDomainsMemory = domains;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('pending_domains', domains.join('\n'));
    } catch (e) {
      try {
        sessionStorage.setItem('pending_domains', domains.slice(0, 3000).join('\n'));
      } catch (err) {}
    }
  }
}

export function getPendingDomainsToScan(): string[] {
  if (pendingDomainsMemory && pendingDomainsMemory.length > 0) {
    const list = [...pendingDomainsMemory];
    pendingDomainsMemory = null;
    return list;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('pending_domains');
    if (raw) {
      sessionStorage.removeItem('pending_domains');
      const list = raw.split(/[\r\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (list.length > 0) return list;
    }
  } catch (e) {}
  return [];
}

export function setPendingAnalyticsDomains(domains: string[]): void {
  if (!domains || !domains.length) return;
  pendingAnalyticsMemory = domains;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('pending_analytics_domains', domains.join('\n'));
    } catch (e) {
      try {
        sessionStorage.setItem('pending_analytics_domains', domains.slice(0, 3000).join('\n'));
      } catch (err) {}
    }
  }
}

export function getPendingAnalyticsDomains(): string[] {
  if (pendingAnalyticsMemory && pendingAnalyticsMemory.length > 0) {
    const list = [...pendingAnalyticsMemory];
    pendingAnalyticsMemory = null;
    return list;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('pending_analytics_domains');
    if (raw) {
      sessionStorage.removeItem('pending_analytics_domains');
      const list = raw.split(/[\r\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (list.length > 0) return list;
    }
  } catch (e) {}
  return [];
}

export function setLastScannedBatch(items: StoredSearchItem[]): void {
  if (!items || !items.length) return;
  latestBatchMemory = items;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('last_scanned_results', JSON.stringify(items.slice(0, 2000)));
    } catch (e) {}
  }
}

export function getLastScannedBatch(): StoredSearchItem[] {
  if (latestBatchMemory && latestBatchMemory.length > 0) {
    return latestBatchMemory;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('last_scanned_results') || localStorage.getItem('oldurl_latest_search_batch');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        latestBatchMemory = parsed;
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

export function getLocalSearchHistory(forceFresh = false): StoredSearchItem[] {
  if (typeof window === 'undefined') return [];
  if (!forceFresh && memoryCache && memoryCache.length > 0) {
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

  try {
    // Also load from all stored sessions to ensure complete total history
    const sessions = getSearchSessions();
    sessions.forEach((sess) => {
      if (sess.items && Array.isArray(sess.items)) {
        sess.items.forEach((item) => {
          if (item && item.domain) {
            const dom = String(item.domain).toLowerCase().trim();
            if (dom && !map.has(dom)) {
              map.set(dom, {
                id: '01',
                domain: item.domain.trim(),
                status: item.status || 'Available',
                daysLeft: item.daysLeft || (item.status === 'Available' ? 'Dropped' : '365d'),
                dr: Number(item.dr) || 0,
                registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
                refDomains: item.refDomains || 0,
                backlinks: item.backlinks || 0,
                createdAt: item.createdAt || sess.createdAt || new Date().toISOString(),
              });
            }
          }
        });
      }
    });
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
    lastCloudFetchTime = 0;
    // Also save search session for search-wise grouping
    saveSearchSession(sessionLabel || (items.length === 1 ? items[0].domain : `${items.length} Domains Check`), items);

    const existing = getLocalSearchHistory(true);
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

    // Keep all searches sorted by createdAt desc (up to 10,000)
    const merged = Array.from(existingMap.values())
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10000)
      .map((item, idx) => ({
        ...item,
        id: String(idx + 1).padStart(2, '0'),
      }));

    memoryCache = merged;
    const total = merged.length;
    const avail = merged.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = total > 0 ? Math.round(merged.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
    saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg });

    saveToIndexedDB(merged);

    try {
      window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: merged.length } }));
    } catch (e) {}

    try {
      const cached = localStorage.getItem('oldurl_cached_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        const newUsed = Math.max(Number(parsed.quota_used) || 0, total);
        if (newUsed !== parsed.quota_used) {
          parsed.quota_used = newUsed;
          localStorage.setItem('oldurl_cached_profile', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('oldurl_quota_updated', { detail: parsed }));
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              supabase.from('profiles').update({ quota_used: newUsed }).eq('id', session.user.id).then(() => {});
            }
          });
        }
      }
    } catch (e) {}
  } catch (e) {}
}

export async function deleteHistoryItem(domain: string): Promise<void> {
  if (typeof window === 'undefined' || !domain) return;
  const lower = domain.toLowerCase().trim();
  const current = getLocalSearchHistory(true);
  const updated = current
    .filter((it) => it.domain.toLowerCase().trim() !== lower)
    .map((it, idx) => ({
      ...it,
      id: String(idx + 1).padStart(2, '0'),
    }));
  memoryCache = updated;
  const total = updated.length;
  const avail = updated.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = total > 0 ? Math.round(updated.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
  saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg });

  saveToIndexedDB(updated);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 1000)));
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
    window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: updated.length } }));
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
  saveCachedHistoryStats({ totalChecked: 0, availableCount: 0, registeredCount: 0, avgDr: 0 });
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    sessionStorage.removeItem('last_scanned_results');
  } catch (e) {}

  try {
    const db = await openHistoryDB();
    if (db) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => db.close();
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: 0 } }));
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
      try {
        await supabase.from('search_history').upsert(chunk, { onConflict: 'user_id,domain' });
      } catch (err) {
        await supabase.from('search_history').insert(chunk);
      }
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
  const localItems = getLocalSearchHistory(forceRefresh);

  const now = Date.now();
  // Return cached data immediately if queried within 5 minutes and not forceRefresh
  if (!forceRefresh && lastCloudFetchTime > 0 && now - lastCloudFetchTime < 300000 && memoryCache && memoryCache.length > 0) {
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
    const active = (memoryCache && memoryCache.length > 0) ? memoryCache : localItems;
    const total = active.length;
    const avail = active.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = Math.round(
      active.reduce((acc, s) => acc + (s.dr || 0), 0) / (total || 1)
    );
    return {
      items: active,
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
      // Fetch all historical searches using paginated ranges to bypass Supabase 1000 row REST limit
      const allCloudHistory: any[] = [];
      let from = 0;
      const batchSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error || !data || data.length === 0) {
          break;
        }

        allCloudHistory.push(...data);

        if (data.length < batchSize || allCloudHistory.length >= 50000) {
          break;
        }

        from += batchSize;
      }

      lastCloudFetchTime = Date.now();

      if (allCloudHistory.length > 0) {
        // Strict deduplication of cloud history by domain
        const uniqueCloudMap = new Map<string, StoredSearchItem>();
        allCloudHistory.forEach((item) => {
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
        saveToIndexedDB(finalItems);

        // Persist to local storage (up to 1,000 for local sync bootstrap)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalItems.slice(0, 1000)));
        } catch (e) {}

        const total = finalItems.length;
        const avail = finalItems.filter((s) => s.status === 'Available').length;
        const reg = total - avail;
        const avg = Math.round(
          finalItems.reduce((acc, s) => acc + (s.dr || 0), 0) / (total || 1)
        );
        saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg });

        try {
          window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: total } }));
        } catch (e) {}

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

  // Fallback to local storage
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
