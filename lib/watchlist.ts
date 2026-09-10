import { supabase } from './supabaseClient';
import { getActiveUserId } from './searchHistory';

export interface WishlistItem {
  id: string;
  domain: string;
  status: 'Available' | 'Expiring Soon' | 'Registered' | 'Auction' | string;
  daysLeft: string;
  dr: number;
  registrar: string;
  refDomains?: number | string;
  backlinks?: number | string;
  createdAt?: string;
  userId?: string;
  notes?: string;
}

export function getWishlistStorageKey(userId?: string): string {
  const uid = userId || getActiveUserId();
  return `oldurl_wishlist_${uid}`;
}

export function getLocalWishlist(userId?: string): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  const uid = userId || getActiveUserId();
  try {
    const raw = localStorage.getItem(getWishlistStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveLocalWishlist(items: WishlistItem[], userId?: string): void {
  if (typeof window === 'undefined') return;
  const uid = userId || getActiveUserId();
  try {
    localStorage.setItem(getWishlistStorageKey(uid), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('oldurl_wishlist_updated', { detail: { count: items.length, userId: uid } }));
  } catch (e) {}
}

export function isDomainInWishlist(domain: string, userId?: string): boolean {
  if (!domain || typeof window === 'undefined') return false;
  const lower = domain.toLowerCase().trim();
  const list = getLocalWishlist(userId);
  return list.some((item) => item.domain.toLowerCase().trim() === lower);
}

export async function toggleDomainWishlist(
  item: Partial<WishlistItem> & { domain: string },
  userId?: string
): Promise<boolean> {
  const uid = userId || getActiveUserId();
  const lower = item.domain.toLowerCase().trim();
  const current = getLocalWishlist(uid);
  const exists = current.some((it) => it.domain.toLowerCase().trim() === lower);

  if (exists) {
    // Remove from wishlist
    const updated = current.filter((it) => it.domain.toLowerCase().trim() !== lower);
    saveLocalWishlist(updated, uid);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user && user.id === uid) {
        await supabase.from('watchlists').delete().eq('user_id', uid).eq('domain', item.domain.trim());
      }
    } catch (e) {}
    return false; // Not in wishlist
  } else {
    // Add to wishlist
    const newItem: WishlistItem = {
      id: item.id || `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      domain: item.domain.trim(),
      status: (item.status as any) || 'Available',
      daysLeft: item.daysLeft || (item.status === 'Available' ? 'Dropped' : '365d'),
      dr: Number(item.dr) || 0,
      registrar: item.registrar || (item.status === 'Available' ? '—' : 'Registered / Active'),
      refDomains: Number(item.refDomains) || 0,
      backlinks: Number(item.backlinks) || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      userId: uid,
      notes: item.notes || '',
    };
    const updated = [newItem, ...current.filter((it) => it.domain.toLowerCase().trim() !== lower)];
    saveLocalWishlist(updated, uid);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user && user.id === uid) {
        const metaPayload = JSON.stringify({
          status: newItem.status,
          daysLeft: newItem.daysLeft,
          registrar: newItem.registrar,
          refDomains: newItem.refDomains,
          backlinks: newItem.backlinks,
          createdAt: newItem.createdAt,
          notes: newItem.notes,
        });
        await supabase.from('watchlists').insert({
          user_id: uid,
          domain: newItem.domain,
          target_dr: newItem.dr,
          notes: metaPayload,
        });
      }
    } catch (e) {}
    return true; // Added to wishlist
  }
}

export async function removeFromWishlist(domain: string, userId?: string): Promise<void> {
  const uid = userId || getActiveUserId();
  const lower = domain.toLowerCase().trim();
  const current = getLocalWishlist(uid);
  const updated = current.filter((it) => it.domain.toLowerCase().trim() !== lower);
  saveLocalWishlist(updated, uid);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && user.id === uid) {
      await supabase.from('watchlists').delete().eq('user_id', uid).eq('domain', domain.trim());
    }
  } catch (e) {}
}

export async function fetchCloudWishlist(userId?: string): Promise<WishlistItem[]> {
  const uid = userId || getActiveUserId();
  const local = getLocalWishlist(uid);
  if (typeof window === 'undefined') return local;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && user.id === uid) {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        const map = new Map<string, WishlistItem>();
        local.forEach((it) => map.set(it.domain.toLowerCase().trim(), it));

        data.forEach((row) => {
          const dom = (row.domain || '').toLowerCase().trim();
          if (dom) {
            let meta: any = {};
            try {
              if (row.notes && row.notes.startsWith('{')) {
                meta = JSON.parse(row.notes);
              }
            } catch (e) {}

            if (!map.has(dom)) {
              map.set(dom, {
                id: row.id || `wish_${Date.now()}`,
                domain: row.domain.trim(),
                status: meta.status || 'Registered',
                daysLeft: meta.daysLeft || 'Active',
                dr: Number(row.target_dr) || Number(meta.dr) || 0,
                registrar: meta.registrar || '—',
                refDomains: Number(meta.refDomains) || 0,
                backlinks: Number(meta.backlinks) || 0,
                createdAt: meta.createdAt || row.created_at || new Date().toISOString(),
                userId: uid,
                notes: meta.notes || (row.notes && !row.notes.startsWith('{') ? row.notes : ''),
              });
            }
          }
        });

        const merged = Array.from(map.values());
        saveLocalWishlist(merged, uid);
        return merged;
      }
    }
  } catch (e) {}

  return local;
}
