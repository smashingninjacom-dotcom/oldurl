'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { fetchAllSearchHistory, getLocalSearchHistory, formatCheckDate } from '../../../lib/searchHistory';
import {
  Search,
  Download,
  Plus,
  BarChart2,
  MoreHorizontal,
  ChevronDown,
  Globe,
  Lock,
  CheckCircle2,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function PreviousSearchesPage() {
  const [data, setData] = useState<any[]>(() => getLocalSearchHistory());
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [daysFilter, setDaysFilter] = useState<'Any' | '< 30d' | '30-90d' | '> 90d'>('Any');
  const [minDrInput, setMinDrInput] = useState('');
  const [maxDrInput, setMaxDrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Instant synchronous 0ms load
    const local = getLocalSearchHistory();
    if (local && local.length > 0) {
      setData(local);
    }

    // Background cloud reconciliation without blocking UI
    fetchAllSearchHistory()
      .then(({ items }) => {
        if (items && items.length > 0) {
          setData(items);
        }
      })
      .catch((e) => {
        console.warn('History background sync note:', e);
      });
  }, []);

  const totalCount = data.length;
  const availableCount = data.filter((item) => item.status === 'Available').length;
  const registeredCount = totalCount - availableCount;
  const avgDr = totalCount > 0 ? Math.round(data.reduce((acc, it) => acc + (Number(it.dr) || 0), 0) / totalCount) : 0;

  const filtered = data.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (minDrInput && item.dr < Number(minDrInput)) return false;
    if (maxDrInput && item.dr > Number(maxDrInput)) return false;
    return true;
  });

  const handleExport = () => {
    const headers = ['#', 'Domain', 'Status', 'Days Left', 'DR', 'Registrar', 'Date Checked'];
    const rows = filtered.map((r) => [r.id, r.domain, r.status, r.daysLeft, r.dr, r.registrar, formatCheckDate(r.createdAt)]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `previous_searches_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">🏠 Home</Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Previous Searches</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1b3e]">Previous Searches</h1>
        <p className="text-xs text-gray-500 mt-0.5">All domains you have ever checked — most recent first.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {totalCount}
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Total Checked</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
            History
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight leading-none">
                {availableCount}
              </div>
              <div className="text-xs font-medium text-emerald-600/80 mt-1">Available to Register</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
            Available
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {registeredCount}
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Registered / Active</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
            Taken
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">
                {avgDr} <span className="text-xs font-semibold text-gray-400">/ 100</span>
              </div>
              <div className="text-xs font-medium text-gray-400 mt-1">Avg. Domain Rating</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
            SEO DR
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Status</span>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 font-bold">
              {(['All', 'Available', 'Registered'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === st
                      ? 'bg-[#FC6B17] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Extension Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Extension</span>
            <button className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-gray-700 flex items-center gap-1">
              All Extensions <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* DR Inputs */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">DR</span>
            <input
              type="number"
              placeholder="Min"
              value={minDrInput}
              onChange={(e) => setMinDrInput(e.target.value)}
              className="w-14 p-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxDrInput}
              onChange={(e) => setMaxDrInput(e.target.value)}
              className="w-14 p-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold"
            />
          </div>

          {/* Days Left Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Days Left</span>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 font-bold">
              {(['Any', '< 30d', '30-90d', '> 90d'] as const).map((dl) => (
                <button
                  key={dl}
                  onClick={() => setDaysFilter(dl)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    daysFilter === dl
                      ? 'bg-[#FC6B17] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {dl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute top-2.5 left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains..."
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
            />
          </div>
          <span className="text-gray-500 font-semibold text-[11px] whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0d1b3e]">All Searched Domains</h3>
            <p className="text-xs text-gray-400 mt-0.5">Historical log of all checked domains and SEO metrics</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExport}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" /> Export
            </button>
            <Link
              href="/dashboard/domain-checker"
              className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-4 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New Check
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No search history found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Any domains you scan will be permanently saved to your account and displayed here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/domain-checker"
                className="inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Start Your First Search
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Domain</th>
                  <th className="py-3 px-4 w-32">Status</th>
                  <th className="py-3 px-4 w-28">Days Left</th>
                  <th className="py-3 px-4 w-24">DR</th>
                  <th className="py-3 px-4 min-w-[150px]">Registrar</th>
                  <th className="py-3 px-4 w-36">Date Checked</th>
                  <th className="py-3 px-4 w-16 text-right">More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4 text-center text-gray-400 text-xs font-mono">{row.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[#0d1b3e] font-semibold text-xs sm:text-sm">{row.domain}</span>
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
                      <span className="text-emerald-700 font-semibold text-xs">⚑ {row.daysLeft}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
                        {row.dr} <BarChart2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium text-xs">{row.registrar}</td>
                    <td className="py-3.5 px-4 text-gray-400 font-medium text-xs whitespace-nowrap">
                      {formatCheckDate(row.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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
