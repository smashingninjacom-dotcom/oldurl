'use client';

import React from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Download,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function BillingPage() {
  const invoices = [
    {
      id: 'INV-2026-08',
      date: 'Aug 01, 2026',
      amount: '$19.00',
      plan: 'Starter Plan (Monthly)',
      status: 'Paid',
    },
    {
      id: 'INV-2026-07',
      date: 'Jul 01, 2026',
      amount: '$19.00',
      plan: 'Starter Plan (Monthly)',
      status: 'Paid',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* -------------------- HEADER -------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your subscription tier, payment methods, and invoice receipts.
        </p>
      </div>

      {/* -------------------- CURRENT PLAN CARD -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#fff0e8] text-[#FC6B17] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#FC6B17]/30">
              Current Plan
            </span>
            <span className="text-xs font-bold text-gray-500">Renews on Oct 01, 2026</span>
          </div>

          <h2 className="text-2xl font-black text-[#0d1b3e]">Starter Plan</h2>
          <div className="text-sm font-semibold text-gray-600 mt-0.5">$19.00 / month</div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
            <div>
              <strong>3,420</strong> of 3,500 monthly lookups left
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Opening plan selector...')}
            className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Upgrade to Growth ($49/mo)
          </button>
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
            onClick={() => alert('Update card clicked')}
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
