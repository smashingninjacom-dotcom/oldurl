'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  Layers,
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  Plus,
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

export default function DomainAnalyticsScannedPage() {
  const [batches, setBatches] = useState<ScannedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadBatches() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: records, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && records && records.length > 0) {
            // Group records into batch sessions by day/hour
            const grouped: { [key: string]: typeof records } = {};
            records.forEach((r) => {
              const dateKey = new Date(r.created_at || Date.now())
                .toISOString()
                .slice(0, 13); // group by hour
              if (!grouped[dateKey]) grouped[dateKey] = [];
              grouped[dateKey].push(r);
            });

            const parsedBatches: ScannedBatch[] = Object.keys(grouped).map((k, idx) => {
              const list = grouped[k];
              const dateStr = new Date(list[0].created_at || Date.now()).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const maxDr = Math.max(...list.map((it) => Number(it.dr) || 0), 0);
              const avgDr =
                list.length > 0
                  ? Number((list.reduce((acc, it) => acc + (Number(it.dr) || 0), 0) / list.length).toFixed(1))
                  : 0;
              const availableCount = list.filter((it) => it.status === 'Available').length;

              return {
                id: `BATCH-${String(records.length - idx).padStart(4, '0')}`,
                name: `${list[0].domain} & ${list.length} domain scan`,
                date: dateStr,
                domainCount: list.length,
                availableCount,
                maxDr,
                avgDr,
                status: 'Completed',
              };
            });

            setBatches(parsedBatches);
            setLoading(false);
            return;
          }
        }
        setBatches([]);
      } catch (err) {
        console.warn('Scanned batches error:', err);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    }

    loadBatches();
  }, []);

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this scan from your view?')) {
      setBatches(batches.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          🏠 Home
        </Link>
        <span>›</span>
        <Link href="/dashboard/domain-analytics" className="text-gray-400 hover:text-gray-600">
          Domain Analytics
        </Link>
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
          Showing {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading scan history...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No scanned batches yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Run domain audits or bulk scans and your completed batch reports will be archived here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/domain-analytics"
                className="inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Run First Domain Scan
              </Link>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
