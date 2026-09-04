'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  Plus,
} from 'lucide-react';
import { parseDomainsFromFile } from '../../../lib/fileParser';

interface BatchScanJob {
  id: string;
  filename: string;
  fileSize: string;
  totalRows: number;
  completedRows: number;
  availableFound: number;
  highDrFound: number;
  status: 'Completed' | 'Scanning' | 'Queued' | 'Paused';
  date: string;
}

export default function BulkScannerPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'xml'>('csv');
  const [domainColumnName, setDomainColumnName] = useState('domain');
  const [jobs, setJobs] = useState<BatchScanJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file?: File) => {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    const filename = file.name;
    const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setUploadProgress(20);
    try {
      const domainList = await parseDomainsFromFile(file);
      setUploadProgress(100);
      if (domainList.length > 0) {
        sessionStorage.setItem('pending_domains', domainList.join('\n'));
        router.push('/dashboard/results');
      } else {
        alert('No valid domain names found in the uploaded file.');
        setUploadProgress(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing uploaded file. Please make sure it is a valid CSV, XML, or XLSX file.');
      setUploadProgress(null);
    }
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* -------------------- BREADCRUMB -------------------- */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          🏠 Home
        </Link>
        <span>›</span>
        <span className="text-[#FC6B17] font-semibold">Bulk Scanner</span>
      </div>

      {/* -------------------- HEADER -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
            Bulk CSV / XML Scanner
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Upload unlimited domain lists. Our high-speed cloud nodes process them instantly with real-time WHOIS/RDAP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Monthly Bulk Limit: <strong>Unlimited (Pro Plan)</strong>
          </span>
        </div>
      </div>

      {/* -------------------- DRAG & DROP UPLOAD ZONE -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files?.[0];
            handleFileUpload(droppedFile);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#FC6B17] bg-orange-50/50'
              : 'border-gray-200 bg-gray-50/50 hover:bg-orange-50/30 hover:border-[#FC6B17]/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xml,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-[#fff0e8] text-[#FC6B17] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">
            Drag &amp; Drop your CSV, XLSX, or XML domain file here
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
            Supports exports from Screaming Frog, Ahrefs, Semrush, or raw lists with multiple columns.
          </p>

          <button
            type="button"
            className="bg-[#FC6B17] hover:bg-[#e05b10] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-transform hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Browse Computer Files
          </button>
        </div>

        {uploadProgress !== null && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between text-xs font-bold text-orange-950 mb-1.5">
              <span>Uploading &amp; Parsing Columns...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-orange-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#FC6B17] h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Config Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Preferred Format</label>
            <select
              value={selectedFormat}
              onChange={(e: any) => setSelectedFormat(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FC6B17]"
            >
              <option value="csv">CSV (Comma Separated)</option>
              <option value="xlsx">Excel Workbook (.xlsx)</option>
              <option value="xml">Sitemap / Crawl XML</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Target Domain Column</label>
            <input
              type="text"
              value={domainColumnName}
              onChange={(e) => setDomainColumnName(e.target.value)}
              placeholder="e.g. domain, url, destination"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-[#FC6B17]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Scan Priority</label>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Turbo Cloud Nodes (Instant)
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- SCAN QUEUE & BATCH HISTORY -------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0d1b3e]">Scan Queue &amp; Batch History</h3>
            <p className="text-xs text-gray-500">Live processing status of your uploaded batch files</p>
          </div>
          {jobs.length > 0 && (
            <button
              onClick={() => handleFileUpload()}
              className="text-xs font-bold text-[#FC6B17] hover:bg-[#fff0e8] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No bulk scans uploaded yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Drop any domain list or spreadsheet in the upload box above to queue high-speed background RDAP/WHOIS scans.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Available Found</th>
                  <th className="py-3 px-3">DR 50+</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {jobs.map((job) => {
                  const percent = Math.round((job.completedRows / job.totalRows) * 100);
                  return (
                    <tr key={job.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FC6B17] flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{job.filename}</div>
                            <div className="text-[10px] text-gray-400">
                              {job.fileSize} • {job.totalRows.toLocaleString()} rows
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 w-44">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span>
                              {job.completedRows.toLocaleString()} / {job.totalRows.toLocaleString()}
                            </span>
                            <span className="text-gray-500">{percent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                job.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#FC6B17]'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          🟢 {job.availableFound} Available
                        </span>
                      </td>

                      <td className="py-4 px-3 font-bold text-[#FC6B17]">
                        ⭐ {job.highDrFound} domains
                      </td>

                      <td className="py-4 px-3">
                        {job.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </span>
                        ) : job.status === 'Scanning' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FC6B17] bg-[#fff0e8] px-2.5 py-0.5 rounded-full border border-[#FC6B17]/30">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#FC6B17]" /> Scanning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> In Queue
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 text-gray-500 text-[11px]">{job.date}</td>

                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === 'Completed' ? (
                            <button
                              onClick={() => alert(`Downloading cleaned report for ${job.filename}`)}
                              className="bg-[#0d1b3e] hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                            >
                              <Download className="w-3 h-3" /> Report
                            </button>
                          ) : (
                            <button
                              onClick={() => alert('Batch is currently processing in cloud.')}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                            >
                              View
                            </button>
                          )}
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
