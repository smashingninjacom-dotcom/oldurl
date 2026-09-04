'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ScannedBatch {
  id: string;
  name: string;
  date: string;
  domainCount: number;
  availableCount: number;
  maxDr: number;
  avgDr: number;
  status: 'Completed' | 'Processing';
}

const mockScannedBatches: ScannedBatch[] = [
  {
    id: 'BATCH-8921',
    name: 'Tech & SaaS Outbound Forbes Crawl',
    date: 'Sep 04, 2026 • 15:42',
    domainCount: 142,
    availableCount: 19,
    maxDr: 81,
    avgDr: 64.5,
    status: 'Completed',
  },
  {
    id: 'BATCH-8920',
    name: 'Eco & Green Tech Expired List',
    date: 'Sep 03, 2026 • 11:20',
    domainCount: 88,
    availableCount: 12,
    maxDr: 74,
    avgDr: 58.2,
    status: 'Completed',
  },
  {
    id: 'BATCH-8919',
    name: 'Health & Wellness Medical Outbound',
    date: 'Sep 02, 2026 • 18:05',
    domainCount: 210,
    availableCount: 34,
    maxDr: 79,
    avgDr: 61.0,
    status: 'Completed',
  },
  {
    id: 'BATCH-8918',
    name: 'Finance & Crypto Media Backlinks',
    date: 'Sep 01, 2026 • 09:14',
    domainCount: 175,
    availableCount: 22,
    maxDr: 86,
    avgDr: 68.3,
    status: 'Completed',
  },
];

export default function DomainAnalyticsScannedPage() {
  const [batches, setBatches] = useState(mockScannedBatches);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this scan history?')) {
      setBatches(batches.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">🏠 Home</Link>
        <span>›</span>
        <Link href="/dashboard/domain-analytics" className="text-gray-400 hover:text-gray-600">Domain Analytics</Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Scanned Batches</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b3e]">Domain Analytics - Scanned History</h1>
          <p className="text-xs text-gray-500 mt-1">
            Access past deep backlink scans, archived reports, and verified domain metrics.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/domain-analytics"
            className="flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Start New Batch Scan
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by batch name or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-gray-500 font-semibold">
          Showing {filteredBatches.length} scanned batches
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Batch ID &amp; Name</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4 text-center">Domains</th>
                <th className="py-3.5 px-4 text-center">Available</th>
                <th className="py-3.5 px-4 text-center">Max DR</th>
                <th className="py-3.5 px-4 text-center">Avg DR</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-gray-900">{batch.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{batch.id}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {batch.date}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-gray-900">
                    {batch.domainCount}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      {batch.availableCount}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-extrabold text-[#FC6B17] bg-[#fff3ec] px-2 py-0.5 rounded text-xs">
                      DR {batch.maxDr}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-gray-600">
                    {batch.avgDr}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href="/dashboard/domain-analytics-result"
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button
                        onClick={() => alert(`Downloading CSV report for ${batch.id}...`)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Batch"
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
      </div>
    </div>
  );
}
