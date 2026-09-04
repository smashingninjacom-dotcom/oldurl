'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  UploadCloud,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { parseDomainsFromFile, extractDomainsFromText } from '../../../lib/fileParser';

export default function DomainCheckerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'add' | 'upload'>('add');
  const [domains, setDomains] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleCheckDomains = () => {
    if (!domains.trim()) {
      alert('Please enter at least one domain name.');
      return;
    }
    const domainList = extractDomainsFromText(domains.trim());
    if (domainList.length === 0) {
      alert('No valid domain names recognized. Please enter a domain like example.com.');
      return;
    }

    try {
      sessionStorage.setItem('pending_domains', domainList.slice(0, 2500).join('\n'));
    } catch (e) {
      console.error(e);
    }

    // Always navigate cleanly without query strings to prevent URI_TOO_LONG (414)
    router.push('/dashboard/results');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const domainList = await parseDomainsFromFile(file);
      if (domainList.length > 0) {
        sessionStorage.setItem('pending_domains', domainList.slice(0, 2500).join('\n'));
        router.push('/dashboard/results');
      } else {
        alert('No valid domain names found in the uploaded file. Please make sure the file contains domain names or URLs.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error parsing file. Please upload a valid CSV, XML sitemap, or XLSX file.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          🏠 Home
        </Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Domain Checker</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1b3e]">Domain Checker</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Find expired domains and get key metrics like expiry date, days remaining, domain rating, and registrar info.
        </p>
      </div>

      {/* Main Checker Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-100 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 text-xs font-bold pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'add'
                ? 'border-[#FC6B17] text-[#FC6B17]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Add Domain(s)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 text-xs font-bold pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-[#FC6B17] text-[#FC6B17]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload File (XML / CSV / XLSX)
          </button>
        </div>

        {/* Input Area */}
        {activeTab === 'add' ? (
          <div>
            <div className="relative bg-[#fcfbf9] border border-gray-200 rounded-2xl p-4 focus-within:border-[#FC6B17] transition-colors">
              <div className="absolute top-4 left-4 text-orange-400">
                <Globe className="w-4 h-4" />
              </div>
              <textarea
                rows={6}
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="Enter one or multiple domains...&#10;example.com&#10;test.com, google.com"
                className="w-full pl-7 bg-transparent border-none outline-none text-xs font-mono text-gray-800 placeholder-gray-400 resize-y"
              />
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-500">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-100 text-[#FC6B17] flex items-center justify-center font-bold text-[9px]">
                !
              </span>
              <span>
                Separate multiple domains with commas or new lines. Full URLs like{' '}
                <strong className="text-[#FC6B17] font-semibold">https://example.com</strong> are accepted.
              </span>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleCheckDomains}
                className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5"
              >
                Check Domains
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50 hover:bg-orange-50/30 transition-colors">
            {isParsing ? (
              <div className="py-6 space-y-2">
                <RefreshCw className="w-8 h-8 text-[#FC6B17] animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-800">Parsing domains from file...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-8 h-8 text-[#FC6B17] mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-800">Drop your XML sitemap, CSV, or XLSX file here</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supports XML sitemaps, Screaming Frog exports, CSV, and Excel workbooks</p>
                <label className="mt-4 inline-block cursor-pointer bg-[#FC6B17] hover:bg-[#e05b10] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                  <span>Choose File &amp; Scan</span>
                  <input
                    type="file"
                    accept=".xml,.csv,.txt,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
