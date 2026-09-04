'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase, signInWithGoogle, signInWithGoogleIdToken, GOOGLE_CLIENT_ID } from '../../lib/supabaseClient';
import AuthModal from '../../components/AuthModal';
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
  LogOut,
  ChevronDown,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { getUserQuotaData } from '../../lib/plans';
import { resetMemoryCacheForUser } from '../../lib/searchHistory';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const directCached = localStorage.getItem('oldurl_cached_user');
        if (directCached) {
          const parsed = JSON.parse(directCached);
          if (parsed) return parsed;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth-token') || key.includes('supabase.auth') || key.startsWith('sb-'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user) return parsed.user;
              if (parsed?.currentSession?.user) return parsed.currentSession.user;
              if (parsed?.session?.user) return parsed.session.user;
            }
          }
        }
      } catch (e) {}
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('oldurl_cached_profile');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('oldurl_cached_user')) return false;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('auth-token') || key.includes('supabase.auth') || key.startsWith('sb-'))) {
            return false;
          }
        }
      } catch (e) {}
    }
    return false;
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

          // Check if OAuth provider returned error
          const err = urlParams.get('error_description') || urlParams.get('error') || hashParams.get('error_description');
          if (err) {
            setAuthError(decodeURIComponent(err));
          }

          // Exchange authorization code
          const code = urlParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session?.user) {
              if (isMounted) {
                setUser(data.session.user);
                try {
                  localStorage.setItem('oldurl_cached_user', JSON.stringify(data.session.user));
                } catch (e) {}
                fetchProfile(data.session.user.id);
                setIsAuthChecking(false);
              }
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            setUser(session.user);
            try {
              localStorage.setItem('oldurl_cached_user', JSON.stringify(session.user));
            } catch (e) {}
            fetchProfile(session.user.id);
          }
          setIsAuthChecking(false);
        }
      } catch (e) {
        console.warn('Auth init note:', e);
        if (isMounted) setIsAuthChecking(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          try {
            localStorage.setItem('oldurl_cached_user', JSON.stringify(newUser));
          } catch (e) {}
          resetMemoryCacheForUser(newUser.id);
          fetchProfile(newUser.id);
          setAuthError(null);
        } else {
          try {
            localStorage.removeItem('oldurl_cached_user');
            localStorage.removeItem('oldurl_cached_profile');
          } catch (e) {}
          resetMemoryCacheForUser('guest');
          setUserProfile(null);
        }
        setIsAuthChecking(false);
      }
    });

    const handleQuotaUpdated = (e: any) => {
      if (e?.detail) {
        setUserProfile((prev: any) => ({ ...(prev || {}), ...e.detail }));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('oldurl_quota_updated', handleQuotaUpdated);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('oldurl_quota_updated', handleQuotaUpdated);
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        let cachedUsed = 0;
        try {
          const raw = localStorage.getItem(`oldurl_cached_profile_${userId}`) || localStorage.getItem('oldurl_cached_profile');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.id === userId) {
              cachedUsed = parsed.quota_used || 0;
            }
          }
          const rawStats = localStorage.getItem(`oldurl_stats_${userId}`);
          if (rawStats) {
            const stats = JSON.parse(rawStats);
            cachedUsed = Math.max(cachedUsed, stats?.totalChecked || 0);
          }
        } catch (e) {}

        const finalUsed = Math.max(Number(data.quota_used) || 0, cachedUsed);
        data.quota_used = finalUsed;

        if (finalUsed > (Number(data.quota_used) || 0)) {
          supabase.from('profiles').update({ quota_used: finalUsed }).eq('id', userId).then(() => {});
        }

        setUserProfile(data);
        try {
          localStorage.setItem(`oldurl_cached_profile_${userId}`, JSON.stringify(data));
          localStorage.setItem('oldurl_cached_profile', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (e) {}
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('oldurl_cached_user');
      localStorage.removeItem('oldurl_cached_profile');
    } catch (e) {}
    resetMemoryCacheForUser('guest');
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setIsGuestMode(false);
    setIsProfileDropdownOpen(false);
    window.location.href = '/';
  };

  const quota = getUserQuotaData(userProfile);
  const displayName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : isGuestMode ? 'Guest Member' : 'Member');
  const displayEmail = user?.email || (isGuestMode ? 'guest@oldurl.domains' : '');
  const planName = quota.planName || (isGuestMode ? 'Guest Preview' : 'Free Plan');
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'M';
  const avatarUrl =
    userProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture ||
    null;

  // Prevent flash of login screen while validating session
  if (isAuthChecking && !user) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-400">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <div className="min-h-screen bg-[#faf9f8] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0d1b3e] tracking-tight">
              Sign in to Access Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Sign in with your Google account to access your domain audits, search history, and live metrics.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left">
              <strong>Authentication Note:</strong> {authError}
            </div>
          )}

          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full py-3.5 px-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </button>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <Link
              href="/"
              className="font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Homepage
            </Link>
            <button
              type="button"
              onClick={() => setIsGuestMode(true)}
              className="text-[#FC6B17] font-bold hover:underline"
            >
              Explore as Guest →
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        prefetch={true}
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

        {/* Bottom Plan Box */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-[#fff7f2] p-3.5 rounded-2xl border border-orange-100 text-center space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FC6B17] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> {quota.planName}
              </span>
              <span className="text-[11px] font-medium text-gray-400">
                {quota.lookupsLimit >= 1000 ? `${(quota.lookupsLimit / 1000).toFixed(quota.lookupsLimit % 1000 === 0 ? 0 : 1)}K/mo` : `${quota.lookupsLimit}/mo`}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-800 text-left">
                {quota.lookupsUsed.toLocaleString()} / {quota.lookupsLimit.toLocaleString()} checked
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden mt-1 border border-orange-100">
                <div
                  className="bg-[#FC6B17] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, quota.lookupsPercent)}%` }}
                />
              </div>
            </div>

            <Link
              href="/dashboard/billing"
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
          </div>

          <div className="flex items-center gap-3.5 relative">
            <Link
              href="/dashboard/domain-checker"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#FC6B17] hover:bg-[#e05607] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Quick Check
            </Link>

            {/* User Session Avatar & Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#a3381a] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden border border-orange-200/50">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-gray-800 leading-tight flex items-center gap-1">
                      {displayName}
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="text-[11px] text-gray-400">{planName}</div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2.5">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#a3381a] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{displayName}</div>
                        <div className="text-[11px] text-gray-400 truncate">{displayEmail}</div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#FC6B17] rounded-xl transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> Profile &amp; Billing
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (e) {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-[#0d1b3e] hover:bg-[#1a2c5a] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In with Google
              </button>
            )}
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
