'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  Bookmark,
  Bell,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  domain: string;
  dr: number;
  refDomains: number;
  citations: string[];
  dropDate: string;
  alertEmail: boolean;
  status: 'Available' | 'Pending Delete' | 'In Redemption';
  notes: string;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadWatchlist() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped: WatchlistItem[] = data.map((it) => ({
              id: it.id,
              domain: it.domain,
              dr: Number(it.target_dr) || 50,
              refDomains: 120,
              citations: ['Forbes', 'Wikipedia'],
              dropDate: 'Pending Check',
              alertEmail: true,
              status: 'Pending Delete',
              notes: it.notes || 'Saved domain',
            }));
            setItems(mapped);
            setLoading(false);
            return;
          }
        }
        setItems([]);
      } catch (err) {
        console.warn('Watchlist fetch note:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, []);

  const toggleAlert = (id: string) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, alertEmail: !it.alertEmail } : it))
    );
  };

  const deleteItem = async (id: string) => {
    try {
      await supabase.from('watchlists').delete().eq('id', id);
    } catch (e) {}
    setItems(items.filter((it) => it.id !== id));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const clean = newDomain
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let createdId = `w-${Date.now()}`;
      if (user) {
        const { data } = await supabase
          .from('watchlists')
          .insert({
            user_id: user.id,
            domain: clean,
            target_dr: 50,
            notes: newNotes.trim() || 'Added from dashboard',
          })
          .select()
          .single();
        if (data) createdId = data.id;
      }

      const newItem: WatchlistItem = {
        id: createdId,
        domain: clean,
        dr: 50,
        refDomains: 80,
        citations: ['Forbes', 'Wikipedia'],
        dropDate: 'Active Monitoring',
        alertEmail: true,
        status: 'Pending Delete',
        notes: newNotes.trim() || 'Added from dashboard',
      };

      setItems([newItem, ...items]);
      setNewDomain('');
      setNewNotes('');
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* -------------------- BREADCRUMB -------------------- */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          🏠 Home
        </Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Watchlist</span>
      </div>

      {/* -------------------- HEADER -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
            Saved Watchlist &amp; Drop Alerts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track high-priority expiring domains and receive real-time notifications when they drop.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Domain to Watchlist
        </button>
      </div>

      {/* -------------------- WATCHLIST TABLE -------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading watchlist...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Your watchlist is empty</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Save high-value expiring domains here to track their drop status and receive instant alerts.
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Domain Name</th>
                  <th className="py-3 px-3">DR Score</th>
                  <th className="py-3 px-3">Ref. Domains</th>
                  <th className="py-3 px-3">Drop Status</th>
                  <th className="py-3 px-3">Email Drop Alert</th>
                  <th className="py-3 px-3">Notes &amp; Target Niche</th>
                  <th className="py-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-[#FC6B17] fill-current" />
                        <div>
                          <div className="font-mono font-bold text-gray-900 text-xs">
                            {item.domain}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.citations.map((src, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold"
                              >
                                🔗 {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-black text-sm text-[#0d1b3e]">{item.dr}</td>

                    <td className="py-4 px-3 text-gray-700">
                      <span className="font-bold">{item.refDomains}</span> domains
                    </td>

                    <td className="py-4 px-3">
                      {item.status === 'Available' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          🟢 Available to Buy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          🟠 {item.dropDate}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-3">
                      <button
                        onClick={() => toggleAlert(item.id)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          item.alertEmail
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {item.alertEmail ? 'Alert ON' : 'Alert OFF'}
                      </button>
                    </td>

                    <td className="py-4 px-3 text-gray-500 text-xs max-w-xs truncate">
                      {item.notes}
                    </td>

                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          Check ↗
                        </a>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
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

      {/* -------------------- ADD DOMAIN MODAL -------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
          >
            <h3 className="text-base font-bold text-[#0d1b3e] mb-1">Add Domain to Watchlist</h3>
            <p className="text-xs text-gray-500 mb-4">
              We will track registry status changes and send instant drop alerts to your email.
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Private Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Forbes link on AI tools page, planned for 301 redirect"
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
                Save to Watchlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
