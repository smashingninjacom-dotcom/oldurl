'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Link2,
  Copy,
  Check,
  CreditCard,
  X,
  FileText,
  Printer,
  Download,
  Award,
  RefreshCw,
  TrendingUp,
  Globe,
  Key,
  Info,
  CheckCheck,
  Zap,
} from 'lucide-react';
import {
  MarketplaceOrder,
  getMarketplaceOrders,
  deleteMarketplaceOrder,
} from '../../../lib/orders';
import { CartItem, getCart } from '../../../lib/cart';
import { supabase } from '../../../lib/supabaseClient';
import CartDrawer from '../../../components/CartDrawer';
import AuthModal from '../../../components/AuthModal';
import AccountNavTabs from '../../../components/AccountNavTabs';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Transfer in Progress'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'dr-desc'>('date-desc');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<MarketplaceOrder | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load orders & auth
  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCart());
    };
    syncCart();
    window.addEventListener('oldurl_cart_updated', syncCart);

    const loadOrders = (userEmail?: string) => {
      const data = getMarketplaceOrders(userEmail);
      setOrders(data);
    };

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
          loadOrders(data.session.user.email);
        } else {
          const cachedUser = localStorage.getItem('oldurl_cached_user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            setCurrentUser(parsed);
            loadOrders(parsed?.email);
          } else {
            loadOrders();
          }
        }
      } catch (e) {
        loadOrders();
      }
    };
    checkAuth();

    const handleOrdersUpdated = (e: any) => {
      if (e?.detail?.orders) {
        setOrders(e.detail.orders);
      } else {
        setOrders(getMarketplaceOrders());
      }
    };
    window.addEventListener('oldurl_orders_updated', handleOrdersUpdated);

    return () => {
      window.removeEventListener('oldurl_orders_updated', handleOrdersUpdated);
      window.removeEventListener('oldurl_cart_updated', syncCart);
    };
  }, []);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(keyId);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchDomain = order.domain.toLowerCase().includes(q);
          const matchId = order.id.toLowerCase().includes(q);
          const matchCategory = order.category?.toLowerCase().includes(q);
          if (!matchDomain && !matchId && !matchCategory) return false;
        }

        if (statusFilter !== 'All' && order.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        }
        if (sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (sortBy === 'dr-desc') {
          return b.dr - a.dr;
        }
        return 0;
      });
  }, [orders, searchQuery, statusFilter, sortBy]);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [orders]);

  const avgDr = useMemo(() => {
    if (orders.length === 0) return 0;
    return Math.round(orders.reduce((sum, item) => sum + item.dr, 0) / orders.length);
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Completed').length;
  }, [orders]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* My Account Navigation */}
      <AccountNavTabs activeTab="orders" />

      {/* -------------------- HEADER BANNER -------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1b3e] via-[#132857] to-[#1c356f] p-6 sm:p-8 text-white shadow-xl border border-[#233f82]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#FC6B17]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-orange-500/20 text-[#FC6B17] border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md">
                <Package className="w-3.5 h-3.5" />
                <span>MY ORDERS &amp; ACQUIRED DOMAINS</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Escrow Protected
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Domain Purchases &amp; Transfer Hub
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Track your acquired authority domains, retrieve instant EPP transfer codes, and download transaction receipts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#FC6B17]" />
              <span>Cart</span>
              {cartItems.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FC6B17] text-white font-black shadow-2xs">
                  {cartItems.length}
                </span>
              )}
            </button>

            <Link
              href="/dashboard/marketplace"
              className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* -------------------- STATS OVERVIEW CARDS -------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Domains</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FC6B17] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0d1b3e]">
            {orders.length} <span className="text-xs font-bold text-gray-400">assets</span>
          </div>
          <p className="text-[11px] text-gray-500">In your OldUrl vault</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            ${totalSpent.toLocaleString()} <span className="text-xs font-bold text-gray-400">USD</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">100% Escrow Verified</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Transfer Ready</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700">
            {completedCount} <span className="text-xs font-bold text-gray-400">EPP Dispatched</span>
          </div>
          <p className="text-[11px] text-blue-600 font-medium">Ready for registrar push</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Authority</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">
            DR {avgDr}
          </div>
          <p className="text-[11px] text-purple-600 font-medium">High SEO Link Equity</p>
        </div>
      </div>

      {/* -------------------- FILTER & SEARCH BAR -------------------- */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by domain name, order ID, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#FC6B17] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
            >
              <option value="All">All Transfer Statuses</option>
              <option value="Completed">Completed &amp; Ready</option>
              <option value="Transfer in Progress">Transfer in Progress</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
            >
              <option value="date-desc">Newest Order First</option>
              <option value="date-asc">Oldest Order First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="dr-desc">Authority: DR High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* -------------------- ORDERS TABLE -------------------- */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto shadow-xs">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#0d1b3e]">
              {searchQuery || statusFilter !== 'All' ? 'No orders match your filter' : 'No domain purchases yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Browse our curated marketplace to discover high-DR expired domains with verified editorial backlinks and instant Namebright transfer.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/marketplace"
              className="inline-flex items-center gap-2 bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-5">Order ID</th>
                  <th className="py-4 px-5">Domain</th>
                  <th className="py-4 px-4 text-center">Metrics</th>
                  <th className="py-4 px-4 text-center">Transfer Type</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Paid Amount</th>
                  <th className="py-4 px-5 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const purchaseFormatted = new Date(order.purchaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-4 px-5 align-middle">
                        <div className="font-mono font-bold text-gray-900">{order.id}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{purchaseFormatted}</div>
                      </td>

                      {/* Domain Name */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-[#0d1b3e] text-sm sm:text-base">
                            {order.domain}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.domain, `domain-${order.id}`)}
                            className="p-1 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded transition-colors cursor-pointer"
                            title="Copy domain name"
                          >
                            {copiedText === `domain-${order.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://web.archive.org/web/*/${order.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Wayback History"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* SEO Metrics */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex items-center gap-1.5 font-bold">
                          <span className="bg-orange-50 text-[#FC6B17] px-2 py-0.5 rounded border border-orange-200 text-[11px]">
                            DR {order.dr}
                          </span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            DA {order.da}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {order.referringDomains.toLocaleString()} RD
                        </div>
                      </td>

                      {/* Transfer Type */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                          <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                          <span>Namebright Push</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">3–5 min delivery</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center align-middle">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{order.status || 'Completed'}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5 text-right align-middle">
                        <div className="font-black text-[#0d1b3e] text-sm">
                          ${order.price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">100% Escrow</div>
                      </td>

                      {/* Invoice & Actions */}
                      <td className="py-4 px-5 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-white bg-gray-100 hover:bg-[#FC6B17] rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="View & print invoice receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- INVOICE & RECEIPT MODAL -------------------- */}
      {selectedOrderForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedOrderForReceipt(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content for Display & Print */}
            <div id="printable-order-receipt" className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-xl font-black text-[#0d1b3e]">
                  <div className="w-7 h-7 rounded-lg bg-[#FC6B17] text-white flex items-center justify-center text-xs font-black">
                    O
                  </div>
                  <span>
                    <span className="text-[#FC6B17]">Old</span>Url<span className="text-xs font-mono text-gray-400 font-normal ml-1">.domains</span>
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-900">RECEIPT &amp; INVOICE</div>
                  <div className="text-[11px] font-mono text-gray-400">
                    INV-{selectedOrderForReceipt.id}
                  </div>
                </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Date of Purchase</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {new Date(selectedOrderForReceipt.purchaseDate).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Billed Account</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {selectedOrderForReceipt.userEmail || currentUser?.email || 'Verified Buyer'}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-gray-50 px-4 py-2.5 font-bold text-gray-700 grid grid-cols-12 border-b border-gray-200">
                  <div className="col-span-8">Description</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-8">
                      <div className="font-extrabold text-[#0d1b3e] font-mono text-sm">
                        {selectedOrderForReceipt.domain}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Aged Authority Domain • DR {selectedOrderForReceipt.dr} • {selectedOrderForReceipt.referringDomains.toLocaleString()} Referring Domains
                      </div>
                    </div>
                    <div className="col-span-4 text-right font-bold text-gray-900">
                      ${selectedOrderForReceipt.price.toLocaleString()} USD
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center text-gray-500 text-[11px] pt-2 border-t border-gray-100">
                    <div className="col-span-8">Escrow Protection &amp; Auth-Code Dispatch</div>
                    <div className="col-span-4 text-right font-semibold text-emerald-600">INCLUDED</div>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-4 border-t border-gray-200 flex justify-between items-center text-sm font-black text-[#0d1b3e]">
                  <span>Total Paid</span>
                  <span className="text-lg text-[#FC6B17]">
                    ${selectedOrderForReceipt.price.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Transfer Details Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-xs">
                <div className="font-bold text-gray-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#FC6B17] fill-[#FC6B17]" />
                    <span>Delivery Method: Namebright Account Push</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Dispatched (3–5 min)
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium space-y-1">
                  <div>Direct push to buyer&apos;s registered Namebright username with $0 transfer fee.</div>
                  <div className="text-[11px] text-gray-400">
                    Guaranteed clean ownership &amp; 100% verified backlink integrity.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForReceipt(null)}
                className="flex-1 bg-[#0d1b3e] hover:bg-[#182f66] text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckoutSuccess={() => {
          setOrders(getMarketplaceOrders(currentUser?.email));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
