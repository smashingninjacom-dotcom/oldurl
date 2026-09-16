export interface AuthorityLink {
  name: string;
  dr: number;
  badgeColor?: string;
}

export interface MarketplaceDomain {
  id: string;
  domain: string;
  tld: string;
  dr: number; // Ahrefs DR
  da: number; // Moz DA
  tf: number; // Majestic Trust Flow
  price: number;
  originalPrice?: number;
  category: string;
  topAuthorityLinks: AuthorityLink[];
  referringDomains: number;
  backlinks: number;
  ageYears: number;
  cleanHistory: boolean;
  verifiedOwnership: boolean;
  instantTransfer: boolean;
  description: string;
  buyUrl?: string;
  sellerContact?: {
    email?: string;
    telegram?: string;
    whatsapp?: string;
  };
  status: 'available' | 'reserved' | 'sold';
  featured?: boolean;
  createdAt: string;
}

export const DEFAULT_MARKETPLACE_DOMAINS: MarketplaceDomain[] = [
  {
    id: 'mkt-1',
    domain: 'techventure.io',
    tld: '.io',
    dr: 78,
    da: 64,
    tf: 38,
    price: 1450,
    originalPrice: 1950,
    category: 'Technology & AI',
    topAuthorityLinks: [
      { name: 'TechCrunch', dr: 92, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { name: 'Forbes', dr: 94, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Wired', dr: 93, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
      { name: 'Wikipedia', dr: 98, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
    ],
    referringDomains: 1420,
    backlinks: 32500,
    ageYears: 11,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Premier aged tech venture domain. Clean Wayback Machine history with continuous Tier-1 editorial links from TechCrunch, Forbes, and Wired. Ready for immediate DNS push.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'mkt-2',
    domain: 'cryptoledger.org',
    tld: '.org',
    dr: 82,
    da: 71,
    tf: 44,
    price: 2200,
    originalPrice: 2800,
    category: 'Finance & Crypto',
    topAuthorityLinks: [
      { name: 'Bloomberg', dr: 94, badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
      { name: 'Reuters', dr: 95, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      { name: 'CoinDesk', dr: 89, badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
      { name: 'Wikipedia', dr: 98, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
    ],
    referringDomains: 2150,
    backlinks: 68400,
    ageYears: 13,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'High-authority crypto and fintech asset. Over 2,100 referring domains including Bloomberg and Reuters financial journals. Perfect for Web3 publication or fintech SaaS.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-02T12:00:00Z',
  },
  {
    id: 'mkt-3',
    domain: 'healthpulse.net',
    tld: '.net',
    dr: 74,
    da: 61,
    tf: 32,
    price: 980,
    originalPrice: 1350,
    category: 'Health & Medical',
    topAuthorityLinks: [
      { name: 'Healthline', dr: 91, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
      { name: 'WebMD', dr: 93, badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { name: 'BBC News', dr: 95, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
      { name: 'NIH.gov', dr: 96, badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    ],
    referringDomains: 980,
    backlinks: 21300,
    ageYears: 14,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Aged authority health journal domain with clean medical backlinks from WebMD, Healthline, and government health research citations. Zero spam history.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-03T08:30:00Z',
  },
  {
    id: 'mkt-4',
    domain: 'growthmarketer.co',
    tld: '.co',
    dr: 68,
    da: 56,
    tf: 29,
    price: 650,
    originalPrice: 890,
    category: 'Marketing & SEO',
    topAuthorityLinks: [
      { name: 'HubSpot', dr: 93, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      { name: 'NeilPatel', dr: 89, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
      { name: 'SearchEngineJournal', dr: 88, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Entrepreneur', dr: 91, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ],
    referringDomains: 640,
    backlinks: 14200,
    ageYears: 8,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Direct brandable marketing domain. Established backlinks from top digital marketing and SEO blogs. Great for digital agencies, tool directories, or newsletter creators.',
    status: 'available',
    featured: false,
    createdAt: '2026-09-05T14:15:00Z',
  },
  {
    id: 'mkt-5',
    domain: 'saashub.org',
    tld: '.org',
    dr: 76,
    da: 62,
    tf: 36,
    price: 1250,
    originalPrice: 1600,
    category: 'E-Commerce & SaaS',
    topAuthorityLinks: [
      { name: 'ProductHunt', dr: 91, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      { name: 'G2.com', dr: 90, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
      { name: 'Forbes', dr: 94, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Medium', dr: 95, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
    ],
    referringDomains: 1120,
    backlinks: 26800,
    ageYears: 10,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'High DR non-profit .org domain for software directories, SaaS review portals, or B2B tech ecosystems. Instant Auth-Code transfer upon payment.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-06T09:45:00Z',
  },
  {
    id: 'mkt-6',
    domain: 'greenenergynews.com',
    tld: '.com',
    dr: 71,
    da: 58,
    tf: 33,
    price: 890,
    originalPrice: 1200,
    category: 'News & Media',
    topAuthorityLinks: [
      { name: 'TheGuardian', dr: 95, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'NYTimes', dr: 95, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
      { name: 'Reuters', dr: 95, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      { name: 'GreenPeace', dr: 89, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ],
    referringDomains: 810,
    backlinks: 18700,
    ageYears: 16,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: '16-year aged pure .com domain in the booming renewable energy and clean-tech sector. Powerful editorial citations from Guardian and NYTimes.',
    status: 'available',
    featured: false,
    createdAt: '2026-09-07T11:20:00Z',
  },
  {
    id: 'mkt-7',
    domain: 'aiplaybook.io',
    tld: '.io',
    dr: 65,
    da: 52,
    tf: 27,
    price: 550,
    originalPrice: 750,
    category: 'Technology & AI',
    topAuthorityLinks: [
      { name: 'HackerNews', dr: 91, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      { name: 'GitHub', dr: 96, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
      { name: 'VentureBeat', dr: 91, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Substack', dr: 92, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    ],
    referringDomains: 490,
    backlinks: 11400,
    ageYears: 6,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Catchy, modern AI & dev-focused .io domain with do-follow backlink anchors from GitHub repositories, HackerNews discussions, and VentureBeat.',
    status: 'available',
    featured: false,
    createdAt: '2026-09-08T15:00:00Z',
  },
  {
    id: 'mkt-8',
    domain: 'ecolivingguide.com',
    tld: '.com',
    dr: 62,
    da: 49,
    tf: 25,
    price: 480,
    originalPrice: 650,
    category: 'Lifestyle & Home',
    topAuthorityLinks: [
      { name: 'Treehugger', dr: 86, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { name: 'GoodHousekeeping', dr: 89, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
      { name: 'ApartmentTherapy', dr: 88, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    ],
    referringDomains: 420,
    backlinks: 8900,
    ageYears: 9,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Prime consumer lifestyle and sustainable living domain with rich contextual backlink profile. Ideal for affiliate review sites or eco-friendly brand launches.',
    status: 'available',
    featured: false,
    createdAt: '2026-09-09T13:40:00Z',
  },
  {
    id: 'mkt-9',
    domain: 'realestatetracker.org',
    tld: '.org',
    dr: 70,
    da: 57,
    tf: 31,
    price: 920,
    originalPrice: 1250,
    category: 'Real Estate & Property',
    topAuthorityLinks: [
      { name: 'Zillow', dr: 92, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Realtor.com', dr: 91, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
      { name: 'Forbes', dr: 94, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Inman', dr: 85, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ],
    referringDomains: 750,
    backlinks: 16800,
    ageYears: 12,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Aged real estate data & analytics domain with strong link equity from Zillow, Realtor.com, and Forbes Real Estate counsel.',
    status: 'available',
    featured: false,
    createdAt: '2026-09-10T11:00:00Z',
  },
  {
    id: 'mkt-10',
    domain: 'legaladvise.net',
    tld: '.net',
    dr: 73,
    da: 59,
    tf: 34,
    price: 1100,
    originalPrice: 1450,
    category: 'Legal & Law',
    topAuthorityLinks: [
      { name: 'Harvard.edu', dr: 98, badgeColor: 'bg-red-50 text-red-800 border-red-200' },
      { name: 'Cornell.edu', dr: 96, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
      { name: 'Law.com', dr: 89, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'Wikipedia', dr: 98, badgeColor: 'bg-gray-100 text-gray-800 border-gray-300' },
    ],
    referringDomains: 890,
    backlinks: 22400,
    ageYears: 15,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Premium legal authority asset boasting permanent .EDU backlinks from Harvard Law and Cornell University citations. Perfect for legal lead-gen or high-ticket law firm portal.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-11T16:20:00Z',
  },
];

const STORAGE_KEY = 'oldurl_marketplace_listings';

export function getMarketplaceDomains(): MarketplaceDomain[] {
  if (typeof window === 'undefined') return DEFAULT_MARKETPLACE_DOMAINS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Marketplace local read note:', e);
  }
  // Initialize with defaults if empty
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MARKETPLACE_DOMAINS));
  } catch (e) {}
  return DEFAULT_MARKETPLACE_DOMAINS;
}

export function saveMarketplaceDomains(items: MarketplaceDomain[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('oldurl_marketplace_updated', { detail: { count: items.length } }));
  } catch (e) {
    console.warn('Marketplace save note:', e);
  }
}

export function addMarketplaceDomain(
  newDomainData: Omit<MarketplaceDomain, 'id' | 'createdAt'>
): MarketplaceDomain {
  const current = getMarketplaceDomains();
  const cleanDomain = newDomainData.domain.trim().toLowerCase();
  
  // Extract TLD if not provided
  const lastDot = cleanDomain.lastIndexOf('.');
  const tld = newDomainData.tld || (lastDot !== -1 ? cleanDomain.slice(lastDot) : '.com');

  const newItem: MarketplaceDomain = {
    ...newDomainData,
    id: `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    domain: cleanDomain,
    tld,
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current.filter((d) => d.domain.toLowerCase() !== cleanDomain)];
  saveMarketplaceDomains(updated);
  return newItem;
}

export function deleteMarketplaceDomain(id: string): boolean {
  const current = getMarketplaceDomains();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length !== current.length) {
    saveMarketplaceDomains(filtered);
    return true;
  }
  return false;
}

export function updateMarketplaceDomain(id: string, updates: Partial<MarketplaceDomain>): boolean {
  const current = getMarketplaceDomains();
  const index = current.findIndex((item) => item.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    saveMarketplaceDomains(current);
    return true;
  }
  return false;
}

export function resetMarketplaceToDefaults(): MarketplaceDomain[] {
  if (typeof window === 'undefined') return DEFAULT_MARKETPLACE_DOMAINS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MARKETPLACE_DOMAINS));
    window.dispatchEvent(new CustomEvent('oldurl_marketplace_updated', { detail: { count: DEFAULT_MARKETPLACE_DOMAINS.length } }));
  } catch (e) {}
  return DEFAULT_MARKETPLACE_DOMAINS;
}

const ADMIN_STORAGE_KEY = 'oldurl_admin_mode';

export function isMarketplaceAdmin(userEmail?: string | null): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check explicit local admin flag
  const localAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (localAdmin === 'true') return true;

  // 2. Check known admin email domains / addresses
  if (userEmail) {
    const clean = userEmail.toLowerCase().trim();
    const adminEmails = [
      'admin@oldurl.com',
      'kuldeepsathwara',
      'smashingninja',
      'jay@',
      'kuldeep@',
      'admin@',
    ];
    if (adminEmails.some((pattern) => clean.includes(pattern))) {
      return true;
    }
  }

  return false;
}

export function setMarketplaceAdminMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('oldurl_marketplace_admin_changed', { detail: { isAdmin: enabled } }));
  } catch (e) {}
}

export function verifyAdminPasscode(passcode: string): boolean {
  const clean = passcode.trim().toLowerCase();
  // Valid admin passcodes
  if (clean === 'oldurladmin' || clean === 'admin2026' || clean === 'oldurl777' || clean === 'admin') {
    setMarketplaceAdminMode(true);
    return true;
  }
  return false;
}
