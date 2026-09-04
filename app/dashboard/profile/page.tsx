'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import {
  User,
  CheckCircle2,
  Save,
  Bell,
  Sparkles,
} from 'lucide-react';

const getInitialProfileData = () => {
  if (typeof window !== 'undefined') {
    try {
      const cachedProfile = localStorage.getItem('oldurl_cached_profile');
      const parsedProfile = cachedProfile ? JSON.parse(cachedProfile) : null;

      let foundUser: any = null;
      const directCached = localStorage.getItem('oldurl_cached_user');
      if (directCached) {
        foundUser = JSON.parse(directCached);
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth-token') || key.includes('supabase.auth') || key.startsWith('sb-'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user) { foundUser = parsed.user; break; }
              if (parsed?.currentSession?.user) { foundUser = parsed.currentSession.user; break; }
              if (parsed?.session?.user) { foundUser = parsed.session.user; break; }
            }
          }
        }
      }

      if (foundUser) {
        const fn =
          parsedProfile?.full_name ||
          foundUser.user_metadata?.full_name ||
          foundUser.user_metadata?.name ||
          (foundUser.email ? foundUser.email.split('@')[0] : '');
        const em = foundUser.email || '';
        const accId = `USR-${foundUser.id ? foundUser.id.slice(0, 6).toUpperCase() : 'MEMBER'}`;
        let ms = '';
        if (foundUser.created_at) {
          const d = new Date(foundUser.created_at);
          ms = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return { user: foundUser, fullName: fn, email: em, accountId: accId, memberSince: ms };
      }
    } catch (e) {}
  }
  return { user: null, fullName: '', email: '', accountId: '', memberSince: '' };
};

export default function ProfilePage() {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<any>(() => getInitialProfileData().user);
  const [fullName, setFullName] = useState<string>(() => getInitialProfileData().fullName);
  const [email, setEmail] = useState<string>(() => getInitialProfileData().email);
  const [accountId, setAccountId] = useState<string>(() => getInitialProfileData().accountId);
  const [memberSince, setMemberSince] = useState<string>(() => getInitialProfileData().memberSince);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        try {
          localStorage.setItem('oldurl_cached_user', JSON.stringify(user));
        } catch (e) {}

        const userEmail = user.email || '';
        setEmail(userEmail);
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (userEmail ? userEmail.split('@')[0] : '');
        setFullName((prev) => prev || name);
        setAccountId(`USR-${user.id.slice(0, 6).toUpperCase()}`);
        if (user.created_at) {
          const d = new Date(user.created_at);
          setMemberSince(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }

        // Fetch custom profile row if present
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              try {
                localStorage.setItem('oldurl_cached_profile', JSON.stringify(data));
              } catch (e) {}
              if (data.full_name) {
                setFullName(data.full_name);
              }
            }
          });
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        // Update user metadata
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        // Upsert to profiles table
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName,
            email: user.email,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        try {
          if (updatedProfile) {
            localStorage.setItem('oldurl_cached_profile', JSON.stringify(updatedProfile));
          } else {
            localStorage.setItem(
              'oldurl_cached_profile',
              JSON.stringify({ id: user.id, full_name: fullName, email: user.email })
            );
          }
        } catch (e) {}
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">🏠 Home</Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Account Profile &amp; Plan</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1b3e]">Profile &amp; Subscription</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account credentials, notifications, and subscription quota.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account & Plan Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs text-center">
            <div className="w-20 h-20 rounded-full bg-[#a3381a] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
              {fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-4">{fullName || 'Account Member'}</h2>
            <p className="text-xs text-gray-500">{email}</p>
            <div className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
            </div>
            <div className="border-t border-gray-100 mt-6 pt-4 text-left space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Account ID:</span>
                <span className="font-mono font-bold text-gray-800">{accountId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since:</span>
                <span className="font-semibold text-gray-800">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Current Plan Quota */}
          <div className="bg-gradient-to-br from-[#0d1b3e] to-[#1a2c5a] text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 bg-[#FC6B17] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Growth Plan
              </div>
              <span className="text-xs font-semibold text-gray-300">Renews Oct 01</span>
            </div>

            <div>
              <div className="text-3xl font-black tracking-tight">$79<span className="text-sm font-normal text-gray-300">/mo</span></div>
              <p className="text-xs text-gray-300 mt-1">Unlimited bulk checks &amp; priority WHOIS crawling</p>
            </div>

            {/* Quota Progress 1 */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Bulk Domain Checks</span>
                <span className="font-bold text-white">14,390 / 50,000</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#FC6B17] rounded-full" style={{ width: '28.7%' }} />
              </div>
            </div>

            {/* Quota Progress 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Deep Analytics Runs</span>
                <span className="font-bold text-white">420 / 2,000</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '21%' }} />
              </div>
            </div>

            <button
              onClick={() => alert('Redirecting to Stripe Customer Portal...')}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs py-2.5 rounded-xl transition-colors text-center block"
            >
              Upgrade / Manage Billing
            </button>
          </div>
        </div>

        {/* Right Column: Settings & API */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FC6B17]" /> Personal Information
            </h3>

            {savedSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile details successfully updated!
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Timezone</label>
                <select className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600">
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>EST (Eastern Standard Time)</option>
                  <option>PST (Pacific Standard Time)</option>
                  <option>IST (Indian Standard Time)</option>
                  <option>GMT (London Time)</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#0d1b3e] hover:bg-[#1a2c5a] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" /> Notification Preferences
            </h3>
            <div className="space-y-3 text-xs text-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Email me when a bulk scan finishes processing</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Send alert if high-authority domain (DR &gt; 70) becomes available</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Weekly summary digest of scanned domain authority trends</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
