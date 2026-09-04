'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  UploadCloud,
  FileSpreadsheet,
  Zap,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { parseDomainsFromFile, extractDomainsFromText } from '../../../lib/fileParser';
import { setPendingAnalyticsDomains } from '../../../lib/searchHistory';

export default function DomainAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'add' | 'upload'>('add');
  const [domains, setDomains] = useState('');
  const [isParsing, setIsParsing] = useState(false);

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
    setPendingAnalyticsDomains(domainList);
    router.push('/dashboard/domain-analytics-result');
  };

  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    try {
      const domainList = await parseDomainsFromFile(file);
      if (domainList.length > 0) {
        setPendingAnalyticsDomains(domainList);
        router.push('/dashboard/domain-analytics-result');
      } else {
        alert('No valid domain names found in the uploaded file (supports XML, CSV, and XLSX).');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
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
            <UploadCloud className="w-3.5 h-3.5" /> Upload File (XML / CSV / XLSX)
          </button>
        </div>

        {/* Input Area */}
        {activeTab === 'add' ? (
          <div>
            <div className="relative bg-gray-50/50 border border-gray-200 rounded-2xl p-4 focus-within:border-indigo-500 transition-colors">
              <div className="absolute top-4 left-4 text-indigo-500">
                <Globe className="w-4 h-4" />
              </div>
              <textarea
                rows={6}
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="Enter domains separated by line or comma (e.g. google.com, apple.com)..."
                className="w-full pl-7 bg-transparent border-none outline-none text-xs font-mono text-gray-800 placeholder-gray-400 resize-y"
              />
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[9px]">
                  !
                </span>
                <span>Separate domains with spaces or commas.</span>
              </div>
              <span className="font-semibold text-gray-400">
                Limit: <strong className="text-gray-700">300 domains</strong>
              </span>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleAnalyse}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> Analyse Domain(s)
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-200 hover:border-indigo-500 rounded-2xl p-10 text-center bg-gray-50/50 hover:bg-indigo-50/30 transition-colors"
          >
            {isParsing ? (
              <div className="py-6 space-y-2">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-800">Parsing domains from file...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-800">Drop your XML sitemap, CSV, or XLSX file here</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supports XML sitemaps, Screaming Frog exports, CSV, and Excel workbooks</p>
                <label className="mt-4 inline-block cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs">
                  <span>Choose File &amp; Analyze</span>
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
