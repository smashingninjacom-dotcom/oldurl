'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

const previousSearchesData = [
  { id: '01', domain: 'nhri.org.tw', status: 'Registered', daysLeft: '—', dr: 73, registrar: '—' },
  { id: '02', domain: 'nct.org.uk', status: 'Registered', daysLeft: '155d', dr: 77, registrar: '123-Reg Limited t/a 123-reg' },
  { id: '03', domain: 'michiganmedicine.org', status: 'Registered', daysLeft: '280d', dr: 78, registrar: 'GoDaddy.com, LLC' },
  { id: '04', domain: 'merckvetmanual.com', status: 'Registered', daysLeft: '674d', dr: 81, registrar: 'MarkMonitor Inc.' },
  { id: '05', domain: 'medcraveonline.com', status: 'Registered', daysLeft: '183d', dr: 77, registrar: 'Dreamscape Networks Intern...' },
  { id: '06', domain: 'malucoffee.com', status: 'Registered', daysLeft: '679d', dr: 1.2, registrar: 'GoDaddy.com, LLC' },
  { id: '07', domain: 'kardia.com', status: 'Registered', daysLeft: '87d', dr: 57, registrar: 'GoDaddy.com, LLC' },
  { id: '08', domain: 'international-journal-of-gynecological-cancer.com', status: 'Registered', daysLeft: '0d', dr: 66, registrar: 'SafeNames Ltd.' },
  { id: '09', domain: 'girlshealth.gov', status: 'Registered', daysLeft: '11d', dr: 72, registrar: 'dot.gov' },
  { id: '10', domain: 'geologie.com', status: 'Registered', daysLeft: '28d', dr: 41, registrar: 'GoDaddy.com, LLC' },
];

export default function PreviousSearchesPage() {
  const [data, setData] = useState(previousSearchesData);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [daysFilter, setDaysFilter] = useState<'Any' | '< 30d' | '30-90d' | '> 90d'>('Any');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('oldurl_search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setData(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const filtered = data.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
              type="text"
              placeholder="Min"
              className="w-12 p-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold"
            />
            <span className="text-gray-400">-</span>
            <input
              type="text"
              placeholder="Max"
              className="w-12 p-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold"
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
          <span className="text-gray-400 font-medium text-[11px] whitespace-nowrap">
            14439 results
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
      </div>
    </div>
  );
}
