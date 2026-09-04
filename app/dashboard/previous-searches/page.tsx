'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  Search,
  Download,
  Plus,
  BarChart2,
  MoreHorizontal,
  ChevronDown,
  Globe,
  Lock,
} from 'lucide-react';

export default function PreviousSearchesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [daysFilter, setDaysFilter] = useState<'Any' | '< 30d' | '30-90d' | '> 90d'>('Any');
  const [minDrInput, setMinDrInput] = useState('');
  const [maxDrInput, setMaxDrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadHistory() {
      let localList: any[] = [];
      try {
        const cached = localStorage.getItem('oldurl_cached_history') || sessionStorage.getItem('last_scanned_results');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localList = parsed.map((item: any, idx: number) => ({
              id: String(idx + 1).padStart(2, '0'),
              domain: item.domain,
              status: item.status || 'Available',
              daysLeft: item.daysLeft || (item.status === 'Available' ? 'Dropped' : '30d'),
              dr: Number(item.dr) || 0,
              registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
            }));
            setData(localList);
          }
        }
      } catch (e) {}

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cloudHistory, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2000);

          if (!error && cloudHistory && cloudHistory.length > 0) {
            const mapped = cloudHistory.map((item, idx) => ({
              id: String(idx + 1).padStart(2, '0'),
              domain: item.domain,
              status: item.status || 'Available',
              daysLeft: item.days_left || (item.status === 'Available' ? 'Dropped' : '30d'),
              dr: Number(item.dr) || 0,
              registrar: item.registrar || (item.status === 'Available' ? '—' : 'Namecheap, Inc.'),
            }));
            if (mapped.length >= localList.length) {
              setData(mapped);
            }
            setLoading(false);
            return;
          }
        }
        if (localList.length > 0) {
          setData(localList);
        } else {
          setData([]);
        }
      } catch (e) {
        console.warn('History load note:', e);
        if (localList.length > 0) setData(localList);
        else setData([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = data.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (minDrInput && item.dr < Number(minDrInput)) return false;
    if (maxDrInput && item.dr > Number(maxDrInput)) return false;
    return true;
  });

  const handleExport = () => {
    const headers = ['#', 'Domain', 'Status', 'Days Left', 'DR', 'Registrar'];
    const rows = filtered.map((r) => [r.id, r.domain, r.status, r.daysLeft, r.dr, r.registrar]);
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
                  <th className="py-3 px-4 min-w-[220px]">Domain</th>
                  <th className="py-3 px-4 w-36">Status</th>
                  <th className="py-3 px-4 w-32">Days Left</th>
                  <th className="py-3 px-4 w-28">DR</th>
                  <th className="py-3 px-4 min-w-[180px]">Registrar</th>
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
