'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Globe,
  CheckCircle2,
  Save,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('Jay Domain');
  const [email, setEmail] = useState('jay@example.com');
  const [defaultRegistrar, setDefaultRegistrar] = useState('namecheap');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [highDrAlerts, setHighDrAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* -------------------- HEADER -------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
          Account & Auditor Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Customize your default registrar for 1-click registration, notification preferences, and profile.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* -------------------- PROFILE CARD -------------------- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d1b3e] mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#FC6B17]" /> Profile Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#FC6B17]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#FC6B17]"
              />
            </div>
          </div>
        </div>

        {/* -------------------- REGISTRAR PREFERENCE -------------------- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d1b3e] mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FC6B17]" /> Preferred Domain Registrar
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            When clicking &quot;Register ↗&quot; on available domains, we will direct you to your preferred registrar.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { id: 'namecheap', name: 'Namecheap' },
              { id: 'godaddy', name: 'GoDaddy' },
              { id: 'dynadot', name: 'Dynadot' },
              { id: 'porkbun', name: 'Porkbun' },
            ].map((reg) => (
              <label
                key={reg.id}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer font-bold transition-all ${
                  defaultRegistrar === reg.id
                    ? 'border-[#FC6B17] bg-[#fff0e8] text-[#FC6B17]'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="registrar"
                  value={reg.id}
                  checked={defaultRegistrar === reg.id}
                  onChange={() => setDefaultRegistrar(reg.id)}
                  className="accent-[#FC6B17]"
                />
                <span>{reg.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* -------------------- NOTIFICATION PREFERENCES -------------------- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-[#0d1b3e] mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FC6B17]" /> Alert & Notification Settings
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <div>
                <div className="font-bold text-gray-800">Instant Drop Alerts</div>
                <div className="text-gray-500">Email me immediately when a watchlist domain becomes available</div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#FC6B17] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <div>
                <div className="font-bold text-gray-800">Weekly High-DR Digest</div>
                <div className="text-gray-500">Send top 50 dropped domains linked by Forbes/Wikipedia every Monday</div>
              </div>
              <input
                type="checkbox"
                checked={highDrAlerts}
                onChange={(e) => setHighDrAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#FC6B17] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings saved successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
