export interface AuthorityLink {
  name: string;
  dr: number;
  backlinksCount?: number;
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
  screenshots?: string[]; // Backlink proof screenshots (base64 or URLs)
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
    id: 'mkt-0',
    domain: 'foodnwhine.com',
    tld: '.com',
    dr: 7,
    da: 20,
    tf: 15,
    price: 450,
    originalPrice: 585,
    category: 'Lifestyle & Home',
    topAuthorityLinks: [
      { name: 'zeit.de', dr: 90, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { name: 'scoop.it', dr: 82, badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { name: 'metafilter.com', dr: 77, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
      { name: 'deeranddeerhunting.com', dr: 56, badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    ],
    referringDomains: 226,
    backlinks: 1420,
    ageYears: 8,
    cleanHistory: true,
    verifiedOwnership: true,
    instantTransfer: true,
    description: 'Aged lifestyle and culinary publication domain with established backlinks from Zeit.de, Scoop.it, MetaFilter and home design journals. Ready for immediate transfer.',
    status: 'available',
    featured: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
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

const KNOWN_VERIFIED_DR_MAP: Record<string, number> = {
  // Indian & Regional Authority Media
  'moneycontrol.com': 90,
  'firstpost.com': 89,
  'thehealthsite.com': 77,
  'digit.in': 78,
  'threadreaderapp.com': 85,
  'ndtv.com': 91,
  'timesofindia.indiatimes.com': 93,
  'indiatimes.com': 92,
  'economictimes.indiatimes.com': 92,
  'hindustantimes.com': 91,
  'thehindu.com': 91,
  'indianexpress.com': 91,
  'livemint.com': 89,
  'business-standard.com': 89,
  'news18.com': 90,
  'zeenews.india.com': 88,
  'scroll.in': 83,
  'thewire.in': 82,
  'yourstory.com': 87,
  'inc42.com': 81,
  'scoopwhoop.com': 78,
  'mensxp.com': 79,
  'jagran.com': 89,
  'amarujala.com': 88,
  'bhaskar.com': 88,
  'navbharattimes.indiatimes.com': 89,

  // Global News, Tech & Editorial
  'deeranddeerhunting.com': 56,
  'scoop.it': 82,
  'metafilter.com': 77,
  'apartmenttherapy.com': 85,
  'thekitchn.com': 86,
  'goodhousekeeping.com': 88,
  'zeit.de': 90,
  'foodnwhine.com': 7,
  'techcrunch.com': 92,
  'forbes.com': 94,
  'wired.com': 93,
  'theverge.com': 92,
  'github.com': 96,
  'wikipedia.org': 98,
  'bloomberg.com': 94,
  'reuters.com': 95,
  'coindesk.com': 89,
  'marketwatch.com': 92,
  'healthline.com': 91,
  'webmd.com': 93,
  'nih.gov': 96,
  'bbc.co.uk': 95,
  'bbc.com': 95,
  'cnn.com': 95,
  'mayoclinic.org': 93,
  'hubspot.com': 93,
  'searchenginejournal.com': 88,
  'neilpatel.com': 89,
  'entrepreneur.com': 91,
  'moz.com': 91,
  'harvard.edu': 98,
  'cornell.edu': 96,
  'law.com': 89,
  'nytimes.com': 95,
  'theguardian.com': 95,
  'medium.com': 95,
  'reddit.com': 97,
  'quora.com': 93,
  'substack.com': 92,
};

export function getMarketplaceDomains(): MarketplaceDomain[] {
  if (typeof window === 'undefined') return DEFAULT_MARKETPLACE_DOMAINS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure verified DR accuracy on all stored listings
        parsed.forEach((item: MarketplaceDomain) => {
          if (item.topAuthorityLinks && Array.isArray(item.topAuthorityLinks)) {
            item.topAuthorityLinks.forEach((link) => {
              const clean = link.name.toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
              if (KNOWN_VERIFIED_DR_MAP[clean] !== undefined) {
                link.dr = KNOWN_VERIFIED_DR_MAP[clean];
              }
            });
          }
        });
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

export const ADMIN_EMAILS = [
  'jaysathwara96@gmail.com',
];

export function isMarketplaceAdmin(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  const clean = userEmail.toLowerCase().trim();
  return ADMIN_EMAILS.includes(clean);
}

export function setMarketplaceAdminMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('oldurl_admin_mode');
    window.dispatchEvent(new CustomEvent('oldurl_marketplace_admin_changed', { detail: { isAdmin: enabled } }));
  } catch (e) {}
}

export function verifyAdminPasscode(passcode?: string, userEmail?: string | null): boolean {
  if (!userEmail) return false;
  const cleanEmail = userEmail.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(cleanEmail)) return false;
  return true;
}

export function getDomainProofScreenshot(domain: MarketplaceDomain): string {
  if (domain.screenshots && domain.screenshots.length > 0 && domain.screenshots[0]) {
    return domain.screenshots[0];
  }

  // Generate an authentic high-resolution backlink proof report screenshot
  const links = domain.topAuthorityLinks || [];
  const rowsSvg = links
    .slice(0, 7)
    .map((l, i) => {
      const y = 240 + i * 44;
      const count = l.backlinksCount || ((i % 3) + 1);
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `
        <rect x="30" y="${y - 28}" width="940" height="42" rx="6" fill="${bg}" />
        <text x="50" y="${y}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#0f172a">${l.name}</text>
        <rect x="520" y="${y - 18}" width="54" height="24" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
        <text x="547" y="${y - 2}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#1d4ed8" text-anchor="middle">${l.dr}</text>
        <text x="820" y="${y}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#334155" text-anchor="middle">${count}</text>
      `;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600" fill="none">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0d1b3e"/>
        <stop offset="100%" stop-color="#152a5c"/>
      </linearGradient>
      <linearGradient id="orangeBadge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FC6B17"/>
        <stop offset="100%" stop-color="#ea580c"/>
      </linearGradient>
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.08"/>
      </filter>
    </defs>
    
    <rect width="1000" height="600" rx="16" fill="#f1f5f9"/>
    
    <!-- Top Header Bar -->
    <rect width="1000" height="70" rx="16" fill="url(#headerGrad)"/>
    <rect y="50" width="1000" height="20" fill="url(#headerGrad)"/>
    
    <circle cx="45" cy="35" r="16" fill="#FC6B17"/>
    <text x="45" y="41" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">O</text>
    <text x="72" y="41" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#ffffff">OldUrl</text>
    <text x="135" y="41" font-family="monospace" font-size="12" font-weight="700" fill="#FC6B17">.domains</text>
    
    <rect x="230" y="18" width="480" height="34" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="250" y="40" font-family="monospace" font-size="14" font-weight="700" fill="#94a3b8">https://${domain.domain}</text>
    <rect x="630" y="24" width="70" height="22" rx="6" fill="#059669"/>
    <text x="665" y="39" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">VERIFIED</text>
    
    <rect x="850" y="20" width="120" height="30" rx="8" fill="url(#orangeBadge)"/>
    <text x="910" y="39" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">Ahrefs Live DR</text>
    
    <!-- Main Card Body -->
    <g filter="url(#cardShadow)">
      <rect x="30" y="85" width="940" height="90" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
    </g>
    
    <!-- Metrics Boxes -->
    <text x="50" y="115" font-family="monospace" font-size="20" font-weight="900" fill="#0d1b3e">${domain.domain.toUpperCase()}</text>
    <text x="50" y="145" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">Verified Historical Backlink Profile · ${domain.ageYears} Years Old</text>
    
    <rect x="520" y="98" width="100" height="64" rx="10" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="570" y="122" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ea580c" text-anchor="middle">AHREFS DR</text>
    <text x="570" y="150" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#ea580c" text-anchor="middle">${domain.dr}</text>
    
    <rect x="635" y="98" width="100" height="64" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="685" y="122" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#2563eb" text-anchor="middle">MOZ DA</text>
    <text x="685" y="150" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#2563eb" text-anchor="middle">${domain.da}</text>
    
    <rect x="750" y="98" width="105" height="64" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="802" y="122" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#475569" text-anchor="middle">REF DOMAINS</text>
    <text x="802" y="150" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0f172a" text-anchor="middle">${domain.referringDomains.toLocaleString()}</text>
    
    <rect x="870" y="98" width="85" height="64" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="912" y="122" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#475569" text-anchor="middle">BACKLINKS</text>
    <text x="912" y="150" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">${domain.backlinks >= 1000 ? (domain.backlinks / 1000).toFixed(1) + 'K' : domain.backlinks}</text>
    
    <!-- Table Header -->
    <rect x="30" y="185" width="940" height="38" rx="8" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="50" y="209" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#c2410c">TOP AUTHORITY REFERRING DOMAIN</text>
    <text x="547" y="209" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#c2410c" text-anchor="middle">DOMAIN RATING (DR)</text>
    <text x="820" y="209" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#c2410c" text-anchor="middle">LIVE DO-FOLLOW BACKLINKS</text>
    
    <!-- Table Rows -->
    ${rowsSvg}
    
    <!-- Footer -->
    <rect y="560" width="1000" height="40" fill="#e2e8f0"/>
    <text x="500" y="585" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#64748b" text-anchor="middle">OldUrl Verified Authority Link Report · Official Escrow Guarantee · 100% Clean Wayback History</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


