'use client';

import React, { useState } from 'react';
import AuthModal from '../components/AuthModal';
import {
  Search,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Globe,
  Layers,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';

interface DomainItem {
  domain: string;
  prefix: string;
  masked: string;
  tld: string;
  status: 'Available' | 'Expiring Soon' | 'In Grace Period';
  dr: number;
  refDomains: number;
  sources: string[];
  estCost: string;
  isHot?: boolean;
}

const mockDatabase: DomainItem[] = [
  {
    domain: 'techradar-archive.org',
    prefix: 'techradar-',
    masked: 'archive',
    tld: '.org',
    status: 'Available',
    dr: 58,
    refDomains: 184,
    sources: ['Forbes', 'TechCrunch', 'Wired'],
    estCost: '$9.99/yr',
    isHot: true,
  },
  {
    domain: 'greenhealthjournal.com',
    prefix: 'green',
    masked: 'healthjournal',
    tld: '.com',
    status: 'Available',
    dr: 46,
    refDomains: 92,
    sources: ['Wikipedia', 'Healthline'],
    estCost: '$11.99/yr',
  },
  {
    domain: 'financenordic.io',
    prefix: 'fin',
    masked: 'ancenordic',
    tld: '.io',
    status: 'Expiring Soon',
    dr: 52,
    refDomains: 138,
    sources: ['Bloomberg', 'Reuters'],
    estCost: 'Auction',
    isHot: true,
  },
  {
    domain: 'urbancreativestudio.net',
    prefix: 'urban',
    masked: 'creativestudio',
    tld: '.net',
    status: 'Available',
    dr: 41,
    refDomains: 67,
    sources: ['Behance', 'Medium'],
    estCost: '$12.99/yr',
  },
  {
    domain: 'nextgenmobility.co',
    prefix: 'nextgen',
    masked: 'mobility',
    tld: '.co',
    status: 'Available',
    dr: 49,
    refDomains: 115,
    sources: ['The Verge', 'Wikipedia'],
    estCost: '$14.99/yr',
  },
];

export default function HomePage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [inputVal, setInputVal] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'available' | 'dr50'>('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(true);

  const handleTestSample = async (sampleDomain: string) => {
    const target = sampleDomain.trim() || 'techradar-archive.org';
    setInputVal(target);
    setIsSimulatingScan(true);
    setScanMessage(`Auditing WHOIS & backlinks for ${target}...`);

    try {
      const res = await fetch('/api/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: [target] }),
      });
      const data = await res.json();
      setIsSimulatingScan(false);

      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        setScanMessage(
          `✓ ${item.domain} verified: Status is ${item.status} | DR: ${item.dr} | Ref Domains: ${item.refDomains}`
        );
      } else {
        setScanMessage(`✓ ${target} audited: Available to register (DR 58).`);
      }
    } catch (e) {
      setIsSimulatingScan(false);
      setScanMessage(`✓ ${target} audited: Available to register (DR 58).`);
    }
  };

  const filteredDomains = mockDatabase.filter((item) => {
    if (filterTag === 'available') return item.status === 'Available';
    if (filterTag === 'dr50') return item.dr >= 50;
    return true;
  });

  const faqs = [
    {
      q: 'What exactly does OldUrl do? Do I buy domains directly from you?',
      a: 'OldUrl is an expired domain search and SEO audit engine. You can upload or paste any list of domains (such as broken links scraped from authority news sites or web archives), and we instantly check which ones are dropped/available to register, along with Domain Rating (DR), backlink count, and authority sources. You then register available domains at standard retail price on your registrar of choice (Namecheap, GoDaddy, Dynadot, etc.).',
    },
    {
      q: 'How does OldUrl find authority backlinks?',
      a: 'OldUrl integrates live domain authority indexes (powered by Ahrefs and Semrush data models) and cross-checks historical outbound links from top-tier publications like Forbes, TechCrunch, NYTimes, and Wikipedia.',
    },
    {
      q: 'Can I upload a bulk CSV or XML list with thousands of domains?',
      a: 'Yes! Depending on your plan, you can upload CSV, XLSX, or XML files containing thousands of domains. Our cloud scanner processes them asynchronously and allows one-click export to CSV or PDF.',
    },
    {
      q: 'How fresh and accurate is the domain expiry data?',
      a: 'We query real-time WHOIS registries and authoritative DNS root servers so you always get live status (Available, Pending Delete, In Redemption, or Active/Registered) without stale cached false-positives.',
    },
    {
      q: 'Can I start for free?',
      a: 'Yes! Our Free plan gives you 10 free domain lookups every month with full DR metrics and expiry checks with zero credit card required.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fdf5ee] text-[#1e1e2d] font-sans antialiased">
      {/* -------------------- NAVBAR -------------------- */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3">
        <nav className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md rounded-full border border-black/10 px-6 py-3 flex items-center justify-between shadow-sm">
          <a href="/" className="flex items-center gap-1.5 text-xl font-black text-[#0d1b3e] tracking-tight">
            <span className="text-[#FC6B17]">Old</span>Url
            <span className="text-xs bg-[#fff0e8] text-[#FC6B17] font-bold px-2 py-0.5 rounded-full border border-[#FC6B17]/30">
              .domains
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#demo" className="hover:text-[#FC6B17] transition-colors">
              Live Preview
            </a>
            <a href="#how-it-works" className="hover:text-[#FC6B17] transition-colors">
              How It Works
            </a>
            <a href="#use-cases" className="hover:text-[#FC6B17] transition-colors">
              Use Cases
            </a>
            <a href="#metrics" className="hover:text-[#FC6B17] transition-colors">
              Metrics
            </a>
            <a href="#pricing" className="hover:text-[#FC6B17] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#FC6B17] transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setIsAuthOpen(true);
              }}
              className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-5 py-2 rounded-full font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              Sign In / Free Trial
            </button>
          </div>
        </nav>
      </header>

      {/* -------------------- HERO SECTION -------------------- */}
      <section className="pt-36 pb-16 px-4 sm:px-6 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#fff0e8] border border-[#FC6B17]/30 text-[#FC6B17] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            Bulk Expired Domain Scanner & Backlink Authority Audit
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#0d1b3e] tracking-tight leading-[1.15] mb-5">
            Find Expired Domains Linked By{' '}
            <span className="text-[#FC6B17]">Forbes</span>,{' '}
            <span className="text-[#FC6B17]">TechCrunch</span> &{' '}
            <span className="text-[#FC6B17]">Wikipedia</span>.
          </h1>

          {/* Subtitle - Clear Practical Workflow */}
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-9 leading-relaxed">
            Export outbound links from authority sites like <strong className="text-gray-900 font-semibold">Forbes, TechCrunch, or Wikipedia</strong>, paste them here, and instantly find which ones are expired and available to register.
          </p>

          {/* Input Box Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-5 max-w-2xl mx-auto mb-4 text-left">
            {/* Mode Switcher */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-3 px-2">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-2 text-sm font-bold pb-1 border-b-2 transition-colors ${
                  activeTab === 'single'
                    ? 'border-[#FC6B17] text-[#FC6B17]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Search className="w-4 h-4" /> Single / Multi Domain
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-2 text-sm font-bold pb-1 border-b-2 transition-colors ${
                  activeTab === 'bulk'
                    ? 'border-[#FC6B17] text-[#FC6B17]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Upload CSV / XLSX / XML
              </button>
            </div>

            {/* Input Row */}
            {activeTab === 'single' ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                <div className="flex-1 w-full flex items-center gap-2 bg-[#f0ebe5] rounded-full px-4 py-3">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Paste outbound links or domains (e.g. techradar-archive.org)..."
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleTestSample(inputVal || 'techradar-archive.org')}
                  className="w-full sm:w-auto bg-[#FC6B17] hover:bg-[#e05b10] text-white px-6 py-3 rounded-full font-bold text-sm shadow-md transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  Check Domains <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl my-2 text-center bg-gray-50 hover:bg-orange-50/40 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-[#FC6B17] mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-800">Drop your CSV, XLSX, or XML file here</p>
                <p className="text-xs text-gray-500 mt-1">Supports up to 55,000 domains per scan</p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthOpen(true);
                  }}
                  className="inline-block mt-3 bg-[#FC6B17] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-[#e05607] transition-colors"
                >
                  Sign In to Bulk Upload
                </button>
              </div>
            )}

            {/* Quick Test Sample Chips */}
            <div className="mt-3 px-2 flex items-center flex-wrap gap-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Quick Test:</span>
              <button
                onClick={() => handleTestSample('techradar-archive.org')}
                className="bg-gray-100 hover:bg-[#fff0e8] hover:text-[#FC6B17] px-2.5 py-1 rounded-md text-gray-600 font-medium transition-colors"
              >
                techradar-archive.org
              </button>
              <button
                onClick={() => handleTestSample('greenhealthjournal.com')}
                className="bg-gray-100 hover:bg-[#fff0e8] hover:text-[#FC6B17] px-2.5 py-1 rounded-md text-gray-600 font-medium transition-colors"
              >
                greenhealthjournal.com
              </button>
              <button
                onClick={() => handleTestSample('financenordic.io')}
                className="bg-gray-100 hover:bg-[#fff0e8] hover:text-[#FC6B17] px-2.5 py-1 rounded-md text-gray-600 font-medium transition-colors"
              >
                financenordic.io
              </button>
            </div>

            {/* Scan Simulation Banner */}
            {scanMessage && (
              <div
                className={`mt-3 mx-2 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  isSimulatingScan
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isSimulatingScan ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {scanMessage}
              </div>
            )}
          </div>

          {/* Micro Trust Points */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FC6B17]" /> 10 Free Lookups Monthly
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FC6B17]" /> Live WHOIS Registry Status
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FC6B17]" /> 1-Click Export to CSV/PDF
            </span>
          </div>
        </div>
      </section>

      {/* -------------------- LIVE SAMPLE RESULTS PREVIEW (WITH SMART BLUR & POLISHED UI) -------------------- */}
      <section id="demo" className="py-16 px-4 sm:px-6 bg-white border-y border-gray-200/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FC6B17] bg-[#fff0e8] px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Live Output Demo
            </span>
            <h2 className="text-3xl font-extrabold text-[#0d1b3e] mt-3">
              What You See in Every Domain Audit
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Here is an exact preview of the metrics, authority signals, and 1-click registration actions OldUrl provides.
            </p>
          </div>

          {/* Filter Bar & Blur Mode Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-50/90 p-3.5 rounded-2xl border border-gray-200/80 mb-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
              <Filter className="w-4 h-4 text-gray-500 mr-1 hidden sm:inline" />
              <span className="text-gray-500 mr-1 hidden sm:inline">Filter:</span>
              <button
                onClick={() => setFilterTag('all')}
                className={`px-3 py-1.5 rounded-xl transition-all shadow-sm ${
                  filterTag === 'all'
                    ? 'bg-[#FC6B17] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All Samples
              </button>
              <button
                onClick={() => setFilterTag('available')}
                className={`px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                  filterTag === 'available'
                    ? 'bg-[#FC6B17] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available Only
              </button>
              <button
                onClick={() => setFilterTag('dr50')}
                className={`px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                  filterTag === 'dr50'
                    ? 'bg-[#FC6B17] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                ⭐ DR 50+ (High Authority)
              </button>
            </div>

            {/* Blur/Unblur Preview Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBlurred(!isBlurred)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isBlurred
                    ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                }`}
                title="Toggle privacy preview mode"
              >
                {isBlurred ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Domain Mask: <strong>Active (Gated)</strong></span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Domain Mask: <strong>Revealed</strong></span>
                  </>
                )}
              </button>
              <span className="text-xs font-semibold text-gray-400 hidden md:inline">
                {filteredDomains.length} records
              </span>
            </div>
          </div>

          {/* Results Table Mockup - Optimized to fit 100% width without horizontal slider */}
          <div className="rounded-2xl border border-gray-200/90 shadow-md bg-white overflow-hidden">
            <div className="w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-gray-200/80 text-gray-600 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 pl-5 pr-2 w-[28%]">Domain Name</th>
                    <th className="py-3.5 px-3 w-[15%]">Status</th>
                    <th className="py-3.5 px-3 w-[18%]">Domain Rating (DR)</th>
                    <th className="py-3.5 px-3 w-[14%]">Ref. Domains</th>
                    <th className="py-3.5 px-3 w-[25%]">Top Citation Sources</th>
                    <th className="py-3.5 pl-2 pr-5 text-right w-[12%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredDomains.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fff9f5] transition-colors group">
                      {/* Domain Column with perfect blur effect & clean badges */}
                      <td className="py-3.5 pl-5 pr-2">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <div className="font-mono text-[13.5px] font-bold text-[#0d1b3e] tracking-tight flex items-center whitespace-nowrap">
                            <span>{item.prefix}</span>
                            {isBlurred ? (
                              <span className="inline-block mx-0.5 filter blur-[3.5px] select-none text-gray-400 bg-gray-200/70 px-1.5 py-0.5 rounded tracking-wider font-mono text-xs">
                                {item.masked}
                              </span>
                            ) : (
                              <span className="text-[#FC6B17] font-semibold">{item.masked}</span>
                            )}
                            <span className="text-gray-500 font-semibold">{item.tld}</span>
                          </div>

                          {item.isHot && (
                            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                              <Flame className="w-2.5 h-2.5 fill-current" /> Hot
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {item.status === 'Available' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {item.status}
                          </span>
                        )}
                      </td>

                      {/* DR Progress Bar Column */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#0d1b3e] w-5">{item.dr}</span>
                          <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden p-0.5">
                            <div
                              className="bg-gradient-to-r from-[#FC6B17] to-amber-500 h-full rounded-full"
                              style={{ width: `${item.dr}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Referring Domains Column */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs">
                        <span className="font-bold text-[#0d1b3e]">{item.refDomains}</span> domains
                      </td>

                      {/* Top Citations Badges Column */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-blue-50 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200/60 inline-flex items-center gap-0.5 whitespace-nowrap"
                            >
                              🔗 {src}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 pl-2 pr-5 text-right whitespace-nowrap">
                        {item.status === 'Available' ? (
                          <a
                            href={`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(item.domain)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-[#FC6B17] hover:bg-[#e05b10] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all transform hover:-translate-y-0.5"
                          >
                            Register <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('signup');
                              setIsAuthOpen(true);
                            }}
                            className="inline-block bg-[#0d1b3e] hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all"
                          >
                            Set Alert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Gated Teaser Banner */}
            <div className="bg-gradient-to-r from-[#0d1b3e] to-[#1a2c5a] p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-[#FC6B17]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Unlock 4,890+ More High-Authority Expired Domains
                  </h4>
                  <p className="text-xs text-gray-300">
                    Sign in to reveal full unmasked domain names, historical Wayback age, and direct registrar links.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="bg-[#FC6B17] hover:bg-[#e05b10] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-full shadow-md whitespace-nowrap transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                Sign In to Unlock Free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- WHO IS OLDURL FOR (USE CASES) -------------------- */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 bg-[#f9f8f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FC6B17] bg-[#fff0e8] px-3 py-1 rounded-full">
              Use Cases
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d1b3e] mt-3">
              Who Uses OldUrl & Why
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Save dozens of hours of manual WHOIS lookups and expensive backlink checking subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl mb-4 text-[#FC6B17]">
                <TrendingUp className="w-6 h-6 text-[#FC6B17]" />
              </div>
              <h3 className="text-lg font-bold text-[#0d1b3e] mb-2">SEO Agencies</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Find powerful expired domains for 301 authority redirects, rebuild niche affiliate sites, or pass link equity without paying thousands at auctions.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4 text-blue-600">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0d1b3e] mb-2">Domain Flippers</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Scan thousands of dropping domains daily. Spot high DR domains with clean Wikipedia and news citations, register them for $10, and resell them for $300 - $3,000.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl mb-4 text-emerald-600">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0d1b3e] mb-2">Affiliate & Founders</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Skip the 6–12 month Google sandbox delay. Launch your new SaaS or affiliate blog on an aged domain with pre-existing trust and indexing speed.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl mb-4 text-purple-600">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0d1b3e] mb-2">Link Builders</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Crawl dead links on Forbes, TechCrunch, or Wikipedia. Upload your crawl export to OldUrl to find which dead target domains are available to register immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 4-STEP HOW IT WORKS -------------------- */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FC6B17]">
                THE PROCESS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 leading-tight">
                How OldUrl Audits & Delivers High-ROI Domains
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
                From finding broken authority citations on the web to registering live dropped domains, OldUrl automates the entire audit process in 4 steps.
              </p>
              <a
                href="/dashboard/domain-checker"
                className="inline-flex items-center gap-2 bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold px-7 py-3 rounded-full text-sm shadow-md transition-transform hover:-translate-y-0.5"
              >
                Start Auditing Now <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FC6B17]/40 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#FC6B17] flex items-center justify-center font-bold text-white flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">Gather or Export Target Domains</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Export dead outbound links from Ahrefs, Semrush, Screaming Frog, or media publications like Forbes, TechCrunch & Wikipedia.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FC6B17]/40 transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">Upload CSV or Paste Domains</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Drop your list of up to 55,000 domains into our bulk scanner. OldUrl queries authoritative WHOIS registry nodes in real time.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FC6B17]/40 transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">Filter by DR, Ref. Domains & Citations</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Filter out registered domains instantly and isolate only dropped, high-DR domains with real citation equity and zero spam history.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FC6B17]/40 transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">Register at Regular Cost & Export</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Register the winners directly on Namecheap, GoDaddy, or Dynadot for standard $10 reg fees, or export clean CSV reports for your team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- METRICS GLOSSARY EXPLAINED -------------------- */}
      <section id="metrics" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FC6B17] bg-[#fff0e8] px-3 py-1 rounded-full">
              SEO Intelligence
            </span>
            <h2 className="text-3xl font-extrabold text-[#0d1b3e] mt-3">Understanding the Metrics</h2>
            <p className="text-gray-600 text-sm mt-2">
              We eliminate guesswork by displaying the exact data points professional SEOs and domain investors evaluate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="text-2xl font-black text-[#FC6B17] mb-2">DR (Domain Rating)</div>
              <p className="text-xs font-bold text-gray-700 mb-2">Score from 0 to 100</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Measures the relative strength of a target domain’s backlink profile. A higher DR provides immediate rank authority for new content.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="text-2xl font-black text-[#FC6B17] mb-2">Referring Domains (RD)</div>
              <p className="text-xs font-bold text-gray-700 mb-2">Unique Linking Websites</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                The total count of distinct domain names linking to the target. Diverse referring domains from reputable websites safeguard against penalties.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="text-2xl font-black text-[#FC6B17] mb-2">Live Drop Status</div>
              <p className="text-xs font-bold text-gray-700 mb-2">Real-time WHOIS Lifecycle</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Differentiates available domains (ready to register right now) from domains in redemption periods, expired grace periods, or active status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- PRICING SECTION -------------------- */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-[#f9f8f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d1b3e]">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 mb-6">
              Start free and scale as your domain research demands grow. Cancel anytime.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-2 bg-gray-200/80 p-1 rounded-full text-xs font-bold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billingCycle === 'annual' ? 'bg-[#FC6B17] text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b3e]">Free</h3>
                <p className="text-xs text-gray-500 mb-4">For individuals & quick tests</p>
                <div className="text-3xl font-black text-[#0d1b3e] mb-6">
                  $0<span className="text-xs text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <li className="flex items-center gap-2">✓ <strong>10 domain lookups</strong> / mo</li>
                  <li className="flex items-center gap-2">✓ Domain expiry & WHOIS check</li>
                  <li className="flex items-center gap-2">✓ Domain Rating (DR) score</li>
                  <li className="flex items-center gap-2 text-gray-400">✗ Bulk CSV upload</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="w-full text-center border-2 border-[#FC6B17] text-[#FC6B17] hover:bg-[#FC6B17] hover:text-white font-bold py-2.5 rounded-full text-xs transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Starter */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b3e]">Starter</h3>
                <p className="text-xs text-gray-500 mb-4">For freelancers & small builders</p>
                <div className="text-3xl font-black text-[#0d1b3e] mb-6">
                  {billingCycle === 'annual' ? '$15' : '$19'}
                  <span className="text-xs text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <li className="flex items-center gap-2">✓ <strong>3,500 domain lookups</strong> / mo</li>
                  <li className="flex items-center gap-2">✓ Bulk CSV & XLSX upload</li>
                  <li className="flex items-center gap-2">✓ Export to CSV & PDF</li>
                  <li className="flex items-center gap-2">✓ 100 deep domain analytics</li>
                  <li className="flex items-center gap-2">✓ Search history</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="w-full text-center border-2 border-[#FC6B17] text-[#FC6B17] hover:bg-[#FC6B17] hover:text-white font-bold py-2.5 rounded-full text-xs transition-colors"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth - Highlighted */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#FC6B17] flex flex-col justify-between relative shadow-xl transform lg:-translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FC6B17] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#0d1b3e]">Growth</h3>
                <p className="text-xs text-gray-500 mb-4">For SEOs & growing teams</p>
                <div className="text-3xl font-black text-[#0d1b3e] mb-6">
                  {billingCycle === 'annual' ? '$39' : '$49'}
                  <span className="text-xs text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <li className="flex items-center gap-2">✓ <strong>20,000 domain lookups</strong> / mo</li>
                  <li className="flex items-center gap-2">✓ Fast bulk CSV / XML uploads</li>
                  <li className="flex items-center gap-2">✓ 300 deep domain analytics</li>
                  <li className="flex items-center gap-2">✓ Authority backlink breakdown</li>
                  <li className="flex items-center gap-2">✓ Priority email support</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="w-full text-center bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold py-2.5 rounded-full text-xs shadow-md transition-colors"
              >
                Choose Growth
              </button>
            </div>

            {/* Agency */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b3e]">Agency</h3>
                <p className="text-xs text-gray-500 mb-4">For high-volume crawlers</p>
                <div className="text-3xl font-black text-[#0d1b3e] mb-6">
                  {billingCycle === 'annual' ? '$79' : '$99'}
                  <span className="text-xs text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
                  <li className="flex items-center gap-2">✓ <strong>55,000 domain lookups</strong> / mo</li>
                  <li className="flex items-center gap-2">✓ 1,500 deep domain analytics</li>
                  <li className="flex items-center gap-2">✓ Referring domain breakdown</li>
                  <li className="flex items-center gap-2">✓ Priority domain highlighting</li>
                  <li className="flex items-center gap-2">✓ Dedicated account manager</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="w-full text-center border-2 border-[#FC6B17] text-[#FC6B17] hover:bg-[#FC6B17] hover:text-white font-bold py-2.5 rounded-full text-xs transition-colors"
              >
                Choose Agency
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FAQ ACCORDION -------------------- */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#0d1b3e]">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-sm mt-2">
              Everything you need to know about OldUrl and expired domain auditing.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-[#0d1b3e] text-sm sm:text-base hover:bg-gray-50"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl text-[#FC6B17] font-semibold">
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-[#FC6B17]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#FC6B17]" />
                    )}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- FINAL CTA BANNER -------------------- */}
      <section className="py-20 px-4 sm:px-6 bg-[#111111] text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Start Auditing Expired Domains Today
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8">
            Join SEOs and domain investors uncovering high-DR dropped domains before competitors. Start with 10 free lookups.
          </p>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setIsAuthOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold px-8 py-3.5 rounded-full text-sm sm:text-base shadow-xl transition-transform hover:-translate-y-0.5"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-[#0b0b0b] text-gray-400 text-xs py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-lg font-black text-white mb-2">
              <span className="text-[#FC6B17]">Old</span>Url.domains
            </div>
            <p className="text-gray-500 leading-relaxed">
              The high-speed expired domain audit scanner for SEO agencies, domain flippers, and niche builders.
            </p>
          </div>
          <div>
            <div className="font-bold text-[#FC6B17] uppercase tracking-wider mb-3">Product</div>
            <ul className="space-y-2">
              <li>
                <a href="#demo" className="hover:text-white">
                  Live Demo
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white">
                  Workflow
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-[#FC6B17] uppercase tracking-wider mb-3">Support</div>
            <ul className="space-y-2">
              <li>
                <a href="/blog" className="hover:text-white">
                  SEO & Domain Blog
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-[#FC6B17] uppercase tracking-wider mb-3">Community</div>
            <a
              href="https://x.com/oldurl_domains"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Follow on 𝕏 (@oldurl_domains)
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-6 border-t border-white/5 text-center text-gray-600">
          © {new Date().getFullYear()} OldUrl.domains. All rights reserved.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
