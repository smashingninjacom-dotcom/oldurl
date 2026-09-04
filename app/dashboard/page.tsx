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
} from '../../lib/searchHistory';
import {
  Search,
  CheckCircle2,
  Lock,
  Activity,
  ChevronRight,
  Plus,
  BarChart2,
  History,
  User,
  Sparkles,
  Globe,
  ArrowRight,
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

export default function DashboardHomePage() {
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('Member');
  const [loading, setLoading] = useState(false);
  const [searches, setSearches] = useState<SearchRecord[]>(() => getLocalSearchHistory());
  const [quickInput, setQuickInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Compute immediate 0ms local metrics
  const initialLocal = getLocalSearchHistory();
  const initTotal = initialLocal.length;
  const initAvail = initialLocal.filter((s) => s.status === 'Available').length;
  const initReg = initTotal - initAvail;
  const initAvg = initTotal > 0 ? Math.round(initialLocal.reduce((acc, s) => acc + (s.dr || 0), 0) / initTotal) : 0;

  const [totalChecked, setTotalChecked] = useState(initTotal);
  const [availableCount, setAvailableCount] = useState(initAvail);
  const [registeredCount, setRegisteredCount] = useState(initReg);
  const [avgDr, setAvgDr] = useState(initAvg);

  useEffect(() => {
    // Instant sync from local storage
    const local = getLocalSearchHistory();
    if (local && local.length > 0) {
      setSearches(local);
      setTotalChecked(local.length);
      const avail = local.filter((s) => s.status === 'Available').length;
      setAvailableCount(avail);
      setRegisteredCount(local.length - avail);
      setAvgDr(Math.round(local.reduce((acc, s) => acc + (s.dr || 0), 0) / local.length));
    }

    async function loadUserData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          const name =
            currentUser.user_metadata?.full_name ||
            (currentUser.email ? currentUser.email.split('@')[0] : 'Member');
          setUserName(name);
        }
      } catch (e) {}

      // Reconcile with cloud without blocking UI
      fetchAllSearchHistory()
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

      setSearches((prev) => [newRecord, ...prev.filter((s) => s.domain !== newRecord.domain)]);
      setTotalChecked((prev) => prev + 1);
      if (result.status === 'Available') {
        setAvailableCount((prev) => prev + 1);
      } else {
        setRegisteredCount((prev) => prev + 1);
      }
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
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0d1b3e]">Your Recent Searches</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live log of domains audited under your Google account
            </p>
          </div>
          {searches.length > 0 && (
            <Link
              href="/dashboard/previous-searches"
              className="text-xs font-bold text-[#FC6B17] hover:underline flex items-center gap-1"
            >
              View all &gt;
            </Link>
          )}
        </div>

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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Domain</th>
                  <th className="py-3 px-4 w-36">Status</th>
                  <th className="py-3 px-4 w-32">Days Left</th>
                  <th className="py-3 px-4 w-28">DR</th>
                  <th className="py-3 px-4 min-w-[160px]">Registrar</th>
                  <th className="py-3 px-4 w-36">Date Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searches.map((row) => (
                  <tr key={row.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4 text-center text-gray-400 text-xs font-mono">
                      {row.id}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

