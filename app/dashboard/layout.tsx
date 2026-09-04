'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  BarChart2,
  History,
  Activity,
  FileCheck2,
  Layers,
  User,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mainNav = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Domain Checker',
      href: '/dashboard/domain-checker',
      icon: Search,
      badge: null,
    },
    {
      name: 'Results',
      href: '/dashboard/results',
      icon: BarChart2,
      badge: 'Live',
    },
    {
      name: 'Previous Searches',
      href: '/dashboard/previous-searches',
      icon: History,
      badge: null,
    },
  ];

  const analyticsNav = [
    {
      name: 'Domain Analytics',
      href: '/dashboard/domain-analytics',
      icon: Activity,
      badge: null,
    },
    {
      name: 'Domain A. Result',
      href: '/dashboard/domain-analytics-result',
      icon: FileCheck2,
      badge: null,
    },
    {
      name: 'Domain A. Scanned',
      href: '/dashboard/domain-analytics-scanned',
      icon: Layers,
      badge: null,
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      badge: null,
    },
  ];

  const renderNavLink = (item: { name: string; href: string; icon: any; badge?: string | null }) => {
    const isActive =
      pathname === item.href ||
      (item.href === '/dashboard' && pathname === '/dashboard');
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
          isActive
            ? 'bg-[#fff0e8] text-[#FC6B17] font-bold shadow-2xs'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-[#FC6B17] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-[#FC6B17]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span>{item.name}</span>
        </div>

        {item.badge ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-100 text-emerald-800">
            {item.badge}
          </span>
        ) : isActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#FC6B17]" />
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] text-[#1e1e2d] flex font-sans antialiased">
      {/* -------------------- SIDEBAR (STANDARD NORMAL SIZE) -------------------- */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200/80 fixed top-0 bottom-0 z-40">
        {/* Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-black text-[#0d1b3e] tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-[#FC6B17] flex items-center justify-center text-white font-black text-sm shadow-xs">
              O
            </div>
            <div className="flex items-baseline">
              <span className="text-[#FC6B17]">Old</span>Url
              <span className="text-[11px] text-gray-400 font-medium font-mono ml-1">.domains</span>
            </div>
          </Link>
        </div>

        {/* Nav Items Container */}
        <div className="flex-1 py-5 px-3.5 space-y-5 overflow-y-auto">
          {/* Main Section */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Domain Audit
            </div>
            {mainNav.map(renderNavLink)}
          </div>

          {/* Analytics Section */}
          <div className="space-y-1 pt-3 border-t border-gray-100">
            <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Analytics &amp; Data
            </div>
            {analyticsNav.map(renderNavLink)}
          </div>
        </div>

        {/* Bottom Growth Plan Box */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-[#fff7f2] p-3.5 rounded-2xl border border-orange-100 text-center space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FC6B17] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Growth Plan
              </span>
              <span className="text-[11px] font-medium text-gray-400">50K/mo</span>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-800 text-left">14,390 / 50,000 checked</div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden mt-1 border border-orange-100">
                <div className="bg-[#FC6B17] h-full rounded-full w-[28.7%]" />
              </div>
            </div>

            <Link
              href="/dashboard/profile"
              className="block w-full py-1.5 px-3 border border-[#FC6B17] text-[#FC6B17] hover:bg-[#FC6B17] hover:text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              Manage Plan →
            </Link>
          </div>
        </div>
      </aside>

      {/* -------------------- MOBILE DRAWER -------------------- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white h-full flex flex-col z-10 shadow-2xl p-4">
            <div className="h-16 flex items-center justify-between px-2 border-b border-gray-100">
              <Link href="/" className="flex items-center gap-2 text-xl font-black text-[#0d1b3e]">
                <span className="text-[#FC6B17]">Old</span>Url
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 py-4 space-y-4 overflow-y-auto">
              <div className="space-y-1">{mainNav.map(renderNavLink)}</div>
              <div className="space-y-1 pt-2 border-t border-gray-100">{analyticsNav.map(renderNavLink)}</div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MAIN CONTENT WRAPPER -------------------- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200/70 px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WHOIS &amp; DR Cloud Engine Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <Link
              href="/dashboard/domain-checker"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Quick Check
            </Link>

            {/* User Initial Circle Avatar */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#a3381a] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                S
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-800 leading-tight">Sanjay K.</div>
                <div className="text-[11px] text-gray-400">Growth Plan</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
