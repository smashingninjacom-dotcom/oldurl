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
  userId?: string;
  recordKey?: string;
}

export interface SearchSession {
  id: string;
  name: string;
  createdAt: string;
  domainCount: number;
  items: StoredSearchItem[];
  userId?: string;
}

export interface HistoryStats {
  totalChecked: number;
  availableCount: number;
  registeredCount: number;
  avgDr: number;
}

// In-memory cache for instantaneous 0ms tab switching
let memoryCache: StoredSearchItem[] | null = null;
let cachedStatsMemory: HistoryStats | null = null;
let cachedUserId: string | null = null;
let lastCloudFetchTime = 0;
let isCloudFetching = false;
let latestBatchMemory: StoredSearchItem[] | null = null;
let pendingDomainsMemory: string[] | null = null;
let pendingAnalyticsMemory: string[] | null = null;

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return 'guest';
  try {
    const raw = localStorage.getItem('oldurl_cached_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return u.id;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.includes('supabase.auth') || key.startsWith('sb-'))) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          const id = parsed?.user?.id || parsed?.currentSession?.user?.id || parsed?.session?.user?.id;
          if (id) return id;
        }
      }
    }
  } catch (e) {}
  return 'guest';
}

export function getStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return `oldurl_history_${uid}`;
}

export function getSessionsStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return `oldurl_sessions_${uid}`;
}

export function getStatsStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return `oldurl_stats_${uid}`;
}

// IndexedDB persistence for handling tens of thousands of domains smoothly with strict per-user isolation
const IDB_NAME = 'oldurl_local_db_v2';
const IDB_VERSION = 1;
const IDB_STORE = 'user_search_history';

function openHistoryDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'recordKey' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function loadLegacyIndexedDB(): Promise<StoredSearchItem[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open('oldurl_local_db', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('search_history')) {
          db.close();
          return resolve([]);
        }
        const tx = db.transaction('search_history', 'readonly');
        const store = tx.objectStore('search_history');
        const getReq = store.getAll();
        getReq.onsuccess = () => {
          db.close();
          if (Array.isArray(getReq.result) && getReq.result.length > 0) {
            resolve(getReq.result);
          } else {
            resolve([]);
          }
        };
        getReq.onerror = () => {
          db.close();
          resolve([]);
        };
      };
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

function isPrimaryAccount(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('oldurl_cached_user');
    if (raw) {
      const u = JSON.parse(raw);
      const email = (u?.email || u?.user_metadata?.email || '').toLowerCase();
      if (email.includes('jaysathwara96') || email.includes('jaysathwara')) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

export async function saveToIndexedDB(items: StoredSearchItem[], userId?: string): Promise<void> {
  if (!items || !items.length || typeof window === 'undefined') return;
  const uid = userId || getActiveUserId();
  try {
    const db = await openHistoryDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    items.forEach((item) => {
      if (item && item.domain) {
        const dom = item.domain.toLowerCase().trim();
        store.put({
          ...item,
          userId: uid,
          recordKey: `${uid}___${dom}`,
        });
      }
    });
    tx.oncomplete = () => db.close();
  } catch (e) {}
}

export async function loadFromIndexedDB(userId?: string): Promise<StoredSearchItem[]> {
  if (typeof window === 'undefined') return [];
  const uid = userId || getActiveUserId();
  try {
    const db = await openHistoryDB();
    if (!db) return [];
    const userItems: StoredSearchItem[] = await new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          db.close();
          const list = req.result;
          if (Array.isArray(list) && list.length > 0) {
            // Strictly filter only items belonging to THIS user
            const filtered = list.filter((it: any) => it.userId === uid || (it.recordKey && it.recordKey.startsWith(`${uid}___`)));
            resolve(filtered);
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

    if (userItems && userItems.length > 0) {
      return userItems;
    }

    // If this is the primary account (jaysathwara96@gmail.com) and v2 store was empty, migrate from legacy v1 database
    if (isPrimaryAccount() && uid !== 'guest') {
      const legacy = await loadLegacyIndexedDB();
      if (legacy && legacy.length > 0) {
        const migrated = legacy.map((item, idx) => ({
          ...item,
          id: String(idx + 1).padStart(2, '0'),
          userId: uid,
          recordKey: `${uid}___${item.domain.toLowerCase().trim()}`,
        }));
        await saveToIndexedDB(migrated, uid);
        try {
          localStorage.setItem(getStorageKey(uid), JSON.stringify(migrated.slice(0, 1000)));
        } catch (e) {}
        const total = migrated.length;
        const avail = migrated.filter((s) => s.status === 'Available').length;
        const reg = total - avail;
        const avg = total > 0 ? Math.round(migrated.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
        saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg }, uid);
        return migrated;
      }
    }

    return [];
  } catch (e) {
    return [];
  }
}

export function getCachedHistoryStats(userId?: string): HistoryStats {
  const uid = userId || getActiveUserId();
  if (cachedUserId === uid && cachedStatsMemory && cachedStatsMemory.totalChecked > 0) {
    return cachedStatsMemory;
  }
  if (typeof window === 'undefined') {
    return { totalChecked: 0, availableCount: 0, registeredCount: 0, avgDr: 0 };
  }
  try {
    const raw = localStorage.getItem(getStatsStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalChecked === 'number' && parsed.totalChecked >= 0) {
        cachedStatsMemory = parsed;
        cachedUserId = uid;
        return parsed;
      }
    }
  } catch (e) {}

  const local = getLocalSearchHistory(false, uid);
  const total = local.length;
  const avail = local.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = total > 0 ? Math.round(local.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
  const stats = { totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg };
  cachedStatsMemory = stats;
  cachedUserId = uid;
  try {
    localStorage.setItem(getStatsStorageKey(uid), JSON.stringify(stats));
  } catch (e) {}
  return stats;
}

export function saveCachedHistoryStats(stats: HistoryStats, userId?: string): void {
  const uid = userId || getActiveUserId();
  cachedStatsMemory = stats;
  cachedUserId = uid;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStatsStorageKey(uid), JSON.stringify(stats));
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

export function getSearchSessions(userId?: string): SearchSession[] {
  if (typeof window === 'undefined') return [];
  const uid = userId || getActiveUserId();
  try {
    const raw = localStorage.getItem(getSessionsStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [];
}

export function saveSearchSession(name: string, items: StoredSearchItem[], userId?: string): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  const uid = userId || getActiveUserId();
  try {
    const existing = getSearchSessions(uid);
    const sessionName = name || (items.length === 1 ? items[0].domain : `${items.length} Domains Checked`);
    const newSession: SearchSession = {
      id: `session_${Date.now()}`,
      name: sessionName,
      createdAt: items[0]?.createdAt || new Date().toISOString(),
      domainCount: items.length,
      userId: uid,
      items: items.map((it, idx) => ({ ...it, id: String(idx + 1).padStart(2, '0'), userId: uid })),
    };
    const updated = [newSession, ...existing.filter((s) => s.id !== newSession.id)].slice(0, 100);
    localStorage.setItem(getSessionsStorageKey(uid), JSON.stringify(updated));
    localStorage.setItem(`oldurl_latest_batch_${uid}`, JSON.stringify(newSession.items));
    try {
      sessionStorage.setItem('last_scanned_results', JSON.stringify(newSession.items));
    } catch (err) {}
  } catch (e) {}
}

export function deleteSearchSession(sessionId: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const uid = userId || getActiveUserId();
  try {
    const sessions = getSearchSessions(uid).filter((s) => s.id !== sessionId);
    localStorage.setItem(getSessionsStorageKey(uid), JSON.stringify(sessions));
  } catch (e) {}
}

export function resetMemoryCacheForUser(newUserId?: string): void {
  memoryCache = null;
  cachedStatsMemory = null;
  cachedUserId = newUserId || getActiveUserId();
  lastCloudFetchTime = 0;
  isCloudFetching = false;
  latestBatchMemory = null;
  pendingDomainsMemory = null;
  pendingAnalyticsMemory = null;
  if (typeof window !== 'undefined') {
    try {
      // Clear legacy global un-scoped keys so old user data never leaks into new accounts
      sessionStorage.removeItem('last_scanned_results');
      sessionStorage.removeItem('pending_domains');
      sessionStorage.removeItem('pending_analytics_domains');
      localStorage.removeItem('oldurl_latest_search_batch');
      localStorage.removeItem('oldurl_local_search_history');
      localStorage.removeItem('oldurl_search_sessions');
      localStorage.removeItem('oldurl_search_history_stats');
    } catch (e) {}
  }
}

export function setPendingDomainsToScan(domains: string[], userId?: string): void {
  if (!domains || !domains.length) return;
  const uid = userId || getActiveUserId();
  pendingDomainsMemory = domains;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`pending_domains_${uid}`, domains.join('\n'));
    } catch (e) {
      try {
        sessionStorage.setItem(`pending_domains_${uid}`, domains.slice(0, 3000).join('\n'));
      } catch (err) {}
    }
  }
}

export function getPendingDomainsToScan(userId?: string): string[] {
  const uid = userId || getActiveUserId();
  if (cachedUserId === uid && pendingDomainsMemory && pendingDomainsMemory.length > 0) {
    const list = [...pendingDomainsMemory];
    pendingDomainsMemory = null;
    return list;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`pending_domains_${uid}`) || sessionStorage.getItem('pending_domains');
    if (raw) {
      sessionStorage.removeItem(`pending_domains_${uid}`);
      sessionStorage.removeItem('pending_domains');
      const list = raw.split(/[\r\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (list.length > 0) return list;
    }
  } catch (e) {}
  return [];
}

export function setPendingAnalyticsDomains(domains: string[], userId?: string): void {
  if (!domains || !domains.length) return;
  const uid = userId || getActiveUserId();
  pendingAnalyticsMemory = domains;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`pending_analytics_domains_${uid}`, domains.join('\n'));
    } catch (e) {
      try {
        sessionStorage.setItem(`pending_analytics_domains_${uid}`, domains.slice(0, 3000).join('\n'));
      } catch (err) {}
    }
  }
}

export function getPendingAnalyticsDomains(userId?: string): string[] {
  const uid = userId || getActiveUserId();
  if (cachedUserId === uid && pendingAnalyticsMemory && pendingAnalyticsMemory.length > 0) {
    const list = [...pendingAnalyticsMemory];
    pendingAnalyticsMemory = null;
    return list;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`pending_analytics_domains_${uid}`) || sessionStorage.getItem('pending_analytics_domains');
    if (raw) {
      sessionStorage.removeItem(`pending_analytics_domains_${uid}`);
      sessionStorage.removeItem('pending_analytics_domains');
      const list = raw.split(/[\r\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (list.length > 0) return list;
    }
  } catch (e) {}
  return [];
}

export function setLastScannedBatch(items: StoredSearchItem[], userId?: string): void {
  if (!items || !items.length) return;
  const uid = userId || getActiveUserId();
  latestBatchMemory = items;
  cachedUserId = uid;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`last_scanned_results_${uid}`, JSON.stringify(items.slice(0, 2000)));
      sessionStorage.removeItem('last_scanned_results'); // clear legacy key
    } catch (e) {}
  }
}

export function getLastScannedBatch(userId?: string): StoredSearchItem[] {
  const uid = userId || getActiveUserId();
  if (cachedUserId === uid && latestBatchMemory && latestBatchMemory.length > 0) {
    return latestBatchMemory;
  }
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`last_scanned_results_${uid}`) || localStorage.getItem(`oldurl_latest_batch_${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        latestBatchMemory = parsed;
        cachedUserId = uid;
        return parsed.map((item: any, idx: number) => ({
          ...item,
          id: String(idx + 1).padStart(2, '0'),
          userId: uid,
        }));
      }
    }
  } catch (e) {}

  // Fallback to this specific user's latest search session if present
  const sessions = getSearchSessions(uid);
  if (sessions.length > 0 && sessions[0].items && sessions[0].items.length > 0) {
    return sessions[0].items;
  }

  return [];
}

export function getLocalSearchHistory(forceFresh = false, userId?: string): StoredSearchItem[] {
  const uid = userId || getActiveUserId();
  if (typeof window === 'undefined') return [];
  if (!forceFresh && cachedUserId === uid && memoryCache && memoryCache.length > 0) {
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
            if (dom && !map.has(dom)) {
              const itemDate = item.createdAt || item.created_at || new Date().toISOString();
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
                userId: uid,
              });
            }
          }
        });
      }
    } catch (e) {}
  };

  try {
    loadFromRaw(localStorage.getItem(getStorageKey(uid)));
  } catch (e) {}

  try {
    const sessions = getSearchSessions(uid);
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
                userId: uid,
              });
            }
          }
        });
      }
    });
  } catch (e) {}

  const result = Array.from(map.values())
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((item, idx) => ({
      ...item,
      id: String(idx + 1).padStart(2, '0'),
      userId: uid,
    }));

  memoryCache = result;
  cachedUserId = uid;
  return result;
}

export function saveLocalSearchHistory(items: StoredSearchItem[], sessionLabel?: string, userId?: string): void {
  if (typeof window === 'undefined' || !items || !items.length) return;
  const uid = userId || getActiveUserId();
  try {
    lastCloudFetchTime = 0;
    saveSearchSession(sessionLabel || (items.length === 1 ? items[0].domain : `${items.length} Domains Check`), items, uid);

    const existing = getLocalSearchHistory(true, uid);
    const existingMap = new Map<string, StoredSearchItem>();
    const nowIso = new Date().toISOString();

    // New items take precedence
    items.forEach((it) => {
      if (it && it.domain) {
        const dom = it.domain.toLowerCase().trim();
        existingMap.set(dom, {
          ...it,
          domain: it.domain.trim(),
          createdAt: it.createdAt || nowIso,
          userId: uid,
        });
      }
    });

    // Older items added only if not already present
    existing.forEach((it) => {
      if (it && it.domain) {
        const key = it.domain.toLowerCase().trim();
        if (!existingMap.has(key)) {
          existingMap.set(key, { ...it, userId: uid });
        }
      }
    });

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
        userId: uid,
      }));

    memoryCache = merged;
    cachedUserId = uid;
    const total = merged.length;
    const avail = merged.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = total > 0 ? Math.round(merged.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
    saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg }, uid);

    saveToIndexedDB(merged, uid);

    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(merged.slice(0, 1000)));
    } catch (e) {}

    try {
      window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: merged.length, userId: uid } }));
    } catch (e) {}

    try {
      const cached = localStorage.getItem(`oldurl_cached_profile_${uid}`) || localStorage.getItem('oldurl_cached_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        const newUsed = Math.max(Number(parsed.quota_used) || 0, total);
        if (newUsed !== parsed.quota_used) {
          parsed.quota_used = newUsed;
          localStorage.setItem(`oldurl_cached_profile_${uid}`, JSON.stringify(parsed));
          localStorage.setItem('oldurl_cached_profile', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('oldurl_quota_updated', { detail: parsed }));
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && session.user.id === uid) {
              supabase.from('profiles').update({ quota_used: newUsed }).eq('id', uid).then(() => {});
            }
          });
        }
      }
    } catch (e) {}
  } catch (e) {}
}

export async function deleteHistoryItem(domain: string, userId?: string): Promise<void> {
  if (typeof window === 'undefined' || !domain) return;
  const uid = userId || getActiveUserId();
  const lower = domain.toLowerCase().trim();
  const current = getLocalSearchHistory(true, uid);
  const updated = current
    .filter((it) => it.domain.toLowerCase().trim() !== lower)
    .map((it, idx) => ({
      ...it,
      id: String(idx + 1).padStart(2, '0'),
      userId: uid,
    }));
  memoryCache = updated;
  cachedUserId = uid;
  const total = updated.length;
  const avail = updated.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = total > 0 ? Math.round(updated.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
  saveCachedHistoryStats({ totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg }, uid);

  saveToIndexedDB(updated, uid);

  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated.slice(0, 1000)));
  } catch (e) {}

  try {
    const sessions = getSearchSessions(uid).map((s) => ({
      ...s,
      items: s.items.filter((it) => it.domain.toLowerCase().trim() !== lower),
      domainCount: s.items.filter((it) => it.domain.toLowerCase().trim() !== lower).length,
    })).filter((s) => s.domainCount > 0);
    localStorage.setItem(getSessionsStorageKey(uid), JSON.stringify(sessions));
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: updated.length, userId: uid } }));
  } catch (e) {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && user.id === uid) {
      await supabase.from('search_history').delete().eq('user_id', uid).eq('domain', domain.trim());
    }
  } catch (e) {}
}

export async function clearSearchHistory(userId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const uid = userId || getActiveUserId();
  memoryCache = [];
  cachedUserId = uid;
  saveCachedHistoryStats({ totalChecked: 0, availableCount: 0, registeredCount: 0, avgDr: 0 }, uid);
  try {
    localStorage.removeItem(getStorageKey(uid));
    localStorage.removeItem(getSessionsStorageKey(uid));
    sessionStorage.removeItem('last_scanned_results');
  } catch (e) {}

  try {
    const db = await openHistoryDB();
    if (db) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result;
        if (Array.isArray(list)) {
          list.forEach((it: any) => {
            if (it.userId === uid || (it.recordKey && it.recordKey.startsWith(`${uid}___`))) {
              store.delete(it.recordKey);
            }
          });
        }
      };
      tx.oncomplete = () => db.close();
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: 0, userId: uid } }));
  } catch (e) {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && user.id === uid) {
      await supabase.from('search_history').delete().eq('user_id', uid);
    }
  } catch (e) {}
}

export async function syncToSupabase(items: StoredSearchItem[], userId?: string): Promise<void> {
  try {
    const uid = userId || getActiveUserId();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || user.id !== uid || !items.length) return;

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

export async function fetchAllSearchHistory(forceRefresh = false, targetUserId?: string): Promise<{
  items: StoredSearchItem[];
  totalChecked: number;
  availableCount: number;
  registeredCount: number;
  avgDr: number;
}> {
  const activeUid = targetUserId || getActiveUserId();
  const now = Date.now();
  // Return cached data immediately if queried within 10 minutes and not forceRefresh and matches current user
  if (!forceRefresh && cachedUserId === activeUid && lastCloudFetchTime > 0 && now - lastCloudFetchTime < 600000 && memoryCache && memoryCache.length > 0) {
    const total = memoryCache.length;
    const avail = memoryCache.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = total > 0 ? Math.round(memoryCache.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
    return {
      items: memoryCache,
      totalChecked: total,
      availableCount: avail,
      registeredCount: reg,
      avgDr: avg,
    };
  }

  if (isCloudFetching) {
    const active = (cachedUserId === activeUid && memoryCache && memoryCache.length > 0) ? memoryCache : getLocalSearchHistory(false, activeUid);
    const total = active.length;
    const avail = active.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = total > 0 ? Math.round(active.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
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

    // Load user's data from IndexedDB, Local Storage, Sessions, and Memory Cache
    const idbItems = await loadFromIndexedDB(activeUid);
    const localItems = getLocalSearchHistory(false, activeUid);
    const sessionItems = getSearchSessions(activeUid).flatMap((s) => s.items || []);

    const masterMap = new Map<string, StoredSearchItem>();

    // Priority 1: In-memory cache (if belonging to this user)
    if (cachedUserId === activeUid && memoryCache && Array.isArray(memoryCache)) {
      memoryCache.forEach((it) => {
        if (it && it.domain) masterMap.set(it.domain.toLowerCase().trim(), it);
      });
    }

    // Priority 2: IndexedDB (contains complete all-time domains for THIS user)
    if (idbItems && Array.isArray(idbItems)) {
      idbItems.forEach((it) => {
        if (it && it.domain) {
          const k = it.domain.toLowerCase().trim();
          if (!masterMap.has(k) || (it.createdAt && !masterMap.get(k)?.createdAt)) {
            masterMap.set(k, { ...it, userId: activeUid });
          }
        }
      });
    }

    // Priority 3: Local storage items for THIS user
    if (localItems && Array.isArray(localItems)) {
      localItems.forEach((it) => {
        if (it && it.domain) {
          const k = it.domain.toLowerCase().trim();
          if (!masterMap.has(k)) {
            masterMap.set(k, { ...it, userId: activeUid });
          }
        }
      });
    }

    // Priority 4: Search sessions for THIS user
    if (sessionItems && Array.isArray(sessionItems)) {
      sessionItems.forEach((it) => {
        if (it && it.domain) {
          const k = it.domain.toLowerCase().trim();
          if (!masterMap.has(k)) {
            masterMap.set(k, { ...it, userId: activeUid });
          }
        }
      });
    }

    // Priority 5: Supabase Cloud History strictly for THIS user
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && user.id === activeUid) {
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

      if (allCloudHistory.length > 0) {
        allCloudHistory.forEach((item) => {
          if (item && item.domain) {
            const lower = item.domain.toLowerCase().trim();
            if (!masterMap.has(lower)) {
              masterMap.set(lower, {
                id: '01',
                domain: item.domain,
                status: item.status || 'Available',
                daysLeft: item.days_left || (item.status === 'Available' ? 'Dropped' : '365d'),
                dr: Number(item.dr) || 0,
                registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
                createdAt: item.created_at,
                userId: user.id,
              });
            }
          }
        });
      }
    }

    lastCloudFetchTime = Date.now();

    const finalItems = Array.from(masterMap.values())
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((item, idx) => ({
        ...item,
        id: String(idx + 1).padStart(2, '0'),
        userId: activeUid,
      }));

    memoryCache = finalItems;
    cachedUserId = activeUid;
    await saveToIndexedDB(finalItems, activeUid);

    try {
      localStorage.setItem(getStorageKey(activeUid), JSON.stringify(finalItems.slice(0, 1000)));
    } catch (e) {}

    const total = finalItems.length;
    const avail = finalItems.filter((s) => s.status === 'Available').length;
    const reg = total - avail;
    const avg = total > 0 ? Math.round(finalItems.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;
    const stats = { totalChecked: total, availableCount: avail, registeredCount: reg, avgDr: avg };
    saveCachedHistoryStats(stats, activeUid);

    try {
      window.dispatchEvent(new CustomEvent('oldurl_history_updated', { detail: { count: total, userId: activeUid } }));
    } catch (e) {}

    return {
      items: finalItems,
      totalChecked: total,
      availableCount: avail,
      registeredCount: reg,
      avgDr: avg,
    };
  } catch (e) {
    console.warn('fetchAllSearchHistory error:', e);
  } finally {
    isCloudFetching = false;
  }

  // Fallback
  const fallback = (cachedUserId === activeUid && memoryCache) ? memoryCache : getLocalSearchHistory(false, activeUid);
  const total = fallback.length;
  const avail = fallback.filter((s) => s.status === 'Available').length;
  const reg = total - avail;
  const avg = total > 0 ? Math.round(fallback.reduce((acc, s) => acc + (s.dr || 0), 0) / total) : 0;

  return {
    items: fallback,
    totalChecked: total,
    availableCount: avail,
    registeredCount: reg,
    avgDr: avg,
  };
}
