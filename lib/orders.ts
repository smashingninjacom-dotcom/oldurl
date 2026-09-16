export interface MarketplaceOrder {
  id: string;
  domain: string;
  tld: string;
  dr: number;
  da: number;
  tf?: number;
  referringDomains: number;
  backlinks: number;
  price: number;
  purchaseDate: string;
  status: 'Completed' | 'Transfer in Progress';
  authCode: string;
  transferMethod: string;
  userEmail?: string;
  category?: string;
  sellerContact?: {
    email?: string;
    telegram?: string;
    whatsapp?: string;
  };
  notes?: string;
}

const ORDERS_STORAGE_KEY = 'oldurl_marketplace_orders';

export function getMarketplaceOrders(userEmail?: string | null): MarketplaceOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy hardcoded sample orders if any
        const validOrders = parsed.filter((o: MarketplaceOrder) => o.id !== 'ORD-2026-8492');
        if (userEmail) {
          return validOrders.filter(
            (o: MarketplaceOrder) => !o.userEmail || o.userEmail.toLowerCase() === userEmail.toLowerCase()
          );
        }
        return validOrders;
      }
    }
  } catch (e) {
    console.warn('Orders local read note:', e);
  }
  return [];
}

export function saveMarketplaceOrders(orders: MarketplaceOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(
      new CustomEvent('oldurl_orders_updated', { detail: { count: orders.length, orders } })
    );
  } catch (e) {
    console.warn('Orders save note:', e);
  }
}

export function addMarketplaceOrder(
  data: Partial<MarketplaceOrder> & { domain: string }
): MarketplaceOrder {
  const currentOrders = getMarketplaceOrders();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  
  const newOrder: MarketplaceOrder = {
    id: data.id || `ORD-${new Date().getFullYear()}-${orderNumber}`,
    domain: data.domain.toLowerCase().trim(),
    tld: data.tld || ('.' + (data.domain.split('.').pop() || 'com')),
    dr: data.dr || 0,
    da: data.da || 0,
    tf: data.tf || 25,
    referringDomains: data.referringDomains || 0,
    backlinks: data.backlinks || 0,
    price: data.price || 0,
    purchaseDate: data.purchaseDate || new Date().toISOString(),
    status: data.status || 'Completed',
    authCode: data.authCode || `EPP-OLDURL-${randomSuffix}`,
    transferMethod: data.transferMethod || 'Registrar Push / EPP Auth Code',
    userEmail: data.userEmail,
    category: data.category || 'General Authority',
    sellerContact: data.sellerContact,
    notes: data.notes || 'Instant Auth Code generated. Transfer can be initiated immediately with your preferred registrar.',
  };

  const updated = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];
  saveMarketplaceOrders(updated);
  return newOrder;
}

export function deleteMarketplaceOrder(id: string): boolean {
  const currentOrders = getMarketplaceOrders();
  const filtered = currentOrders.filter((o) => o.id !== id);
  if (filtered.length !== currentOrders.length) {
    saveMarketplaceOrders(filtered);
    return true;
  }
  return false;
}

export function clearMarketplaceOrders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('oldurl_orders_updated', { detail: { count: 0, orders: [] } })
    );
  } catch (e) {}
}
