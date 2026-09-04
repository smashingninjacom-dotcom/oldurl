'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Download,
  Filter,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Award,
  Link2,
  RefreshCw,
  Search,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

interface AnalyzedDomain {
  domain: string;
  dr: number;
  da: number;
  traffic: string;
  refDomains: number;
  backlinks: string;
  spamScore: number;
  tier1Count: number;
  topSources: string[];
  cleanHistory: boolean;
  status: 'Available' | 'Registered' | 'Auction';
}

const mockAnalyticsResults: AnalyzedDomain[] = [
  {
    domain: 'techinnovate-hub.org',
    dr: 76,
    da: 71,
    traffic: '12.4K/mo',
    refDomains: 1420,
    backlinks: '48.9K',
    spamScore: 1,
    tier1Count: 14,
    topSources: ['TechCrunch', 'Forbes', 'Wired', 'The Verge'],
    cleanHistory: true,
    status: 'Available',
  },
  {
    domain: 'greenplanet-eco.com',
    dr: 68,
    da: 64,
    traffic: '8.1K/mo',
    refDomains: 890,
    backlinks: '22.3K',
    spamScore: 2,
    tier1Count: 9,
    topSources: ['BBC', 'Guardian', 'National Geographic'],
    cleanHistory: true,
    status: 'Available',
  },
  {
    domain: 'healthpulse-today.io',
    dr: 64,
    da: 60,
    traffic: '5.2K/mo',
    refDomains: 610,
    backlinks: '14.5K',
    spamScore: 1,
    tier1Count: 7,
    topSources: ['Healthline', 'WebMD', 'NIH.gov'],
    cleanHistory: true,
    status: 'Auction',
  },
  {
    domain: 'financenordic-news.com',
    dr: 72,
    da: 69,
    traffic: '19.8K/mo',
    refDomains: 1150,
    backlinks: '39.0K',
    spamScore: 3,
    tier1Count: 12,
    topSources: ['Bloomberg', 'Reuters', 'WSJ'],
    cleanHistory: true,
    status: 'Registered',
  },
  {
    domain: 'edu-academyonline.org',
    dr: 59,
    da: 56,
    traffic: '3.4K/mo',
    refDomains: 480,
    backlinks: '11.2K',
    spamScore: 1,
    tier1Count: 5,
    topSources: ['Harvard.edu', 'MIT.edu', 'Wikipedia'],
    cleanHistory: true,
    status: 'Available',
  },
];

export default function DomainAnalyticsResultPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const filteredResults = mockAnalyticsResults.filter((item) => {
    const matchesSearch = item.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedDomains.length === filteredResults.length) {
      setSelectedDomains([]);
    } else {
      setSelectedDomains(filteredResults.map((d) => d.domain));
    }
  };

  const toggleSelect = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleCopy = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">🏠 Home</Link>
        <span>›</span>
        <Link href="/dashboard/domain-analytics" className="text-gray-400 hover:text-gray-600">Domain Analytics</Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Analytics Result</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b3e]">Domain Analytics Results</h1>
          <p className="text-xs text-gray-500 mt-1">
            Deep backlink authority, clean anchor audit, and organic traffic estimation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/domain-analytics"
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> New Scan
          </Link>
          <button
            onClick={() => alert('Exporting batch analysis CSV...')}
            className="flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
            <Globe className="w-4 h-4 text-indigo-500" /> Total Analyzed
          </div>
          <div className="text-2xl font-black text-gray-900">{mockAnalyticsResults.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">High authority batch</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
            <Award className="w-4 h-4 text-emerald-500" /> Avg Domain Rating
          </div>
          <div className="text-2xl font-black text-emerald-600">67.8</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Top 1% backlink strength</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> Clean History
          </div>
          <div className="text-2xl font-black text-blue-600">100%</div>
          <div className="text-[11px] text-gray-400 mt-0.5">0 spam / PBN penalties</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#FC6B17]" /> Available Right Now
          </div>
          <div className="text-2xl font-black text-[#FC6B17]">3</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Ready for standard reg</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search analyzed domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500">Status:</span>
          {['All', 'Available', 'Registered', 'Auction'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedDomains.length === filteredResults.length && filteredResults.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-center">DR / DA</th>
                <th className="py-3.5 px-3">Est. Traffic</th>
                <th className="py-3.5 px-3">Ref. Domains</th>
                <th className="py-3.5 px-3">Tier-1 Authority Links</th>
                <th className="py-3.5 px-3 text-center">Spam Score</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredResults.map((row) => (
                <tr key={row.domain} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(row.domain)}
                      onChange={() => toggleSelect(row.domain)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span>{row.domain}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'Auction'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-extrabold text-[#FC6B17] bg-[#fff3ec] px-1.5 py-0.5 rounded text-xs">
                      {row.dr}
                    </span>
                    <span className="text-gray-400 text-[10px] ml-1">/ {row.da}</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-gray-800">
                    {row.traffic}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-gray-800">
                    {row.refDomains.toLocaleString()} <span className="text-gray-400 font-normal">({row.backlinks})</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {row.topSources.map((source) => (
                        <span
                          key={source}
                          className="bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-blue-100"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        row.spamScore <= 2
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.spamScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(row.domain)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {copiedDomain === row.domain ? 'Copied!' : 'Copy'}
                      </button>
                      {row.status === 'Available' ? (
                        <a
                          href={`https://www.namecheap.com/domains/registration/results/?domain=${row.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FC6B17] text-white hover:bg-[#e05607] transition-colors"
                        >
                          Register
                        </a>
                      ) : (
                        <button
                          onClick={() => alert(`Saved ${row.domain} to your watchlist.`)}
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          title="Save to Watchlist"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
