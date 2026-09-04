'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import {
  fetchAllSearchHistory,
  getLocalSearchHistory,
  formatCheckDate,
  clearSearchHistory,
  deleteHistoryItem,
  getSearchSessions,
  deleteSearchSession,
  SearchSession,
  getCachedHistoryStats,
} from '../../../lib/searchHistory';
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
  Layers,
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
  const router = useRouter();
  const [data, setData] = useState<any[]>(() => getLocalSearchHistory());
  const [sessions, setSessions] = useState<SearchSession[]>(() => getSearchSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
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
    const refreshData = () => {
      const local = getLocalSearchHistory(false);
      if (local && local.length > 0) {
        setData(local);
      }
      const localSessions = getSearchSessions();
      if (localSessions && localSessions.length > 0) {
        setSessions(localSessions);
      }
    };

    refreshData();
    window.addEventListener('oldurl_history_updated', refreshData);
    window.addEventListener('storage', refreshData);

    // Background cloud reconciliation without blocking UI
    fetchAllSearchHistory(false)
      .then(({ items }) => {
        if (items && items.length > 0) {
          setData(items);
          setSessions(getSearchSessions());
        }
      })
      .catch((e) => {
        console.warn('History background sync note:', e);
      });

    return () => {
      window.removeEventListener('oldurl_history_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const activeData = React.useMemo(() => {
    if (selectedSessionId === 'all') return data;
    const sess = sessions.find((s) => s.id === selectedSessionId);
    return sess ? sess.items : data;
  }, [data, selectedSessionId, sessions]);

  const cachedStats = getCachedHistoryStats();
  const isAll = selectedSessionId === 'all';
  const totalCount = isAll && cachedStats.totalChecked > activeData.length ? cachedStats.totalChecked : activeData.length;
  const availableCount = isAll && cachedStats.totalChecked > activeData.length ? cachedStats.availableCount : activeData.filter((item) => item.status === 'Available').length;
  const registeredCount = isAll && cachedStats.totalChecked > activeData.length ? cachedStats.registeredCount : (totalCount - availableCount);
  const avgDr = isAll && cachedStats.totalChecked > activeData.length ? cachedStats.avgDr : (totalCount > 0 ? Math.round(activeData.reduce((acc, it) => acc + (Number(it.dr) || 0), 0) / totalCount) : 0);

  const scopedTotalCount = statusFilter === 'All'
    ? activeData.length
    : statusFilter === 'Available'
    ? availableCount
    : registeredCount;

  const availableExtensions = React.useMemo(() => {
    const map = new Map<string, number>();
    const scopedData = statusFilter === 'All'
      ? activeData
      : activeData.filter((item) => item.status === statusFilter);

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
  }, [activeData, statusFilter]);

  // If currently selected extension is not present in scoped status data, reset to All
  useEffect(() => {
    if (extensionFilter !== 'All') {
      const exists = availableExtensions.some((e) => e.ext.toLowerCase() === extensionFilter.toLowerCase());
      if (!exists) {
        setExtensionFilter('All');
      }
    }
  }, [availableExtensions, extensionFilter]);

  const filtered = React.useMemo(() => {
    return activeData
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
  }, [activeData, statusFilter, extensionFilter, searchQuery, minDrInput, maxDrInput, daysFilter, sortField, sortOrder]);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportData = (format: 'csv' | 'xlsx' | 'xml') => {
    const selectedSess = sessions.find((s) => s.id === selectedSessionId);
    const sessionPrefix = selectedSess ? selectedSess.name.replace(/[^a-zA-Z0-9]/g, '_') : 'previous_searches';
    const filename = `${sessionPrefix}_${new Date().toISOString().slice(0, 10)}`;
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
      setSessions([]);
      setSelectedSessionId('all');
      setCurrentPage(1);
    }
  };

  const handleDeleteDomain = async (domain: string) => {
    await deleteHistoryItem(domain);
    setData((prev) => prev.filter((d) => d.domain.toLowerCase().trim() !== domain.toLowerCase().trim()));
    setSessions(getSearchSessions());
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Remove this previous search session?')) {
      deleteSearchSession(sessionId);
      const updated = getSearchSessions();
      setSessions(updated);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId('all');
      }
    }
  };

  const handleSearchAgain = (domainList: string[]) => {
    if (!domainList || domainList.length === 0) return;
    try {
      sessionStorage.setItem('pending_domains', domainList.join('\n'));
    } catch (e) {}
    router.push('/dashboard/results');
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

      {/* -------------------- PREVIOUS SEARCHES (SEARCH-WISE BATCHES) -------------------- */}
      {sessions.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center font-bold shadow-2xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#0d1b3e] uppercase tracking-wider">
                  Search-Wise Batches
                </h3>
                <span className="bg-orange-50 text-[#FC6B17] border border-orange-100/80 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {sessions.length} {sessions.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>
            </div>

            {/* Quick Batch Jump Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-xl outline-none focus:border-[#FC6B17] transition-colors cursor-pointer"
              >
                <option value="all">
                  All Searches ({Math.max(data.length, cachedStats.totalChecked).toLocaleString()} domains)
                </option>
                {sessions.map((sess, idx) => (
                  <option key={sess.id} value={sess.id}>
                    Batch #{sessions.length - idx}: {sess.name} ({sess.domainCount} domains) • {formatCheckDate(sess.createdAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clean Horizontal Scroll Carousel */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {/* All Searches Master Chip */}
            <button
              type="button"
              onClick={() => {
                setSelectedSessionId('all');
                setCurrentPage(1);
              }}
              className={`group shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                selectedSessionId === 'all'
                  ? 'bg-[#0d1b3e] text-white border-[#0d1b3e] shadow-xs ring-2 ring-[#0d1b3e]/15'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 shadow-2xs'
              }`}
            >
              <span>All Searches</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  selectedSessionId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                }`}
              >
                {Math.max(data.length, cachedStats.totalChecked).toLocaleString()}
              </span>
            </button>

            {/* Individual Batch Cards */}
            {sessions.map((sess, idx) => {
              const batchNum = sessions.length - idx;
              const isSelected = selectedSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    setCurrentPage(1);
                  }}
                  className={`group shrink-0 cursor-pointer pl-3.5 pr-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FC6B17] to-[#ff7d33] text-white border-[#FC6B17] shadow-sm ring-2 ring-[#FC6B17]/20'
                      : 'bg-white hover:bg-orange-50/40 text-gray-800 border-gray-200 hover:border-orange-200 shadow-2xs'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-black/15 text-white'
                        : 'bg-orange-50 text-[#FC6B17] border border-orange-100'
                    }`}
                  >
                    #{batchNum}
                  </span>

                  <div className="flex flex-col text-left">
                    <span className="truncate max-w-[125px] font-bold leading-tight">
                      {sess.name.replace(/Check$/i, '').trim() || `${sess.domainCount} Domains`}
                    </span>
                    <span
                      className={`text-[10px] font-normal leading-tight ${
                        isSelected ? 'text-white/80' : 'text-gray-400'
                      }`}
                    >
                      {formatCheckDate(sess.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-0.5 ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-700 group-hover:bg-orange-100 group-hover:text-[#FC6B17]'
                    }`}
                  >
                    {sess.domainCount}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    className={`p-1 rounded-lg transition-colors ${
                      isSelected
                        ? 'text-white/70 hover:text-white hover:bg-white/20'
                        : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title="Remove this batch"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

          <div className="flex items-center gap-2.5 flex-wrap">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={() => handleSearchAgain(filtered.map((r) => r.domain))}
                className="bg-orange-50 hover:bg-[#FC6B17] text-[#FC6B17] hover:text-white border border-orange-200 px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Re-run search for current selection in Results tab"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Search Again ({filtered.length})</span>
              </button>
            )}

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
                          <button
                            type="button"
                            onClick={() => handleSearchAgain([row.domain])}
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
