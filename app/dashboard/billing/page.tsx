'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Download,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  PLANS,
  PlanId,
  getUserQuotaData,
  switchUserPlan,
} from '../../../lib/plans';

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [profileData, setProfileData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('oldurl_cached_profile');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  });
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfileData(data);
              try {
                localStorage.setItem('oldurl_cached_profile', JSON.stringify(data));
              } catch (e) {}
            }
          });
      }
    });

    const handleQuotaUpdated = (e: any) => {
      if (e?.detail) {
        setProfileData((prev: any) => ({ ...(prev || {}), ...e.detail }));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('oldurl_quota_updated', handleQuotaUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('oldurl_quota_updated', handleQuotaUpdated);
      }
    };
  }, []);

  const quota = getUserQuotaData(profileData);

  const handlePlanSelect = async (planId: PlanId) => {
    if (planId === quota.planId) return;
    setUpgradingPlanId(planId);
    try {
      const updated = await switchUserPlan(planId);
      setProfileData(updated);
      setSuccessMsg(`Successfully activated ${updated.planName}! Your credits have been updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const invoices = [
    {
      id: 'INV-2026-09',
      date: 'Sep 01, 2026',
      amount: `$${quota.plan.monthlyPrice}.00`,
      plan: `${quota.planName} (Monthly)`,
      status: 'Paid',
    },
  ];

  const planKeys: PlanId[] = ['free', 'starter', 'growth', 'agency'];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* -------------------- HEADER -------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
          Billing &amp; Subscription Plans
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your subscription tier, credit limits, and billing details.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* -------------------- CURRENT PLAN CARD -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#fff0e8] text-[#FC6B17] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FC6B17]/30">
              Active Plan
            </span>
            <span className="text-xs font-bold text-gray-500">Renews Next Month</span>
          </div>

          <h2 className="text-2xl font-black text-[#0d1b3e]">{quota.planName}</h2>
          <div className="text-sm font-semibold text-gray-600 mt-0.5">
            ${quota.plan.monthlyPrice}.00 / month
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-gray-500">Domain Lookups: </span>
              <strong className="text-gray-900">
                {quota.lookupsRemaining.toLocaleString()}
              </strong>{' '}
              of {quota.lookupsLimit.toLocaleString()} left
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-gray-500">Deep Analytics: </span>
              <strong className="text-gray-900">
                {quota.analyticsRemaining.toLocaleString()}
              </strong>{' '}
              of {quota.analyticsLimit.toLocaleString()} left
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {quota.planId !== 'growth' && (
            <button
              onClick={() => handlePlanSelect('growth')}
              disabled={upgradingPlanId !== null}
              className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Switch to Growth ($49/mo)
            </button>
          )}
        </div>
      </div>

      {/* -------------------- AVAILABLE PLANS GRID -------------------- */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0d1b3e]">Choose or Switch Your Plan</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Instant activation with real-time credit quota allocation.
            </p>
          </div>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-2 bg-gray-100 p-1 rounded-full text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                billingCycle === 'annual' ? 'bg-[#FC6B17] text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {planKeys.map((key) => {
            const p = PLANS[key];
            const isCurrent = quota.planId === key;
            const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'border-[#FC6B17] ring-2 ring-[#FC6B17]/20 shadow-md'
                    : p.badge
                    ? 'border-[#FC6B17]/60 shadow-sm'
                    : 'border-gray-200'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FC6B17] text-white text-[9px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    {p.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0d1b3e]">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-3">{p.description}</p>

                  <div className="text-2xl font-black text-[#0d1b3e] mb-4">
                    ${price}
                    <span className="text-xs text-gray-500 font-normal">/mo</span>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-700 mb-6">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-tight">
                        <Check className="w-3.5 h-3.5 text-[#FC6B17] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || upgradingPlanId !== null}
                  onClick={() => handlePlanSelect(p.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : p.badge
                      ? 'bg-[#FC6B17] hover:bg-[#e05b10] text-white shadow-xs'
                      : 'border-2 border-[#FC6B17] text-[#FC6B17] hover:bg-[#FC6B17] hover:text-white'
                  }`}
                >
                  {upgradingPlanId === p.id ? (
                    'Activating...'
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      Activate {p.name.split(' ')[0]} <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------- PAYMENT METHOD -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-3">Saved Payment Method</h3>
        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-[10px]">
              VISA
            </div>
            <div>
              <div className="text-xs font-bold text-gray-800">Visa ending in 4242</div>
              <div className="text-[10px] text-gray-400">Expires 08/2028</div>
            </div>
          </div>

          <button
            onClick={() => alert('Card settings updated.')}
            className="text-xs font-bold text-[#FC6B17] hover:underline"
          >
            Update Card
          </button>
        </div>
      </div>

      {/* -------------------- INVOICE HISTORY -------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-[#0d1b3e]">Invoice Receipts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pr-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{inv.id}</td>
                  <td className="py-3.5 px-3 text-gray-500">{inv.date}</td>
                  <td className="py-3.5 px-3 text-gray-700">{inv.plan}</td>
                  <td className="py-3.5 px-3 font-bold text-gray-900">{inv.amount}</td>
                  <td className="py-3.5 px-3">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Paid
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <button
                      onClick={() => alert(`Downloading PDF for ${inv.id}`)}
                      className="text-gray-500 hover:text-[#FC6B17] text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
