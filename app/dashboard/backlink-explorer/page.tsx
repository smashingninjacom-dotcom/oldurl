'use client';

import React, { useState } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Sparkles,
  Flame,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Download,
} from 'lucide-react';

interface OutboundLinkTarget {
  targetDomain: string;
  sourceArticle: string;
  sourceDomain: string;
  dr: number;
  status: 'Available' | 'Expiring Soon' | 'Active';
  anchorText: string;
  firstSeen: string;
}

export default function BacklinkExplorerPage() {
  const [authoritySite, setAuthoritySite] = useState('forbes.com');
  const [isCrawling, setIsCrawling] = useState(false);
  const [results, setResults] = useState<OutboundLinkTarget[]>([
    {
      targetDomain: 'techradar-archive.org',
      sourceArticle: 'https://forbes.com/sites/innovation/2021/best-cloud-storage-tools',
      sourceDomain: 'Forbes',
      dr: 58,
      status: 'Available',
      anchorText: 'Cloud Archive Review',
      firstSeen: '2021',
    },
    {
      targetDomain: 'greenhealthjournal.com',
      sourceArticle: 'https://en.wikipedia.org/wiki/Plant-based_diet#Health_effects',
      sourceDomain: 'Wikipedia',
      dr: 46,
      status: 'Available',
      anchorText: 'Clinical Botanical Meta-Study',
      firstSeen: '2019',
    },
    {
      targetDomain: 'financenordic.io',
      sourceArticle: 'https://bloomberg.com/news/articles/2022-scandinavian-fintech-report',
      sourceDomain: 'Bloomberg',
      dr: 52,
      status: 'Expiring Soon',
      anchorText: 'Nordic Open Banking Portal',
      firstSeen: '2022',
    },
    {
      targetDomain: 'nextgenmobility.co',
      sourceArticle: 'https://theverge.com/transportation/ev-charging-networks-explained',
      sourceDomain: 'The Verge',
      dr: 49,
      status: 'Available',
      anchorText: 'NextGen Mobility Consortium',
      firstSeen: '2020',
    },
  ]);

  const handleCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authoritySite.trim()) return;

    setIsCrawling(true);
    setTimeout(() => {
      setIsCrawling(false);
      setResults([
        {
          targetDomain: `${authoritySite.split('.')[0]}-partner-initiative.org`,
          sourceArticle: `https://${authoritySite}/resources/archived-links`,
          sourceDomain: authoritySite,
          dr: 54,
          status: 'Available',
          anchorText: 'Official Resource Center',
          firstSeen: '2020',
        },
        ...results,
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* -------------------- HEADER -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
            Authority Outbound Link Explorer
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Crawl top publications (Forbes, TechCrunch, Wikipedia, NYTimes) to find which outbound links are broken and available to register.
          </p>
        </div>
      </div>

      {/* -------------------- SEARCH BAR -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
        <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2.5 bg-[#fdfaf7] border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#FC6B17]">
            <Globe className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={authoritySite}
              onChange={(e) => setAuthoritySite(e.target.value)}
              placeholder="Enter authority source (e.g. forbes.com, techcrunch.com, wikipedia.org)..."
              className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={isCrawling}
            className="w-full sm:w-auto bg-[#FC6B17] hover:bg-[#e05b10] disabled:bg-gray-300 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Crawling Outbound Links...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Find Broken Outbound Links
              </>
            )}
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 flex-wrap">
          <span className="font-semibold text-gray-700">Quick Authority Targets:</span>
          {['forbes.com', 'wikipedia.org', 'techcrunch.com', 'theverge.com', 'bloomberg.com'].map(
            (domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setAuthoritySite(domain)}
                className="bg-gray-50 hover:bg-[#fff0e8] hover:text-[#FC6B17] px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 transition-colors"
              >
                {domain}
              </button>
            )
          )}
        </div>
      </div>

      {/* -------------------- RESULTS TABLE -------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm font-bold text-[#0d1b3e]">
              Discovered Expired Domains from Authority Outbound Links ({results.length})
            </h3>
          </div>

          <button
            onClick={() => alert('Exporting outbound backlink targets to CSV...')}
            className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Expired Target Domain</th>
                <th className="py-3 px-3">DR Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Cited By Authority</th>
                <th className="py-3 px-3">Anchor Text Link</th>
                <th className="py-3 px-3">First Linked</th>
                <th className="py-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {results.map((item, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-mono font-bold text-[#0d1b3e] text-xs flex items-center gap-1.5">
                      {item.targetDomain}
                      {item.dr >= 50 && (
                        <span className="bg-orange-100 text-[#FC6B17] text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          ⭐ DR 50+
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-3 font-black text-sm text-[#0d1b3e]">{item.dr}</td>

                  <td className="py-4 px-3">
                    {item.status === 'Available' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        🟢 Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        🟠 Expiring Soon
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      🔗 {item.sourceDomain}
                    </span>
                  </td>

                  <td className="py-4 px-3 text-gray-600 max-w-xs truncate font-medium">
                    &ldquo;{item.anchorText}&rdquo;
                  </td>

                  <td className="py-4 px-3 text-gray-400">{item.firstSeen}</td>

                  <td className="py-4 pr-4 text-right">
                    {item.status === 'Available' ? (
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${item.targetDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FC6B17] hover:bg-[#e05b10] text-white px-3 py-1.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                      >
                        Register ↗
                      </a>
                    ) : (
                      <button
                        onClick={() => alert(`Alert set for ${item.targetDomain}`)}
                        className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-[11px]"
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
      </div>
    </div>
  );
}
