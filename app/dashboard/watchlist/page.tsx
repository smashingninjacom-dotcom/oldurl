'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import {
  WishlistItem,
  getLocalWishlist,
  saveLocalWishlist,
  fetchCloudWishlist,
  removeFromWishlist,
  toggleDomainWishlist,
} from '../../../lib/watchlist';
import { addMarketplaceDomain } from '../../../lib/marketplace';
import { formatCheckDate, setPendingDomainsToScan } from '../../../lib/searchHistory';
import AccountNavTabs from '../../../components/AccountNavTabs';
import {
  Bookmark,
  Trash2,
  Plus,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  X,
  ShieldCheck,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import * as XLSX from 'xlsx';

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>(() => getLocalWishlist());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [newDomain, setNewDomain] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortField, setSortField] = useState<'domain' | 'dr' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Move to Marketplace State
  const [selectedForMarketplace, setSelectedForMarketplace] = useState<WishlistItem | null>(null);
  const [mktPrice, setMktPrice] = useState('750');
  const [mktOriginalPrice, setMktOriginalPrice] = useState('990');
  const [mktDr, setMktDr] = useState('65');
  const [mktDa, setMktDa] = useState('50');
  const [mktTf, setMktTf] = useState('30');
  const [mktCategory, setMktCategory] = useState('Technology & AI');
  const [mktTopLinks, setMktTopLinks] = useState('Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)');
  const [mktReferringDomains, setMktReferringDomains] = useState('450');
  const [mktAgeYears, setMktAgeYears] = useState('9');
  const [mktDescription, setMktDescription] = useState('');
  const [mktBuyUrl, setMktBuyUrl] = useState('');
  const [mktContactEmail, setMktContactEmail] = useState('');
  const [mktPublishedSuccess, setMktPublishedSuccess] = useState(false);

  const handleSort = (field: 'domain' | 'dr' | 'status' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'domain' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getLocalWishlist());
    };

    window.addEventListener('oldurl_wishlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    fetchCloudWishlist().then((list) => {
      if (list && list.length > 0) {
        setItems(list);
      }
    });

    return () => {
      window.removeEventListener('oldurl_wishlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopy = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleDelete = async (domain: string) => {
    await removeFromWishlist(domain);
    setItems(getLocalWishlist());
  };

  const handleSearchAgain = (domain: string) => {
    setPendingDomainsToScan([domain]);
    router.push('/dashboard/results');
  };

  const handleSearchAllWishlist = () => {
    const domainsToScan = items.map((i) => i.domain);
    if (domainsToScan.length > 0) {
      setPendingDomainsToScan(domainsToScan);
      router.push('/dashboard/results');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const clean = newDomain
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    if (!clean || !clean.includes('.')) {
      alert('Please enter a valid domain name (e.g. example.com)');
      return;
    }

    await toggleDomainWishlist({
      domain: clean,
      dr: 0,
      status: 'Available',
      daysLeft: 'Active',
      registrar: '—',
      notes: newNotes.trim() || 'Added to Wishlist',
    });

    setNewDomain('');
    setNewNotes('');
    setShowAddModal(false);
    setItems(getLocalWishlist());
  };

  // Open Move to Marketplace Modal with smart pre-filled values
  const handleOpenMarketplaceModal = (item: WishlistItem) => {
    setSelectedForMarketplace(item);
    setMktPublishedSuccess(false);

    const calculatedDr = item.dr || 60;
    setMktDr(String(calculatedDr));
    setMktDa(String(Math.max(20, Math.round(calculatedDr * 0.8))));
    setMktTf(String(Math.max(15, Math.round(calculatedDr * 0.45))));

    // Intelligent default price estimation based on DR
    let estPrice = 450;
    if (calculatedDr >= 75) estPrice = 1650;
    else if (calculatedDr >= 65) estPrice = 950;
    else if (calculatedDr >= 50) estPrice = 650;
    else if (calculatedDr >= 30) estPrice = 450;
    setMktPrice(String(estPrice));
    setMktOriginalPrice(String(Math.round(estPrice * 1.3)));

    setMktReferringDomains(String(Number(item.refDomains) || Math.max(80, calculatedDr * 12)));
    setMktAgeYears('8');

    // Categorize by TLD or name
    if (item.domain.includes('tech') || item.domain.includes('ai') || item.domain.includes('cloud')) {
      setMktCategory('Technology & AI');
    } else if (item.domain.includes('crypto') || item.domain.includes('coin') || item.domain.includes('pay') || item.domain.includes('fin')) {
      setMktCategory('Finance & Crypto');
    } else if (item.domain.includes('health') || item.domain.includes('med') || item.domain.includes('care')) {
      setMktCategory('Health & Medical');
    } else {
      setMktCategory('Technology & AI');
    }

    setMktTopLinks('Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)');
    setMktDescription(`High-authority aged domain with clean backlink equity and instant transfer authorization.`);
    setMktBuyUrl('');
    setMktContactEmail('');
  };

  const [isFetchingAhrefsMkt, setIsFetchingAhrefsMkt] = useState(false);
  const [mktAutoFetchNotice, setMktAutoFetchNotice] = useState<string | null>(null);

  const handleAutoFetchWatchlistMkt = async () => {
    if (!selectedForMarketplace?.domain) return;
    setIsFetchingAhrefsMkt(true);
    setMktAutoFetchNotice(null);
    try {
      const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(selectedForMarketplace.domain)}&full=true`);
      if (res.ok) {
        const data = await res.json();
        setMktDr(String(data.dr ?? 0));
        setMktDa(String(data.da ?? 0));
        setMktTf(String(data.tf ?? 0));
        setMktReferringDomains(String(data.referringDomains ?? 0));
        setMktAgeYears(String(data.ageYears ?? 8));
        if (data.category) setMktCategory(data.category);
        if (data.topAuthorityLinks && Array.isArray(data.topAuthorityLinks) && data.topAuthorityLinks.length > 0) {
          const formatted = data.topAuthorityLinks.map((l: any) => `${l.name} (DR ${l.dr})`).join(', ');
          setMktTopLinks(formatted);
        }
        setMktAutoFetchNotice(`Ahrefs metrics & referring domain mentions auto-loaded for ${selectedForMarketplace.domain}!`);
        setTimeout(() => setMktAutoFetchNotice(null), 4000);
      }
    } catch (e) {}
    setIsFetchingAhrefsMkt(false);
  };


  const handlePublishToMarketplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForMarketplace) return;

    // Parse top authority links from text
    const parsedLinks = mktTopLinks
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const drMatch = trimmed.match(/DR\s*(\d+)/i) || trimmed.match(/\((\d+)\)/);
        const name = trimmed.replace(/\(DR\s*\d+\)/i, '').replace(/\(\d+\)/, '').replace(/DR\s*\d+/i, '').trim();
        const dr = drMatch ? parseInt(drMatch[1], 10) : 90;
        return {
          name: name || 'Authority Publication',
          dr: isNaN(dr) ? 90 : dr,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      })
      .filter((l) => l.name.length > 0);

    const cleanDomain = selectedForMarketplace.domain.trim().toLowerCase();
    const lastDot = cleanDomain.lastIndexOf('.');
    const tld = lastDot !== -1 ? cleanDomain.slice(lastDot) : '.com';

    addMarketplaceDomain({
      domain: cleanDomain,
      tld,
      dr: parseInt(mktDr, 10) || selectedForMarketplace.dr || 50,
      da: parseInt(mktDa, 10) || 40,
      tf: parseInt(mktTf, 10) || 25,
      price: parseFloat(mktPrice) || 499,
      originalPrice: mktOriginalPrice ? parseFloat(mktOriginalPrice) : undefined,
      category: mktCategory || 'General Authority',
      topAuthorityLinks: parsedLinks.length > 0 ? parsedLinks : [{ name: 'Forbes', dr: 94 }, { name: 'Wikipedia', dr: 98 }],
      referringDomains: parseInt(mktReferringDomains, 10) || 120,
      backlinks: parseInt(mktReferringDomains, 10) * 18 || 2500,
      ageYears: parseInt(mktAgeYears, 10) || 8,
      cleanHistory: true,
      verifiedOwnership: true,
      instantTransfer: true,
      description: mktDescription.trim() || 'Aged authority domain with clean backlink profile and instant transfer authorization.',
      buyUrl: mktBuyUrl.trim() || undefined,
      sellerContact: mktContactEmail.trim() ? { email: mktContactEmail.trim() } : undefined,
      status: 'available',
      featured: true,
    });

    setMktPublishedSuccess(true);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'dr') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const exportData = (format: 'csv' | 'xlsx') => {
    if (items.length === 0) return;

    const dataToExport = items.map((it, idx) => ({
      '#': idx + 1,
      'Domain Name': it.domain,
      Status: it.status,
      'DR (Ahrefs)': it.dr,
      Registrar: it.registrar,
      'Days Left': it.daysLeft,
      'Saved Date': it.createdAt ? new Date(it.createdAt).toLocaleDateString() : '',
      Notes: it.notes || '',
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0]).join(',');
      const rows = dataToExport.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `oldurl_wishlist_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wishlist');
      XLSX.writeFile(wb, `oldurl_wishlist_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto pb-12 font-sans">
      {/* My Account Navigation */}
      <AccountNavTabs activeTab="wishlist" />

      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-[#0d1b3e] via-[#1a2f64] to-[#25428a] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-[#FC6B17]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-[#FC6B17] text-white p-1.5 rounded-xl flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-200">
              Personal Watchlist
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Wishlist &amp; Favourites</h1>
          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
            Manage your bookmarked domains, monitor expiry status, or publish them directly to the Public Domain Marketplace for sale.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <Link
            href="/dashboard/marketplace"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-orange-300" />
            <span>View Marketplace</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-orange-600/30 hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Tabs */}
            <div className="bg-gray-100/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              {(['All', 'Available', 'Registered'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-white text-[#FC6B17] shadow-2xs font-extrabold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-400 font-medium ml-2">
              {filteredItems.length} {filteredItems.length === 1 ? 'domain' : 'domains'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute top-2.5 left-3" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-[#FC6B17] w-48 sm:w-60"
              />
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportData('csv')}
                  className="p-2 text-gray-500 hover:text-[#FC6B17] hover:bg-orange-50 rounded-xl border border-gray-200 transition-colors"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSearchAllWishlist}
                  className="px-3 py-1.5 bg-[#0d1b3e] hover:bg-[#1a2f64] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Scan all domains in results"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Audit All</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        {items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto shadow-inner">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#0d1b3e]">Your Wishlist is Empty</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Save high-value domains while auditing, or click &quot;Add Domain&quot; to bookmark any domains manually.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#FC6B17] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-[#e05607]"
              >
                + Add First Domain
              </button>
            </div>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No wishlisted domains match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('domain')}
                    className="py-3 px-4 w-[28%] min-w-[200px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'domain' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Domain Name</span>
                      {sortField === 'domain' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 w-[14%] min-w-[120px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'status' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Availability</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dr')}
                    className="py-3 px-3 w-[10%] min-w-[85px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'dr' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>DR (Ahrefs)</span>
                      {sortField === 'dr' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 w-[18%] min-w-[140px]">Registrar / Expiry</th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3 px-3 w-[14%] min-w-[110px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'createdAt' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Saved Date</span>
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 pr-4 w-[16%] min-w-[150px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id || item.domain} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="py-3.5 px-3 text-center text-gray-400 font-mono text-[11px] font-bold">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleDelete(item.domain)}
                          className="text-[#FC6B17] hover:opacity-75 transition-opacity"
                          title="Remove from Wishlist"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                        <div>
                          <div className="font-mono font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <span>{item.domain}</span>
                            <button
                              onClick={() => handleCopy(item.domain)}
                              className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy domain"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedDomain === item.domain && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                Copied!
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-gray-400 mt-0.5 max-w-xs truncate">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.status === 'Available' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Registered
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        item.dr >= 50
                          ? 'bg-orange-100 text-orange-900'
                          : item.dr >= 20
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.dr}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-gray-600">
                      <div>{item.registrar || '—'}</div>
                      <div className="text-[10px] text-gray-400">{item.daysLeft || 'Active'}</div>
                    </td>

                    <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                      {formatCheckDate(item.createdAt)}
                    </td>

                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Direct Publish / Move to Marketplace Action Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenMarketplaceModal(item)}
                          className="px-2.5 py-1 bg-gradient-to-r from-[#FC6B17] to-[#ff8c42] hover:from-[#e05607] hover:to-[#FC6B17] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all hover:scale-102 cursor-pointer"
                          title="Publish this domain directly to Public Domain Marketplace"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Sell / Marketplace</span>
                        </button>

                        <button
                          onClick={() => handleSearchAgain(item.domain)}
                          className="px-2 py-1 bg-gray-100 hover:bg-[#fff0e8] hover:text-[#FC6B17] text-gray-700 rounded-lg font-bold text-[11px] transition-colors"
                          title="Audit this domain again"
                        >
                          Audit
                        </button>

                        <button
                          onClick={() => handleDelete(item.domain)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                          title="Delete from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, sortedItems.length)}</strong> of{' '}
              <strong>{sortedItems.length}</strong> domains
            </div>
            <div className="flex items-center gap-1 font-bold">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {getPaginationRange(currentPage, totalPages).map((pg, i) => (
                <button
                  key={i}
                  onClick={() => typeof pg === 'number' && setCurrentPage(pg)}
                  disabled={typeof pg !== 'number'}
                  className={`min-w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    pg === currentPage
                      ? 'bg-[#FC6B17] text-white shadow-2xs'
                      : typeof pg === 'number'
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 cursor-default'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- MOVE / PUBLISH TO MARKETPLACE MODAL -------------------- */}
      {selectedForMarketplace && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8">
            <button
              type="button"
              onClick={() => setSelectedForMarketplace(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {mktPublishedSuccess ? (
              /* Success confirmation state */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0d1b3e]">Published to Public Marketplace!</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    <strong className="text-gray-900 font-bold">{selectedForMarketplace.domain}</strong> is now live on the public domain inventory for <strong className="text-[#FC6B17] font-black">${mktPrice} USD</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/dashboard/marketplace"
                    className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View in Marketplace</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedForMarketplace(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Publish Form */
              <form onSubmit={handlePublishToMarketplace} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-full">
                      <ShoppingBag className="w-3.5 h-3.5" /> Move from Wishlist to Public Marketplace
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFetchWatchlistMkt}
                      disabled={isFetchingAhrefsMkt}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#FC6B17] hover:text-[#e05607] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isFetchingAhrefsMkt ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-[#FC6B17]" />
                      ) : (
                        <Zap className="w-3 h-3 text-[#FC6B17]" />
                      )}
                      <span>⚡ Auto-Fetch from Ahrefs</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-[#0d1b3e] tracking-tight">
                    Publish {selectedForMarketplace.domain}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    List this wishlisted domain for direct purchase in the public marketplace.
                  </p>
                </div>

                {mktAutoFetchNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{mktAutoFetchNotice}</span>
                  </div>
                )}

                {/* Domain & Pricing Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Domain Name</label>
                    <input
                      type="text"
                      disabled
                      value={selectedForMarketplace.domain}
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Asking Price (USD $) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={mktPrice}
                      onChange={(e) => setMktPrice(e.target.value)}
                      placeholder="e.g. 750"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-gray-900"
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Ahrefs DR</label>
                    <input
                      type="number"
                      value={mktDr}
                      onChange={(e) => setMktDr(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Moz DA</label>
                    <input
                      type="number"
                      value={mktDa}
                      onChange={(e) => setMktDa(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Majestic TF</label>
                    <input
                      type="number"
                      value={mktTf}
                      onChange={(e) => setMktTf(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={mktAgeYears}
                      onChange={(e) => setMktAgeYears(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                    />
                  </div>
                </div>

                {/* Niche & Ref Domains */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Niche / Category</label>
                    <select
                      value={mktCategory}
                      onChange={(e) => setMktCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 outline-none focus:border-[#FC6B17]"
                    >
                      <option value="Technology & AI">Technology & AI</option>
                      <option value="Finance & Crypto">Finance & Crypto</option>
                      <option value="Health & Medical">Health & Medical</option>
                      <option value="Marketing & SEO">Marketing & SEO</option>
                      <option value="E-Commerce & SaaS">E-Commerce & SaaS</option>
                      <option value="News & Media">News & Media</option>
                      <option value="Lifestyle & Home">Lifestyle & Home</option>
                      <option value="Real Estate & Property">Real Estate & Property</option>
                      <option value="Legal & Law">Legal & Law</option>
                      <option value="General Authority">General Authority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Referring Domains</label>
                    <input
                      type="number"
                      value={mktReferringDomains}
                      onChange={(e) => setMktReferringDomains(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                    />
                  </div>
                </div>

                {/* Top Authority Links */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Top High-DR Authority Links (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={mktTopLinks}
                    onChange={(e) => setMktTopLinks(e.target.value)}
                    placeholder="e.g. Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17]"
                  />
                </div>

                {/* Pitch / Description */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description &amp; Highlights</label>
                  <textarea
                    rows={2}
                    value={mktDescription}
                    onChange={(e) => setMktDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedForMarketplace(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Publish to Public Marketplace</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* -------------------- ADD DOMAIN MODAL -------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
          >
            <h3 className="text-base font-bold text-[#0d1b3e] mb-1 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#FC6B17] fill-current" />
              Add Domain to Wishlist
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Bookmark domains here to monitor and revisit anytime.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Domain Name</label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. nichebrand.com"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-[#FC6B17]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Private Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Good backlinks, target for 301 redirect"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs"
              >
                Save to Wishlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
