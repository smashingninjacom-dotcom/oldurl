'use client';

import React, { useState } from 'react';
import {
  Key,
  Copy,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Zap,
  Terminal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState('oldurl_live_9f84a821e2c908f918bb720');
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node'>('curl');

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://oldurl.domains/api/check-domain \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domains": ["techradar-archive.org", "greenhealthjournal.com"]
  }'`,
    node: `const response = await fetch('https://oldurl.domains/api/check-domain', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domains: ['techradar-archive.org', 'greenhealthjournal.com']
  })
});

const data = await response.json();
console.log(data.results);`,
    python: `import requests

url = "https://oldurl.domains/api/check-domain"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "domains": ["techradar-archive.org", "greenhealthjournal.com"]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* -------------------- HEADER -------------------- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight">
          Developer API & Integrations
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Automate expired domain audits and backlink discovery into your custom scripts, bots, or CRM.
        </p>
      </div>

      {/* -------------------- API KEY CARD -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-[#0d1b3e] mb-1">Your Production API Secret Key</h3>
        <p className="text-xs text-gray-500 mb-4">
          Authenticate your requests by including your secret key in the Authorization bearer header.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-xs text-gray-800 font-bold flex items-center justify-between">
            <span>{apiKey}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Active
            </span>
          </div>

          <button
            onClick={copyKey}
            className="w-full sm:w-auto bg-[#FC6B17] hover:bg-[#e05b10] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied Key!' : 'Copy Key'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Rate Limit: <strong>120 requests / min</strong></span>
          <button
            onClick={() => setApiKey(`oldurl_live_${Math.random().toString(36).substring(2, 15)}`)}
            className="text-[#FC6B17] hover:underline font-bold"
          >
            Regenerate Secret Key
          </button>
        </div>
      </div>

      {/* -------------------- CODE IMPLEMENTATION EXAMPLES -------------------- */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 shadow-md border border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#FC6B17]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Integration Snippets
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveCodeTab('curl')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeCodeTab === 'curl' ? 'bg-[#FC6B17] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              cURL (Bash)
            </button>
            <button
              onClick={() => setActiveCodeTab('node')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeCodeTab === 'node' ? 'bg-[#FC6B17] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Node.js / Fetch
            </button>
            <button
              onClick={() => setActiveCodeTab('python')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeCodeTab === 'python' ? 'bg-[#FC6B17] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Python (Requests)
            </button>
          </div>
        </div>

        <pre className="font-mono text-xs text-orange-200/90 overflow-x-auto p-2 leading-relaxed">
          {codeSnippets[activeCodeTab]}
        </pre>
      </div>
    </div>
  );
}
