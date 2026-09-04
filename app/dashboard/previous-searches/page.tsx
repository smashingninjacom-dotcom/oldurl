'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { fetchAllSearchHistory, getLocalSearchHistory, formatCheckDate, clearSearchHistory, deleteHistoryItem } from '../../../lib/searchHistory';
import {
  Search,
  Download,
  Plus,
  BarChart2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Globe,
  Lock,
  CheckCircle2,
  Activity,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Trash2,
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

export default function PreviousSearchesPage() {
  const [data, setData] = useState<any[]>(() => getLocalSearchHistory());
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [extensionFilter, setExtensionFilter] = useState<string>('All');
  const [daysFilter, setDaysFilter] = useState<'Any' | '< 30d' | '30-90d' | '> 90d'>('Any');
  const [minDrInput, setMinDrInput] = useState('');
  const [maxDrInput, setMaxDrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'id' | 'domain' | 'status' | 'daysLeft' | 'dr' | 'registrar' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const handleSort = (field: 'id' | 'domain' | 'status' | 'daysLeft' | 'dr' | 'registrar' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

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

  const scopedTotalCount = statusFilter === 'All'
    ? data.length
    : statusFilter === 'Available'
    ? availableCount
    : registeredCount;

  const availableExtensions = React.useMemo(() => {
    const map = new Map<string, number>();
    const scopedData = statusFilter === 'All'
      ? data
      : data.filter((item) => item.status === statusFilter);

    scopedData.forEach((item) => {
      if (!item.domain) return;
      const clean = item.domain.trim().toLowerCase();
      const lastDot = clean.lastIndexOf('.');
      if (lastDot !== -1 && lastDot < clean.length - 1) {
        const ext = clean.slice(lastDot);
        map.set(ext, (map.get(ext) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([ext, count]) => ({ ext, count }));
  }, [data, statusFilter]);

  // If currently selected extension is not present in scoped status data, reset to All
  useEffect(() => {
    if (extensionFilter !== 'All') {
      const exists = availableExtensions.some((e) => e.ext.toLowerCase() === extensionFilter.toLowerCase());
      if (!exists) {
        setExtensionFilter('All');
      }
    }
  }, [availableExtensions, extensionFilter]);

  const filtered = data
    .filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (extensionFilter !== 'All' && !item.domain.toLowerCase().endsWith(extensionFilter.toLowerCase())) return false;
      if (searchQuery && !item.domain.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (minDrInput && item.dr < Number(minDrInput)) return false;
      if (maxDrInput && item.dr > Number(maxDrInput)) return false;
      if (daysFilter !== 'Any') {
        const rawDays = String(item.daysLeft || '').toLowerCase().trim();
        let daysNum = parseInt(rawDays, 10);
        if (isNaN(daysNum)) {
          if (rawDays.includes('pending') || rawDays.includes('expir') || rawDays.includes('redemption')) {
            daysNum = 5;
          } else if (rawDays.includes('drop') || rawDays.includes('avail')) {
            daysNum = 0;
          } else {
            daysNum = 365;
          }
        }

        if (daysFilter === '< 30d') {
          if (daysNum >= 30) return false;
        } else if (daysFilter === '30-90d') {
          if (daysNum < 30 || daysNum > 90) return false;
        } else if (daysFilter === '> 90d') {
          if (daysNum <= 90) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

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

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportData = (format: 'csv' | 'xlsx' | 'xml') => {
    const filename = `previous_searches_${new Date().toISOString().slice(0, 10)}`;
    const headers = ['#', 'Domain', 'Status', 'Days Left', 'DR', 'Registrar', 'Date Checked'];
    const rows = filtered.map((r) => [r.id, r.domain, r.status, r.daysLeft, r.dr, r.registrar, formatCheckDate(r.createdAt)]);

    if (format === 'csv') {
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      const sheetData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Previous Searches');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<domains>\n';
      filtered.forEach((r) => {
        xml += '  <domain_record>\n';
        xml += `    <id>${r.id}</id>\n`;
        xml += `    <domain>${r.domain}</domain>\n`;
        xml += `    <status>${r.status}</status>\n`;
        xml += `    <days_left>${r.daysLeft}</days_left>\n`;
        xml += `    <domain_rating>${r.dr}</domain_rating>\n`;
        xml += `    <registrar>${String(r.registrar || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</registrar>\n`;
        xml += `    <date_checked>${formatCheckDate(r.createdAt)}</date_checked>\n`;
        xml += '  </domain_record>\n';
      });
      xml += '</domains>';
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your recent search history?')) {
      await clearSearchHistory();
      setData([]);
      setCurrentPage(1);
    }
  };

  const handleDeleteDomain = async (domain: string) => {
    await deleteHistoryItem(domain);
    setData((prev) => prev.filter((d) => d.domain.toLowerCase().trim() !== domain.toLowerCase().trim()));
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
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
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
            <select
              value={extensionFilter}
              onChange={(e) => {
                setExtensionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-bold text-gray-700 outline-none cursor-pointer focus:border-[#FC6B17]"
            >
              <option value="All">All Extensions ({scopedTotalCount})</option>
              {availableExtensions.map(({ ext, count }) => (
                <option key={ext} value={ext}>
                  {ext} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* DR Inputs */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">DR</span>
            <input
              type="number"
              placeholder="Min"
              value={minDrInput}
              onChange={(e) => {
                setMinDrInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-14 p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold outline-none focus:border-[#FC6B17]"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxDrInput}
              onChange={(e) => {
                setMaxDrInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-14 p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs font-bold outline-none focus:border-[#FC6B17]"
            />
          </div>

          {/* Days Left Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Days Left</span>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 font-bold">
              {(['Any', '< 30d', '30-90d', '> 90d'] as const).map((dl) => (
                <button
                  key={dl}
                  onClick={() => {
                    setDaysFilter(dl);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    daysFilter === dl
                      ? 'bg-[#FC6B17] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {dl === '30-90d' ? '30–90d' : dl}
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
            <h3 className="text-base font-bold text-[#0d1b3e]">Recently Searched Domains</h3>
            <p className="text-xs text-gray-400 mt-0.5">Live log of your recent domain searches and SEO checks</p>
          </div>

          <div className="flex items-center gap-2.5">
            {data.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Clear recent search history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Export</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        exportData('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#FC6B17] rounded-xl transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">CSV</span>
                      <span>Export as CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportData('xlsx');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#FC6B17] rounded-xl transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-mono text-[10px] font-bold flex items-center justify-center">XLS</span>
                      <span>Export as Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportData('xml');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#FC6B17] rounded-xl transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-mono text-[10px] font-bold flex items-center justify-center">XML</span>
                      <span>Export as XML (.xml)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <Link
              href="/dashboard/domain-checker"
              className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-4 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New Check
            </Link>
          </div>
        </div>

        {data.length === 0 ? (
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
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No matching domains found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No domains match your current filter criteria {extensionFilter !== 'All' ? `(${extensionFilter})` : ''}. Try resetting your filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setExtensionFilter('All');
                  setMinDrInput('');
                  setMaxDrInput('');
                  setDaysFilter('Any');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset All Filters
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
                  <th className="py-3 px-4 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => {
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
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/domain-analytics-result?domain=${encodeURIComponent(row.domain)}`}
                            className="p-1.5 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Domain Analytics"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteDomain(row.domain)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from recent searches"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Number-wise Pagination Bar */}
            {Math.ceil(filtered.length / pageSize) > 1 && (
              <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                <div className="text-xs text-gray-500 font-medium">
                  Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{filtered.length}</span> domains
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
                    {getPaginationRange(currentPage, Math.ceil(filtered.length / pageSize)).map((num, i) =>
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
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                    disabled={currentPage === Math.ceil(filtered.length / pageSize)}
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
