'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  CheckCircle2,
  Save,
  ExternalLink,
  ShieldCheck,
  Globe,
  Info,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  Lock,
} from 'lucide-react';
import AccountNavTabs from '../../../components/AccountNavTabs';
import {
  DomainTransferDetails,
  getDomainTransferDetails,
  saveDomainTransferDetails,
  getDefaultTransferDetails,
} from '../../../lib/transferDetails';
import { supabase } from '../../../lib/supabaseClient';

export default function DomainTransferPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState<DomainTransferDetails>(getDefaultTransferDetails());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'namebright' | 'gname' | 'all'>('all');

  useEffect(() => {
    const initData = async () => {
      let userIdent = '';
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
          userIdent = data.session.user.id || data.session.user.email || '';
        } else {
          const cached = localStorage.getItem('oldurl_cached_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            setCurrentUser(parsed);
            userIdent = parsed.id || parsed.email || '';
          }
        }
      } catch (e) {}

      const saved = getDomainTransferDetails(userIdent);
      setFormData(saved);
    };

    initData();
  }, []);

  const handleChange = (field: keyof DomainTransferDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const userIdent = currentUser?.id || currentUser?.email || '';
      saveDomainTransferDetails(formData, userIdent);

      // Also persist to supabase user profile / metadata if authenticated
      if (currentUser?.id) {
        try {
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            transfer_details: formData,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('DB profile transfer sync note:', dbErr);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error saving transfer details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <span>›</span>
        <Link href="/dashboard/profile" className="hover:text-gray-900 transition-colors">
          My Account
        </Link>
        <span>›</span>
        <span className="text-[#5051F9] font-bold">Domain Transfer</span>
      </div>

      {/* Domain Coasters Signature "My Account" Navigation Bar */}
      <AccountNavTabs activeTab="transfer" />

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 animate-in fade-in zoom-in-95 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Transfer Details Saved Successfully!</div>
              <div className="text-xs text-emerald-600">
                Your registrar push credentials will be automatically applied to your domain purchases.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Informational Hero Card */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-orange-50/40 p-5 rounded-2xl border border-indigo-100/80 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#5051F9] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Zap className="w-5 h-5" />
        </div>
        <div className="text-xs text-gray-700 space-y-1">
          <div className="font-bold text-sm text-[#0d1b3e]">
            Instant Automated Registrar Push Transfer
          </div>
          <p className="text-gray-600 leading-relaxed">
            Provide your registrar account details below for instant, zero-downtime domain transfers. When you purchase a domain on the OldURL marketplace, our automated system will push the domain directly into your account in 3–5 minutes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs">
        {/* NAMEBRIGHT SECTION (PRIMARY FOCUS) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Namebright</h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>Transfer time: 3–5 minutes</span>
            </span>
          </div>

          <p className="text-xs text-gray-600">
            If you don&apos;t have a Namebright account, you can sign up{' '}
            <a
              href="https://www.namebright.com/NewAccount"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5051F9] hover:underline font-bold inline-flex items-center gap-0.5"
            >
              <span>here</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Your Namebright username
              </label>
              <input
                type="text"
                required
                value={formData.namebrightUsername}
                onChange={(e) => handleChange('namebrightUsername', e.target.value)}
                placeholder="e.g. kuldeepmax"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:border-[#5051F9] focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Your Namebright account email
              </label>
              <input
                type="email"
                required
                value={formData.namebrightEmail}
                onChange={(e) => handleChange('namebrightEmail', e.target.value)}
                placeholder="e.g. mailmekuldeep16@gmail.com"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:border-[#5051F9] focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300 shadow-2xs"
              />
              <p className="text-[11px] text-gray-400">
                The email you use to sign in to Namebright.
              </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3.5 rounded-xl bg-[#5051F9] hover:bg-[#4344e6] text-white font-extrabold text-sm shadow-md shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Details</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Instant 1-Click Namebright Account Push</span>
          </div>
        </div>
      </form>
    </div>
  );
}
