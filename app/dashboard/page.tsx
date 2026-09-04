'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchAllSearchHistory,
  saveLocalSearchHistory,
  syncToSupabase,
  getLocalSearchHistory,
  formatCheckDate,
  getCachedHistoryStats,
} from '../../lib/searchHistory';
import {
  Search,
  CheckCircle2,
  Lock,
  Activity,
  ChevronRight,
  ChevronLeft,
  Plus,
  BarChart2,
  History,
  User,
  Sparkles,
  Globe,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface SearchRecord {
  id: string;
  domain: string;
  status: string;
  daysLeft: string;
  dr: number;
  registrar: string;
  createdAt?: string;
}

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

export default function DashboardHomePage() {
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Member');
  const [loading, setLoading] = useState(false);
  const [searches, setSearches] = useState<SearchRecord[]>(() => getLocalSearchHistory());
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [sortField, setSortField] = useState<'id' | 'domain' | 'status' | 'daysLeft' | 'dr' | 'registrar' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: 'id' | 'domain' | 'status' | 'daysLeft' | 'dr' | 'registrar' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Instant 0ms cached metrics without any flash or delay
  const cachedStats = getCachedHistoryStats();
  const [totalChecked, setTotalChecked] = useState(cachedStats.totalChecked);
  const [availableCount, setAvailableCount] = useState(cachedStats.availableCount);
  const [registeredCount, setRegisteredCount] = useState(cachedStats.registeredCount);
  const [avgDr, setAvgDr] = useState(cachedStats.avgDr);

  useEffect(() => {
    const refreshData = () => {
      const stats = getCachedHistoryStats();
      if (stats && stats.totalChecked > 0) {
        setTotalChecked(stats.totalChecked);
        setAvailableCount(stats.availableCount);
        setRegisteredCount(stats.registeredCount);
        setAvgDr(stats.avgDr);
      }
      const local = getLocalSearchHistory();
      if (local && local.length > 0) {
        setSearches(local);
      }
    };

    refreshData();
    window.addEventListener('oldurl_history_updated', refreshData);
    window.addEventListener('storage', refreshData);

    async function loadUserData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user;

        if (currentUser) {
          setUser(currentUser);
          const name =
            currentUser.user_metadata?.full_name ||
            (currentUser.email ? currentUser.email.split('@')[0] : 'Member');
          setUserName(name);
        }
      } catch (e) {}

      // Reconcile with cloud without blocking UI
      fetchAllSearchHistory(true)
        .then(({ items, totalChecked: tot, availableCount: avail, registeredCount: reg, avgDr: avg }) => {
          if (items && items.length > 0) {
            setTotalChecked(tot);
            setAvailableCount(avail);
            setRegisteredCount(reg);
            setAvgDr(avg);
            setSearches(items);
          }
        })
        .catch((err) => {
          console.warn('Dashboard data fetch note:', err);
        });
    }

    loadUserData();

    return () => {
      window.removeEventListener('oldurl_history_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const auditDomain = async (domainToAudit: string) => {
    if (!domainToAudit || !domainToAudit.trim()) return;
    setIsChecking(true);
    const domainToCheck = domainToAudit.trim().toLowerCase();

    try {
      const res = await fetch('/api/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: [domainToCheck] }),
      });
      const data = await res.json();
      const result = data.results?.[0] || {
        domain: domainToCheck,
        status: 'Available',
        dr: 35,
        refDomains: 80,
        registrar: '—',
      };

      const newRecord: SearchRecord = {
        id: '01',
        domain: result.domain,
        status: result.status,
        daysLeft: result.status === 'Available' ? 'Dropped' : '365d',
        dr: Number(result.dr) || 0,
        registrar: result.registrar || (result.status === 'Available' ? '—' : 'Registered / Active'),
        createdAt: new Date().toISOString(),
      };

      saveLocalSearchHistory([newRecord as any]);
      syncToSupabase([newRecord as any]);

      const updatedHistory = getLocalSearchHistory();
      setSearches(updatedHistory);
      setTotalChecked(updatedHistory.length);
      const avail = updatedHistory.filter((s) => s.status === 'Available').length;
      setAvailableCount(avail);
      setRegisteredCount(updatedHistory.length - avail);
      setAvgDr(Math.round(updatedHistory.reduce((acc, s) => acc + (s.dr || 0), 0) / updatedHistory.length));
      setQuickInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  const handleQuickCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    await auditDomain(quickInput);
  };

  const handleSearchAgain = (domain: string) => {
    if (!domain) return;
    try {
      sessionStorage.setItem('pending_domains', domain);
    } catch (e) {}
    window.location.href = '/dashboard/results';
  };

  const filteredSearches = React.useMemo(() => {
    return searches.filter((item) => {
      if (statusFilter === 'Available' && item.status !== 'Available') return false;
      if (statusFilter === 'Registered' && item.status === 'Available') return false;
      if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
      return true;
    });
  }, [searches, statusFilter, searchQuery]);

  const sortedSearches = React.useMemo(() => {
    return [...filteredSearches].sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];

      if (sortField === 'id') {
        const aNum = parseInt(aVal, 10) || 0;
        const bNum = parseInt(bVal, 10) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (sortField === 'dr') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (sortField === 'daysLeft') {
        const aNum = parseInt(aVal, 10);
        const bNum = parseInt(bVal, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }
        return sortOrder === 'asc'
          ? String(aVal || '').localeCompare(String(bVal || ''))
          : String(bVal || '').localeCompare(String(aVal || ''));
      }
      if (sortField === 'createdAt') {
        const aTime = aVal ? new Date(aVal).getTime() : 0;
        const bTime = bVal ? new Date(bVal).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredSearches, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedSearches.length / pageSize) || 1;
  const paginatedSearches = sortedSearches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="hover:text-gray-600">🏠 Home</span>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Dashboard</span>
      </div>

      {/* Header with Title and User Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {totalChecked > 0
              ? `You have audited ${totalChecked} domain${totalChecked > 1 ? 's' : ''} in your workspace.`
              : 'Your workspace is ready with Unlimited Pro domain audits.'}
          </p>
        </div>

        <Link
          href="/dashboard/domain-checker"
          className="bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 self-start sm:self-auto transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New Domain Check
        </Link>
      </div>

      {/* 4 Dynamic User SaaS Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Checked */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {totalChecked}
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Domains Audited</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full self-start">
            Your Account
          </span>
        </div>

        {/* Card 2: Available */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight leading-none">
                {availableCount}
              </div>
              <div className="text-xs font-medium text-emerald-600/80 mt-1">Available to Register</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Live
          </span>
        </div>

        {/* Card 3: Registered */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {registeredCount}
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Registered / Active</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full self-start">
            Taken
          </span>
        </div>

        {/* Card 4: Avg DR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {avgDr} <span className="text-xs font-semibold text-gray-400">/ 100</span>
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Avg. Domain Rating</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full self-start">
            SEO DR
          </span>
        </div>
      </div>

      {/* Quick Check Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <form onSubmit={handleQuickCheck} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#FC6B17] transition-colors">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Quick audit domain (e.g. nichearchive.org or techradar-archive.org)..."
              className="w-full bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isChecking}
            className="w-full sm:w-auto bg-[#0d1b3e] hover:bg-[#1a2c5a] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60"
          >
            {isChecking ? 'Auditing...' : 'Instant Audit'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 5 Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Link
          href="/dashboard/domain-checker"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/10 shadow-2xs hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">
                Check Domains
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Single or bulk scan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/results"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/10 shadow-2xs hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">
                Audit Results
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">See latest check</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/previous-searches"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/10 shadow-2xs hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">
                Search History
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">All checked domains</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/profile"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/10 shadow-2xs hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">
                My Profile
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Manage account &amp; plan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/domain-analytics"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/10 shadow-2xs hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">
                Domain Analytics
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Backlinks &amp; traffic</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>
      </div>

      {/* Recent Searches Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0d1b3e]">Your Recent Searches</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live log of domains audited under your workspace ({totalChecked} total domains)
            </p>
          </div>
          {searches.length > 0 && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/previous-searches"
                className="text-xs font-bold text-[#FC6B17] hover:underline flex items-center gap-1"
              >
                View all history &gt;
              </Link>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        {searches.length > 0 && (
          <div className="p-3.5 sm:px-5 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs font-bold self-start sm:self-auto">
              {(['All', 'Available', 'Registered'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    statusFilter === st
                      ? 'bg-[#FC6B17] text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === st ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {st === 'All' ? totalChecked : st === 'Available' ? availableCount : registeredCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute top-2.5 left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter domains..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
              />
            </div>
          </div>
        )}

        {searches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No domain searches recorded yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Use the instant audit box above or click &quot;New Domain Check&quot; to audit your first domain!
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isChecking}
                onClick={() => auditDomain('techradar-archive.org')}
                className="text-xs text-[#FC6B17] bg-[#fff0e8] hover:bg-[#ffe5d6] px-3.5 py-1.5 rounded-full font-bold transition-colors disabled:opacity-60"
              >
                {isChecking ? 'Auditing...' : '⚡ Try sample: techradar-archive.org'}
              </button>
              <button
                type="button"
                disabled={isChecking}
                onClick={() => auditDomain('nichearchive-portal.org')}
                className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-full font-bold transition-colors disabled:opacity-60"
              >
                ⚡ Try sample: nichearchive-portal.org
              </button>
            </div>
          </div>
        ) : filteredSearches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No matching domains found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No domains match your current filter ({statusFilter}).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th
                    onClick={() => handleSort('id')}
                    className="py-3 px-4 w-14 text-center cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={sortField === 'id' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>#</span>
                      {sortField === 'id' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('domain')}
                    className="py-3 px-4 min-w-[200px] cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'domain' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>Domain</span>
                      {sortField === 'domain' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 w-32 cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'status' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('daysLeft')}
                    className="py-3 px-4 w-28 cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'daysLeft' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>Days Left</span>
                      {sortField === 'daysLeft' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dr')}
                    className="py-3 px-4 w-24 cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'dr' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>DR</span>
                      {sortField === 'dr' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('registrar')}
                    className="py-3 px-4 min-w-[150px] cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'registrar' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>Registrar</span>
                      {sortField === 'registrar' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3 px-4 w-36 cursor-pointer select-none hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'createdAt' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-700'}>Date Checked</span>
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSearches.map((row, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.id + '-' + row.domain} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs font-mono font-bold">
                        {itemIndex}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[#0d1b3e] font-semibold text-xs sm:text-sm">
                            {row.domain}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {row.status === 'Available' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
                            <Lock className="w-3 h-3 text-[#FC6B17]" />
                            <span>Registered</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-700 font-semibold text-xs">
                          ⚑ {row.daysLeft}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-[#FC6B17] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                          {row.dr} <BarChart2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium text-xs">{row.registrar}</td>
                      <td className="py-3.5 px-4 text-gray-400 font-medium text-xs whitespace-nowrap">
                        {formatCheckDate(row.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSearchAgain(row.domain)}
                            className="p-1.5 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Search Again in Results"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/dashboard/domain-analytics-result?domain=${encodeURIComponent(row.domain)}`}
                            className="p-1.5 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Domain Analytics"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Number-wise Pagination Bar */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                <div className="text-xs text-gray-500 font-medium">
                  Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, sortedSearches.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{sortedSearches.length}</span> domains
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 hover:text-[#0d1b3e] hover:border-gray-300 disabled:opacity-35 disabled:pointer-events-none disabled:shadow-none transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {getPaginationRange(currentPage, totalPages).map((num, i) =>
                      num === '...' ? (
                        <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold text-xs select-none">
                          ···
                        </span>
                      ) : (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setCurrentPage(Number(num))}
                          className={`w-9 h-9 min-w-[36px] rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                            currentPage === num
                              ? 'bg-[#FC6B17] text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20'
                              : 'bg-white text-gray-700 border border-gray-200 shadow-xs hover:bg-orange-50/50 hover:border-orange-300 hover:text-[#FC6B17] active:scale-95'
                          }`}
                        >
                          {num}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 hover:text-[#0d1b3e] hover:border-gray-300 disabled:opacity-35 disabled:pointer-events-none disabled:shadow-none transition-all active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

