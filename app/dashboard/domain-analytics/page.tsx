'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  UploadCloud,
  FileSpreadsheet,
  Zap,
  Plus,
} from 'lucide-react';

function extractDomainsFromText(text: string): string[] {
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.[a-zA-Z]{2,})/gi;
  const matches = text.match(domainRegex) || [];
  const unique = new Set<string>();

  for (const raw of matches) {
    const clean = raw
      .trim()
      .toLowerCase()
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .split(':')[0]
      .replace(/[^a-z0-9.-]/g, '');

    if (
      clean &&
      clean.includes('.') &&
      clean.length >= 4 &&
      !clean.endsWith('.xml') &&
      !clean.endsWith('.gz') &&
      !clean.endsWith('.html') &&
      !clean.endsWith('.php') &&
      !clean.endsWith('.json')
    ) {
      unique.add(clean);
    }
  }

  if (unique.size === 0) {
    text.split(/[\r\n,;]+/).forEach((line) => {
      const clean = line
        .trim()
        .toLowerCase()
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0]
        .replace(/[^a-z0-9.-]/g, '');
      if (clean && clean.includes('.') && clean.length >= 4) {
        unique.add(clean);
      }
    });
  }

  return Array.from(unique);
}

export default function DomainAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'add' | 'upload'>('add');
  const [domains, setDomains] = useState('');

  const handleAnalyse = () => {
    if (!domains.trim()) {
      alert('Please enter domains to analyze (max 300).');
      return;
    }
    const domainList = extractDomainsFromText(domains.trim());
    if (domainList.length === 0) {
      alert('No valid domains found.');
      return;
    }
    try {
      sessionStorage.setItem('pending_analytics_domains', domainList.slice(0, 300).join('\n'));
    } catch (e) {}
    // Navigate cleanly without query string to avoid URI_TOO_LONG (414)
    router.push('/dashboard/domain-analytics-result');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const domainList = extractDomainsFromText(text);
        if (domainList.length > 0) {
          try {
            sessionStorage.setItem('pending_analytics_domains', domainList.slice(0, 300).join('\n'));
          } catch (err) {}
          router.push('/dashboard/domain-analytics-result');
        } else {
          alert('No valid domain names found in the uploaded file (supports XML, CSV, and TXT).');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="text-gray-400">🏠 Home</span>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Domain Analytics</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1b3e]">Domain Analytics</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 text-xs font-bold pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'add'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Add Domain(s)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 text-xs font-bold pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload File (XML / CSV / TXT)
          </button>
        </div>

        {/* Input Area */}
        {activeTab === 'add' ? (
          <div>
            <div className="relative bg-[#fcfbf9] border border-gray-200 rounded-2xl p-4 focus-within:border-indigo-600 transition-colors">
              <div className="absolute top-4 left-4 text-indigo-400">
                <Globe className="w-4 h-4" />
              </div>
              <textarea
                rows={6}
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="Enter one or multiple domains (max 300)...&#10;example.com&#10;test.com, google.com"
                className="w-full pl-7 bg-transparent border-none outline-none text-xs font-mono text-gray-800 placeholder-gray-400 resize-y"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleAnalyse}
                className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Analyse Domains
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">Drop XML sitemap, CSV, or TXT file for Domain Analytics</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Maximum 300 domains per analysis run</p>
            <label className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-xs">
              <input
                type="file"
                accept=".xml,.csv,.txt,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              Select File (XML / CSV)
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
