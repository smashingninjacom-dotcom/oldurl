import { MarketplaceDomain } from './marketplace';

export interface CartItem {
  id: string;
  domain: string;
  tld: string;
  dr: number;
  da: number;
  tf?: number;
  referringDomains: number;
  backlinks: number;
  price: number;
  category: string;
  topAuthorityLinks?: { name: string; dr: number }[];
  addedAt: string;
}

const CART_STORAGE_KEY = 'oldurl_marketplace_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Cart read note:', e);
  }
  return [];
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent('oldurl_cart_updated', { detail: { count: items.length, items } })
    );
  } catch (e) {
    console.warn('Cart save note:', e);
  }
}

export function addToCart(domain: MarketplaceDomain): boolean {
  const current = getCart();
  const exists = current.some(
    (item) => item.id === domain.id || item.domain.toLowerCase() === domain.domain.toLowerCase()
  );
  if (exists) return false;

  const newItem: CartItem = {
    id: domain.id,
    domain: domain.domain.toLowerCase().trim(),
    tld: domain.tld,
    dr: domain.dr,
    da: domain.da,
    tf: domain.tf,
    referringDomains: domain.referringDomains,
    backlinks: domain.backlinks,
    price: domain.price,
    category: domain.category,
    topAuthorityLinks: domain.topAuthorityLinks,
    addedAt: new Date().toISOString(),
  };

  saveCart([...current, newItem]);
  return true;
}

export function removeFromCart(domainIdOrName: string): void {
  const current = getCart();
  const filtered = current.filter(
    (item) => item.id !== domainIdOrName && item.domain.toLowerCase() !== domainIdOrName.toLowerCase()
  );
  if (filtered.length !== current.length) {
    saveCart(filtered);
  }
}

export function isDomainInCart(domainIdOrName: string): boolean {
  const current = getCart();
  const clean = domainIdOrName.toLowerCase().trim();
  return current.some((item) => item.id === domainIdOrName || item.domain.toLowerCase() === clean);
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('oldurl_cart_updated', { detail: { count: 0, items: [] } })
    );
  } catch (e) {}
}
