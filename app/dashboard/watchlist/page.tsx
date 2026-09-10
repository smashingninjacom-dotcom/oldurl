'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import {
  WishlistItem,
  getLocalWishlist,
  saveLocalWishlist,
  fetchCloudWishlist,
  removeFromWishlist,
  toggleDomainWishlist,
} from '../../../lib/watchlist';
import { formatCheckDate, setPendingDomainsToScan } from '../../../lib/searchHistory';
import {
  Bookmark,
  Trash2,
  Plus,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
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

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>(() => getLocalWishlist());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Registered'>('All');
  const [newDomain, setNewDomain] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortField, setSortField] = useState<'domain' | 'dr' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleSort = (field: 'domain' | 'dr' | 'status' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'domain' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getLocalWishlist());
    };

    window.addEventListener('oldurl_wishlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    fetchCloudWishlist().then((list) => {
      if (list && list.length > 0) {
        setItems(list);
      }
    });

    return () => {
      window.removeEventListener('oldurl_wishlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopy = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleDelete = async (domain: string) => {
    await removeFromWishlist(domain);
    setItems(getLocalWishlist());
  };

  const handleSearchAgain = (domain: string) => {
    setPendingDomainsToScan([domain]);
    router.push('/dashboard/results');
  };

  const handleSearchAllWishlist = () => {
    const domainsToScan = items.map((i) => i.domain);
    if (domainsToScan.length > 0) {
      setPendingDomainsToScan(domainsToScan);
      router.push('/dashboard/results');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const clean = newDomain
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    if (!clean || !clean.includes('.')) {
      alert('Please enter a valid domain name (e.g. example.com)');
      return;
    }

    await toggleDomainWishlist({
      domain: clean,
      dr: 0,
      status: 'Available',
      daysLeft: 'Active',
      registrar: '—',
      notes: newNotes.trim() || 'Added to Wishlist',
    });

    setItems(getLocalWishlist());
    setNewDomain('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const exportList = filteredItems;
    if (exportList.length === 0) return;

    const rows = exportList.map((it, idx) => ({
      '#': idx + 1,
      Domain: it.domain,
      Status: it.status,
      DR: it.dr,
      'Days Left': it.daysLeft,
      Registrar: it.registrar,
      'Date Added': formatCheckDate(it.createdAt),
      Notes: it.notes || '',
    }));

    if (format === 'csv') {
      const headers = ['#', 'Domain', 'Status', 'DR', 'Days Left', 'Registrar', 'Date Added', 'Notes'];
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `OldUrl_Wishlist_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wishlist');
      XLSX.writeFile(wb, `OldUrl_Wishlist_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (statusFilter === 'Available' && it.status !== 'Available') return false;
      if (statusFilter === 'Registered' && it.status === 'Available') return false;
      if (searchQuery && !it.domain.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];

      if (sortField === 'dr') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
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
  }, [filteredItems, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const availableCount = items.filter((i) => i.status === 'Available').length;
  const registeredCount = items.length - availableCount;

  return (
    <div className="space-y-6">
      {/* -------------------- BREADCRUMB -------------------- */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          🏠 Home
        </Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Wishlist &amp; Favourites</span>
      </div>

      {/* -------------------- HEADER -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-[#FC6B17] fill-current" />
            Wishlist &amp; Favourites
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Keep track of high-value expired domains you like and audit them anytime with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {items.length > 0 && (
            <button
              onClick={handleSearchAllWishlist}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FC6B17]" /> Scan All Saved ({items.length})
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Domain
          </button>
        </div>
      </div>

      {/* -------------------- STATS CARDS -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Saved</div>
          <div className="text-xl sm:text-2xl font-black text-[#0d1b3e] mt-1">{items.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Available to Register</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{availableCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Registered / Taken</div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{registeredCount}</div>
        </div>
      </div>

      {/* -------------------- SEARCH & FILTER BAR -------------------- */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            {(['All', 'Available', 'Registered'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-[#FC6B17] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          {items.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto md:ml-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                title="Export to CSV"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved domains..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#FC6B17] focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* -------------------- WISHLIST TABLE -------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading your wishlist...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Your wishlist is empty</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Click the bookmark / star icon next to any domain in search results to save it here for quick access.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Domain
              </button>
            </div>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No wishlisted domains match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('domain')}
                    className="py-3 px-4 w-[30%] min-w-[200px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'domain' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Domain Name</span>
                      {sortField === 'domain' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 w-[15%] min-w-[130px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'status' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Availability</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('dr')}
                    className="py-3 px-3 w-[12%] min-w-[90px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'dr' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>DR (Ahrefs)</span>
                      {sortField === 'dr' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 w-[20%] min-w-[150px]">Registrar / Expiry</th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3 px-3 w-[15%] min-w-[120px] cursor-pointer select-none hover:bg-gray-200/50 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortField === 'createdAt' ? 'text-[#FC6B17] font-extrabold' : 'group-hover:text-gray-900'}>Saved Date</span>
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#FC6B17]" /> : <ArrowDown className="w-3 h-3 text-[#FC6B17]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 pr-4 w-[8%] min-w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id || item.domain} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="py-3.5 pl-4 pr-2 text-center text-gray-400 font-mono text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleDelete(item.domain)}
                          className="text-[#FC6B17] hover:opacity-75 transition-opacity"
                          title="Remove from Wishlist"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                        <div>
                          <div className="font-mono font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <span>{item.domain}</span>
                            <button
                              onClick={() => handleCopy(item.domain)}
                              className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy domain"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedDomain === item.domain && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                Copied!
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-gray-400 mt-0.5 max-w-xs truncate">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.status === 'Available' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Registered
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        item.dr >= 50
                          ? 'bg-orange-100 text-orange-900'
                          : item.dr >= 20
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.dr}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-gray-600">
                      <div>{item.registrar || '—'}</div>
                      <div className="text-[10px] text-gray-400">{item.daysLeft || 'Active'}</div>
                    </td>

                    <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                      {formatCheckDate(item.createdAt)}
                    </td>

                    <td className="py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSearchAgain(item.domain)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-[#fff0e8] hover:text-[#FC6B17] text-gray-700 rounded-lg font-bold text-[11px] transition-colors"
                          title="Audit this domain again"
                        >
                          Audit
                        </button>
                        {item.status === 'Available' ? (
                          <a
                            href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                          >
                            Buy <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null}
                        <button
                          onClick={() => handleDelete(item.domain)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                          title="Delete from Wishlist"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, sortedItems.length)}</strong> of{' '}
              <strong>{sortedItems.length}</strong> domains
            </div>
            <div className="flex items-center gap-1 font-bold">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {getPaginationRange(currentPage, totalPages).map((pg, i) => (
                <button
                  key={i}
                  onClick={() => typeof pg === 'number' && setCurrentPage(pg)}
                  disabled={typeof pg !== 'number'}
                  className={`min-w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    pg === currentPage
                      ? 'bg-[#FC6B17] text-white shadow-2xs'
                      : typeof pg === 'number'
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 cursor-default'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- ADD DOMAIN MODAL -------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
          >
            <h3 className="text-base font-bold text-[#0d1b3e] mb-1 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#FC6B17] fill-current" />
              Add Domain to Wishlist
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Bookmark domains here to monitor and revisit anytime.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Domain Name</label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. nichebrand.com"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-[#FC6B17]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Private Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Good backlinks, target for 301 redirect"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs"
              >
                Save to Wishlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
