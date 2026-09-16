'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Bookmark,
  Package,
  ArrowRightLeft,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';

interface AccountNavTabsProps {
  activeTab?: 'settings' | 'wishlist' | 'orders' | 'transfer' | 'support';
}

export default function AccountNavTabs({ activeTab }: AccountNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'settings',
      name: 'Account Settings',
      href: '/dashboard/profile',
      icon: User,
      activePattern: ['/dashboard/profile', '/dashboard/settings'],
    },
    {
      id: 'wishlist',
      name: 'Wishlist',
      href: '/dashboard/watchlist',
      icon: Bookmark,
      activePattern: ['/dashboard/watchlist'],
    },
    {
      id: 'orders',
      name: 'Orders',
      href: '/dashboard/orders',
      icon: Package,
      activePattern: ['/dashboard/orders'],
    },
    {
      id: 'transfer',
      name: 'Domain Transfer',
      href: '/dashboard/domain-transfer',
      icon: ArrowRightLeft,
      activePattern: ['/dashboard/domain-transfer'],
    },
    {
      id: 'support',
      name: 'Contact Support',
      href: 'mailto:support@oldurl.domains?subject=Domain%20Transfer%20%26%20Account%20Inquiry',
      icon: LifeBuoy,
      isExternal: true,
      activePattern: [],
    },
  ];

  const isTabActive = (tab: typeof tabs[0]) => {
    if (activeTab) return activeTab === tab.id;
    return tab.activePattern.some((p) => pathname.startsWith(p));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-black text-[#0d1b3e] tracking-tight">
          My Account
        </h1>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Verified Account Portal</span>
        </div>
      </div>

      {/* Tabs Navigation Row (Exact Domain Coasters UI Match) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap border-b border-gray-200/80 pb-3 pt-1">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const TabIcon = tab.icon;

          if (tab.isExternal) {
            return (
              <a
                key={tab.id}
                href={tab.href}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center gap-2 cursor-pointer select-none"
              >
                <TabIcon className="w-4 h-4 text-gray-400" />
                <span>{tab.name}</span>
              </a>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer select-none ${
                active
                  ? 'bg-[#5051F9] hover:bg-[#4344e6] text-white shadow-md shadow-indigo-500/20 scale-102'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/90'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
