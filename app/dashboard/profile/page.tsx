'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Key,
  Shield,
  CreditCard,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Bell,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fullName, setFullName] = useState('Sanjay Kumar');
  const [email, setEmail] = useState('sanjay@authoritydomains.io');
  const apiKey = 'oldurl_live_sk_948f102a84e66b89012cd';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
          Manage your account credentials, current subscription quota, and developer API keys.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account & Plan Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs text-center">
            <div className="w-20 h-20 rounded-full bg-[#a3381a] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
              S
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-4">{fullName}</h2>
            <p className="text-xs text-gray-500">{email}</p>
            <div className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Member
            </div>
            <div className="border-t border-gray-100 mt-6 pt-4 text-left space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Account ID:</span>
                <span className="font-mono font-bold text-gray-800">USR-49021</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since:</span>
                <span className="font-semibold text-gray-800">July 2026</span>
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

          {/* API Keys */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" /> Developer API Key
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Integrate OldUrl bulk availability and backlink metrics into your automated crawling scripts or custom software.
            </p>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-gray-800 tracking-wider">
                {apiKey}
              </span>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Key
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Rate Limit: 120 requests / min</span>
              <button
                onClick={() => alert('A new API Key has been generated and activated.')}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Roll / Regenerate Secret Key
              </button>
            </div>
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
