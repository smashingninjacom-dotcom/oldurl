'use client';

import React from 'react';
import Link from 'next/link';
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
  ExternalLink,
  Globe,
} from 'lucide-react';

const recentSearches = [
  { id: '01', domain: 'withcove.com', status: 'Registered', daysLeft: '365d', dr: 53, registrar: 'Amazon Registrar, Inc.' },
  { id: '02', domain: 'skinofcolorsociety.org', status: 'Registered', daysLeft: '1705d', dr: 63, registrar: 'GoDaddy.com, LLC' },
  { id: '03', domain: 'porphyriafoundation.org', status: 'Registered', daysLeft: '281d', dr: 58, registrar: 'GoDaddy.com, LLC' },
  { id: '04', domain: 'embody-ayurveda.com', status: 'Registered', daysLeft: '363d', dr: 15, registrar: 'Squarespace Domains LLC' },
  { id: '05', domain: 'allergyuk.org', status: 'Registered', daysLeft: '1085d', dr: 77, registrar: 'Mesh Digital Limited' },
  { id: '06', domain: '7cups.com', status: 'Registered', daysLeft: '344d', dr: 75, registrar: 'Amazon Registrar, Inc.' },
  { id: '07', domain: 'tempurpedic.com', status: 'Registered', daysLeft: '145d', dr: 72, registrar: 'MarkMonitor Inc.' },
  { id: '08', domain: 'memberclicks.net', status: 'Registered', daysLeft: '223d', dr: 46, registrar: 'eNom, LLC' },
  { id: '09', domain: 'techradar-archive.org', status: 'Available', daysLeft: 'Dropped', dr: 58, registrar: '—' },
  { id: '10', domain: 'buhi.org', status: 'Registered', daysLeft: '104d', dr: 72, registrar: 'GoDaddy.com, LLC' },
];

export default function DashboardHomePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="hover:text-gray-600 cursor-pointer">🏠 Home</span>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Dashboard</span>
      </div>

      {/* Header with Title and CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d1b3e] tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time overview of your bulk domain lookups, availability, and SEO backlink authority.
          </p>
        </div>

        <Link
          href="/dashboard/domain-checker"
          className="bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(252,107,23,0.3)] inline-flex items-center gap-2 self-start sm:self-auto transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New Domain Check
        </Link>
      </div>

      {/* 4 Premium SaaS Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Checked */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-purple-200 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">14,390</div>
              <div className="text-xs font-medium text-gray-400 mt-1">Total Checked</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full self-start">
            All time
          </span>
        </div>

        {/* Card 2: Available */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-emerald-200 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight leading-none">117</div>
              <div className="text-xs font-medium text-emerald-600/80 mt-1">Available</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Ready
          </span>
        </div>

        {/* Card 3: Registered */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-orange-200 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">14,103</div>
              <div className="text-xs font-medium text-gray-400 mt-1">Registered</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full self-start">
            Taken
          </span>
        </div>

        {/* Card 4: Avg DR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0d1b3e] tracking-tight leading-none">60 <span className="text-xs font-semibold text-gray-400">/ 100</span></div>
              <div className="text-xs font-medium text-gray-400 mt-1">Avg. Domain Rating</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full self-start">
            High DR
          </span>
        </div>
      </div>

      {/* 5 Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Link
          href="/dashboard/domain-checker"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">Check Domains</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Single or bulk lookup</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/results"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">View Results</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">See your latest checks</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/previous-searches"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">Search History</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">All checked domains</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/profile"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">My Profile</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Manage account &amp; plan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>

        <Link
          href="/dashboard/domain-analytics"
          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-md flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d1b3e] group-hover:text-[#FC6B17] truncate transition-colors">Domain Analytics</div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">Backlinks &amp; traffic</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FC6B17] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </Link>
      </div>

      {/* Recent Searches Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0d1b3e]">Recent Searches</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your last 10 checked domains with instant WHOIS &amp; DR status</p>
          </div>
          <Link
            href="/dashboard/previous-searches"
            className="text-xs font-bold text-[#FC6B17] hover:underline flex items-center gap-1"
          >
            View all &gt;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Domain</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-32">Days Left</th>
                <th className="py-3 px-4 w-28">DR</th>
                <th className="py-3 px-4 min-w-[180px]">Registrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSearches.map((row) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
