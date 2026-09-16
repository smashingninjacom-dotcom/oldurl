'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Plus,
  Trash2,
  DollarSign,
  Globe,
  Share2,
  ArrowRight,
  TrendingUp,
  Link2,
  Award,
  Layers,
  ChevronDown,
  Copy,
  Check,
  CreditCard,
  MessageSquare,
  Lock,
  Unlock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  X,
  Info,
  BadgeCheck,
  Key,
  LogIn,
} from 'lucide-react';
import {
  MarketplaceDomain,
  getMarketplaceDomains,
  addMarketplaceDomain,
  deleteMarketplaceDomain,
  resetMarketplaceToDefaults,
  isMarketplaceAdmin,
  setMarketplaceAdminMode,
  verifyAdminPasscode,
} from '../../../lib/marketplace';
import { isDomainInWishlist, toggleDomainWishlist } from '../../../lib/watchlist';
import { supabase } from '../../../lib/supabaseClient';
import AuthModal from '../../../components/AuthModal';

export default function DomainMarketplacePage() {
  const [domains, setDomains] = useState<MarketplaceDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drFilter, setDrFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'dr-desc' | 'price-asc' | 'price-desc' | 'rd-desc'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // User & Admin Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPasscodeModalOpen, setIsAdminPasscodeModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Wishlist set
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Modals
  const [selectedDomainForBuy, setSelectedDomainForBuy] = useState<MarketplaceDomain | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // New Listing Form State
  const [newDomain, setNewDomain] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newDr, setNewDr] = useState('65');
  const [newDa, setNewDa] = useState('50');
  const [newCategory, setNewCategory] = useState('Tech & AI');
  const [newTopLinks, setNewTopLinks] = useState('Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)');
  const [newReferringDomains, setNewReferringDomains] = useState('500');
  const [newBacklinks, setNewBacklinks] = useState('12000');
  const [newAgeYears, setNewAgeYears] = useState('8');
  const [newDescription, setNewDescription] = useState('');
  const [newBuyUrl, setNewBuyUrl] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Load domains & check user/admin on mount
  useEffect(() => {
    const loadListings = () => {
      const data = getMarketplaceDomains();
      setDomains(data);
    };
    loadListings();

    const handleUpdate = () => loadListings();
    window.addEventListener('oldurl_marketplace_updated', handleUpdate);

    // Check user from Supabase or localStorage
    const checkAuth = async () => {
      let email = null;
      try {
        const cachedUser = localStorage.getItem('oldurl_cached_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed?.email) {
            email = parsed.email;
            setCurrentUser(parsed);
          }
        }
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          email = data.session.user.email;
          setCurrentUser(data.session.user);
        }
      } catch (e) {}

      setIsAdmin(isMarketplaceAdmin(email));
    };
    checkAuth();

    const handleAdminChanged = (e: any) => {
      if (typeof e?.detail?.isAdmin === 'boolean') {
        setIsAdmin(e.detail.isAdmin);
      } else {
        setIsAdmin(isMarketplaceAdmin(currentUser?.email));
      }
    };
    window.addEventListener('oldurl_marketplace_admin_changed', handleAdminChanged);

    // Initial wishlist sync
    const syncWishlist = () => {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('oldurl_wishlist_guest');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setWishlistSet(new Set(parsed.map((item: any) => item.domain.toLowerCase().trim())));
            }
          } catch (e) {}
        }
      }
    };
    syncWishlist();
    window.addEventListener('oldurl_wishlist_updated', syncWishlist);

    return () => {
      window.removeEventListener('oldurl_marketplace_updated', handleUpdate);
      window.removeEventListener('oldurl_marketplace_admin_changed', handleAdminChanged);
      window.removeEventListener('oldurl_wishlist_updated', syncWishlist);
    };
  }, [currentUser?.email]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    domains.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ['All', ...Array.from(set)];
  }, [domains]);

  const filteredDomains = useMemo(() => {
    return domains
      .filter((item) => {
        // Search query: domain name, description, category, or authority link names
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchDomain = item.domain.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          const matchLinks = item.topAuthorityLinks?.some((l) => l.name.toLowerCase().includes(q));
          if (!matchDomain && !matchDesc && !matchCategory && !matchLinks) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // DR Filter
        if (drFilter !== 'All') {
          const minDr = parseInt(drFilter.replace(/[^0-9]/g, ''), 10);
          if (minDr && item.dr < minDr) return false;
        }

        // Price Filter
        if (priceFilter === '< $500' && item.price >= 500) return false;
        if (priceFilter === '$500 - $1,000' && (item.price < 500 || item.price > 1000)) return false;
        if (priceFilter === '$1,000 - $2,000' && (item.price < 1000 || item.price > 2000)) return false;
        if (priceFilter === '$2,000+' && item.price < 2000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.dr - a.dr;
        }
        if (sortBy === 'dr-desc') return b.dr - a.dr;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rd-desc') return b.referringDomains - a.referringDomains;
        return 0;
      });
  }, [domains, searchQuery, selectedCategory, drFilter, priceFilter, sortBy]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleToggleWishlist = async (domainItem: MarketplaceDomain) => {
    const isSaved = await toggleDomainWishlist({
      domain: domainItem.domain,
      dr: domainItem.dr,
      status: 'Available',
      registrar: 'Marketplace (Verified Direct)',
      refDomains: domainItem.referringDomains,
      backlinks: domainItem.backlinks,
      notes: `Marketplace Listing: $${domainItem.price} USD | Top Links: ${domainItem.topAuthorityLinks.map((l) => l.name).join(', ')}`,
    });

    setWishlistSet((prev) => {
      const next = new Set(prev);
      const clean = domainItem.domain.toLowerCase().trim();
      if (isSaved) next.add(clean);
      else next.delete(clean);
      return next;
    });
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newPrice.trim()) return;

    // Parse top authority links from text
    const parsedLinks = newTopLinks
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const drMatch = trimmed.match(/DR\s*(\d+)/i) || trimmed.match(/\((\d+)\)/);
        const name = trimmed.replace(/\(DR\s*\d+\)/i, '').replace(/\(\d+\)/, '').replace(/DR\s*\d+/i, '').trim();
        const dr = drMatch ? parseInt(drMatch[1], 10) : 90;
        return {
          name: name || 'Authority Publication',
          dr: isNaN(dr) ? 90 : dr,
          badgeColor: 'bg-orange-50 text-[#FC6B17] border-orange-200',
        };
      })
      .filter((l) => l.name.length > 0);

    addMarketplaceDomain({
      domain: newDomain.trim(),
      tld: '.' + (newDomain.split('.').pop() || 'com'),
      dr: parseInt(newDr, 10) || 50,
      da: parseInt(newDa, 10) || 40,
      price: parseFloat(newPrice) || 499,
      originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
      category: newCategory || 'General Authority',
      topAuthorityLinks: parsedLinks.length > 0 ? parsedLinks : [{ name: 'Forbes', dr: 94 }],
      referringDomains: parseInt(newReferringDomains, 10) || 100,
      backlinks: parseInt(newBacklinks, 10) || 2000,
      ageYears: parseInt(newAgeYears, 10) || 5,
      cleanHistory: true,
      verifiedOwnership: true,
      instantTransfer: true,
      description: newDescription.trim() || 'Aged authority domain with clean backlink profile and instant transfer authorization.',
      buyUrl: newBuyUrl.trim() || undefined,
      sellerContact: newContactEmail.trim() ? { email: newContactEmail.trim() } : undefined,
      status: 'available',
      featured: false,
    });

    setIsListModalOpen(false);
    // Reset form
    setNewDomain('');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewDescription('');
    setNewBuyUrl('');
    setNewContactEmail('');
  };

  const handleDeleteListing = (id: string, domainName: string) => {
    if (confirm(`Admin Action: Are you sure you want to delete "${domainName}" from the marketplace?`)) {
      deleteMarketplaceDomain(id);
    }
  };

  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPasscode(adminPasscode)) {
      setIsAdmin(true);
      setIsAdminPasscodeModalOpen(false);
      setAdminPasscode('');
      setAdminPasscodeError(false);
    } else {
      setAdminPasscodeError(true);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset marketplace listings to default high-DR inventory?')) {
      const defs = resetMarketplaceToDefaults();
      setDomains(defs);
    }
  };

  const handleInitiateBuy = (item: MarketplaceDomain) => {
    setSelectedDomainForBuy(item);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d1b3e] via-[#132757] to-[#1c356f] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#233f82]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#FC6B17]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-[#FC6B17] border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PREMIUM DOMAIN MARKETPLACE</span>
              </div>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> ADMIN PUBLISHER ACTIVE
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Buy Vetted High-DR Domains with Authority Backlinks
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Curated aged domains with permanent backlinks from <strong className="text-white">Forbes, TechCrunch, Wikipedia, BBC</strong> &amp; top media. Includes verified ownership, clean history audit &amp; instant Auth-Code transfer.
            </p>

            {/* Feature Badges */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap pt-1 text-[11px] sm:text-xs font-semibold text-gray-200">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Ownership
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Permanent Top Editorial Links
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Zap className="w-3.5 h-3.5 text-[#FC6B17]" /> 2-Hour Instant Push Transfer
              </span>
            </div>
          </div>

          {/* Right Action Header Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsListModalOpen(true)}
                  className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post &amp; Publish Domain</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMarketplaceAdminMode(false);
                    setIsAdmin(false);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-3.5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                  title="Disable Admin Mode"
                >
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminPasscodeModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-all"
                title="Admin access to post and publish new domains"
              >
                <Key className="w-3.5 h-3.5 text-orange-300" />
                <span>Admin Post Portal</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-3.5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                title="Reset inventory to default sample listings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        {/* Top Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by domain, niche, or authority link (e.g. tech, forbes, crypto)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#FC6B17] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* DR, Price & Sort Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* DR Filter */}
            <div className="relative">
              <select
                value={drFilter}
                onChange={(e) => setDrFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                <option value="All">All DR Scores</option>
                <option value="DR 60+">DR 60+</option>
                <option value="DR 70+">DR 70+</option>
                <option value="DR 75+">DR 75+</option>
                <option value="DR 80+">DR 80+</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Price Filter */}
            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                <option value="All">Any Price</option>
                <option value="< $500">Under $500</option>
                <option value="$500 - $1,000">$500 - $1,000</option>
                <option value="$1,000 - $2,000">$1,000 - $2,000</option>
                <option value="$2,000+">$2,000+</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="dr-desc">DR: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rd-desc">Most Referring Domains</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#FC6B17] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#FC6B17] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-gray-400 font-bold mr-1 shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#FC6B17] text-white shadow-2xs scale-102'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div>
          Showing <span className="font-bold text-gray-900">{filteredDomains.length}</span> high-authority domains
        </div>
        {(selectedCategory !== 'All' || drFilter !== 'All' || priceFilter !== 'All' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setDrFilter('All');
              setPriceFilter('All');
              setSearchQuery('');
            }}
            className="text-[#FC6B17] font-bold hover:underline"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredDomains.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No domains match your filters</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Try broadening your search query, selecting &apos;All DR Scores&apos;, or resetting your filters.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setDrFilter('All');
                setPriceFilter('All');
                setSearchQuery('');
              }}
              className="bg-[#FC6B17] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#e05607]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDomains.map((item) => {
            const isWishlisted = wishlistSet.has(item.domain.toLowerCase().trim());

            return (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-gray-200/80 hover:border-orange-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Featured / Category Tag */}
                <div className="p-5 pb-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FC6B17] border border-orange-100">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5" /> FEATURED
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleWishlist(item)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-[#FC6B17] hover:bg-orange-50 transition-colors"
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist & Favourites'}
                      >
                        <Bookmark
                          className={`w-4 h-4 transition-all ${
                            isWishlisted ? 'text-[#FC6B17] fill-[#FC6B17]' : 'text-gray-300 hover:text-[#FC6B17]'
                          }`}
                        />
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id, item.domain)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Admin: Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Domain Name */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center shrink-0 border border-orange-100">
                        <Globe className="w-4 h-4" />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#0d1b3e] truncate tracking-tight">
                        {item.domain}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.domain)}
                      className="text-gray-300 hover:text-gray-600 p-1 rounded-md transition-colors"
                      title="Copy domain name"
                    >
                      {copiedDomain === item.domain ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quick Metric Pills */}
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div className="bg-[#fff7ed] p-2 rounded-xl border border-orange-200/60">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ahrefs DR</div>
                      <div className="text-sm font-black text-[#FC6B17] flex items-center justify-center gap-0.5">
                        {item.dr}
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Moz DA</div>
                      <div className="text-sm font-bold text-gray-800">{item.da}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ref Domains</div>
                      <div className="text-sm font-bold text-gray-800">{item.referringDomains.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</div>
                      <div className="text-sm font-bold text-gray-800">{item.ageYears}y</div>
                    </div>
                  </div>
                </div>

                {/* Authority Backlinks Section (Crucial Requirement) */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-[#FC6B17]" /> Top High-DR Authority Links
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ Verified Clean
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.topAuthorityLinks && item.topAuthorityLinks.length > 0 ? (
                        item.topAuthorityLinks.map((link, lIdx) => (
                          <div
                            key={lIdx}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                              link.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <span>{link.name}</span>
                            <span className="text-[10px] font-black opacity-85 px-1 py-0.2 bg-black/10 rounded">
                              DR {link.dr}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">High authority backlink profile</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Transfer Guarantee Features */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Ownership Verified
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Zap className="w-3 h-3 text-amber-500" /> Instant Auth-Code
                    </span>
                  </div>
                </div>

                {/* Card Footer: Price & Direct Buy Action */}
                <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Buy It Now Price</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-[#0d1b3e]">
                        ${item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && (
                        <span className="text-xs font-semibold text-gray-400 line-through">
                          ${item.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-gray-400">USD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/domain-analytics-result?domain=${encodeURIComponent(item.domain)}`}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#FC6B17] hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                      title="View Domain Analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleInitiateBuy(item)}
                      className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-[24%] min-w-[180px]">Domain</th>
                  <th className="py-3 px-3 w-[10%] min-w-[80px]">Ahrefs DR</th>
                  <th className="py-3 px-4 w-[32%] min-w-[240px]">Top Authority Links</th>
                  <th className="py-3 px-3 w-[10%] min-w-[90px]">Ref Domains</th>
                  <th className="py-3 px-3 w-[8%] min-w-[70px]">Age</th>
                  <th className="py-3 px-4 w-[12%] min-w-[100px]">Price</th>
                  <th className="py-3 px-4 w-[10%] min-w-[90px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredDomains.map((item, idx) => {
                  const isWishlisted = wishlistSet.has(item.domain.toLowerCase().trim());
                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors group">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-mono text-[11px] font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleWishlist(item)}
                            className="p-1 rounded-md text-gray-300 hover:text-[#FC6B17] transition-colors"
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isWishlisted ? 'text-[#FC6B17] fill-[#FC6B17]' : 'text-gray-300'
                              }`}
                            />
                          </button>
                          <div>
                            <div className="font-bold text-[#0d1b3e] text-xs flex items-center gap-1.5">
                              <span>{item.domain}</span>
                              {item.featured && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                  HOT
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">{item.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-[#FC6B17] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                          {item.dr} <TrendingUp className="w-3 h-3 text-emerald-500" />
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.topAuthorityLinks.slice(0, 3).map((link, lIdx) => (
                            <span
                              key={lIdx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                link.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {link.name} (DR {link.dr})
                            </span>
                          ))}
                          {item.topAuthorityLinks.length > 3 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              +{item.topAuthorityLinks.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-gray-600 font-semibold">
                        {item.referringDomains.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-gray-600 font-semibold">
                        {item.ageYears} yrs
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0d1b3e] text-sm">
                          ${item.price.toLocaleString()}
                        </div>
                        {item.originalPrice && (
                          <div className="text-[10px] text-gray-400 line-through">
                            ${item.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(item.id, item.domain)}
                              className="p-1 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Admin: Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleInitiateBuy(item)}
                            className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1 transition-all"
                          >
                            <span>Buy</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BUY NOW / DIRECT PURCHASE MODAL */}
      {selectedDomainForBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setSelectedDomainForBuy(null);
                setPurchaseSuccess(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {purchaseSuccess ? (
              /* Success Order State */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0d1b3e]">Purchase Order Initialized!</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Your request to acquire <strong className="text-gray-900 font-bold">{selectedDomainForBuy.domain}</strong> has been secured. Our automated transfer system has dispatched the EPP Auth-Code to your account email.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Domain:</span>
                    <span className="font-bold text-gray-900">{selectedDomainForBuy.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ahrefs DR:</span>
                    <span className="font-bold text-[#FC6B17]">DR {selectedDomainForBuy.dr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transfer Protocol:</span>
                    <span className="font-bold text-emerald-700">Registrar Push / Auth-Code</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDomainForBuy(null);
                    setPurchaseSuccess(false);
                  }}
                  className="w-full bg-[#0d1b3e] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#152a5c] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Checkout Details State */
              <>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-full mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Direct Verified Domain Acquisition
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
                    Acquire {selectedDomainForBuy.domain}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Instant ownership transfer via EPP Authorization Code or Registrar Push within 2 hours.
                  </p>
                </div>

                {/* Domain Specs Box */}
                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-gray-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">Ahrefs Authority Score</span>
                    <span className="font-black text-[#FC6B17] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      DR {selectedDomainForBuy.dr}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">Top Authority Backlinks</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {selectedDomainForBuy.topAuthorityLinks.map((l, i) => (
                        <span key={i} className="font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {l.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">Referring Domains / Backlinks</span>
                    <span className="font-bold text-gray-900">
                      {selectedDomainForBuy.referringDomains.toLocaleString()} RD / {selectedDomainForBuy.backlinks.toLocaleString()} Backlinks
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-extrabold pt-1">
                    <span className="text-gray-900">Total Purchase Price</span>
                    <span className="text-xl font-black text-[#FC6B17]">
                      ${selectedDomainForBuy.price.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* Safe Transfer Guarantee */}
                <div className="space-y-2 text-xs text-gray-600 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Buyer Protection &amp; Escrow Guarantee
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    1. Funds held in 100% secure escrow until you confirm domain reception.
                    <br />
                    2. Instant EPP Transfer Auth-Code provided upon payment completion.
                  </p>
                </div>

                {/* Checkout CTA Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        setIsAuthModalOpen(true);
                      } else {
                        setPurchaseSuccess(true);
                      }
                    }}
                    className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Instant Checkout (${selectedDomainForBuy.price.toLocaleString()} USD)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href={`mailto:support@oldurl.com?subject=Inquiry for ${selectedDomainForBuy.domain}&body=Hello, I am interested in purchasing ${selectedDomainForBuy.domain} for $${selectedDomainForBuy.price} USD.`}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Make Offer</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          setIsAuthModalOpen(true);
                        } else {
                          setPurchaseSuccess(true);
                        }
                      }}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Escrow Pay</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADMIN POST & PUBLISH NEW DOMAIN MODAL */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 my-8">
            <button
              type="button"
              onClick={() => setIsListModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-full mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Publisher Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
                Publish New Domain to Marketplace
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Post high-authority vetted domains directly into the public &amp; dashboard marketplace for buyers.
              </p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. saasgrowth.io"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Price (USD $) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ahrefs DR Score</label>
                  <input
                    type="number"
                    value={newDr}
                    onChange={(e) => setNewDr(e.target.value)}
                    placeholder="e.g. 68"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Moz DA</label>
                  <input
                    type="number"
                    value={newDa}
                    onChange={(e) => setNewDa(e.target.value)}
                    placeholder="e.g. 52"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Domain Age (Years)</label>
                  <input
                    type="number"
                    value={newAgeYears}
                    onChange={(e) => setNewAgeYears(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category / Niche</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-semibold text-gray-700"
                  >
                    <option value="Tech & AI">Tech & AI</option>
                    <option value="Finance & Crypto">Finance & Crypto</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Marketing & SEO">Marketing & SEO</option>
                    <option value="E-Commerce & SaaS">E-Commerce & SaaS</option>
                    <option value="News & Media">News & Media</option>
                    <option value="Lifestyle & Home">Lifestyle & Home</option>
                    <option value="General Authority">General Authority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Referring Domains Count</label>
                  <input
                    type="number"
                    value={newReferringDomains}
                    onChange={(e) => setNewReferringDomains(e.target.value)}
                    placeholder="e.g. 640"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Top High-DR Authority Links (Comma Separated)
                </label>
                <input
                  type="text"
                  value={newTopLinks}
                  onChange={(e) => setNewTopLinks(e.target.value)}
                  placeholder="e.g. Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Mention the top authority editorial websites linking into this domain.
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Domain Description &amp; Pitch</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe the domain history, clean archive record, and recommended use case..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Email / Telegram (Optional)</label>
                  <input
                    type="text"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="e.g. seller@domain.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Custom Checkout Link (Optional)</label>
                  <input
                    type="text"
                    value={newBuyUrl}
                    onChange={(e) => setNewBuyUrl(e.target.value)}
                    placeholder="e.g. https://dan.com/buy-domain/..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsListModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish to Marketplace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSCODE UNLOCK MODAL */}
      {isAdminPasscodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsAdminPasscodeModalOpen(false);
                setAdminPasscode('');
                setAdminPasscodeError(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0d1b3e]">Admin Publishing Access</h3>
              <p className="text-xs text-gray-500">
                Enter your admin security passcode to post and manage domain listings.
              </p>
            </div>

            <form onSubmit={handleAdminPasscodeSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminPasscodeError(false);
                  }}
                  placeholder="Enter admin passcode (e.g. oldurladmin)..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17] focus:bg-white text-center font-mono font-bold"
                />
                {adminPasscodeError && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 text-center">
                    Incorrect passcode. Try &quot;oldurladmin&quot; or &quot;admin2026&quot;.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Unlock Admin Controls
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal for Gated Checkout */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
