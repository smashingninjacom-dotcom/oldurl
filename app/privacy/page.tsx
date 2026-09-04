import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | OldUrl.domains',
  description: 'Privacy Policy and data protection terms for OldUrl.domains.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f8] text-[#1e1e2d] font-sans antialiased">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xl font-black text-[#0d1b3e] tracking-tight"
          >
            <span className="text-[#FC6B17]">Old</span>Url
            <span className="text-xs bg-[#fff0e8] text-[#FC6B17] font-bold px-2 py-0.5 rounded-full border border-[#FC6B17]/30">
              .domains
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#FC6B17] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200/80">
          <div className="inline-flex items-center gap-2 bg-[#fff0e8] text-[#FC6B17] text-xs font-bold px-3.5 py-1 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4" /> Legal &amp; Data Protection
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0d1b3e] tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-400 mb-8 font-medium">
            Last Updated: September 4, 2026 | Effective Date: September 4, 2026
          </p>

          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">1. Overview</h2>
              <p>
                Welcome to OldUrl (accessible from{' '}
                <a href="https://oldurl.vercel.app" className="text-[#FC6B17] font-semibold">
                  https://oldurl.vercel.app
                </a>{' '}
                and{' '}
                <a href="https://oldurl.domains" className="text-[#FC6B17] font-semibold">
                  https://oldurl.domains
                </a>
                ). OldUrl (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access our domain intelligence engine, WHOIS audit tools, and user dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us when using our services:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Account Information via Google OAuth:</strong> When you sign in with Google, we receive your basic public profile information provided by Google (your name, email address, and avatar profile picture URL). We do not collect or store your Google passwords.
                </li>
                <li>
                  <strong>Domain Search &amp; Audit Data:</strong> Domain names, queries, and bulk CSV/XLSX/XML files you submit for SEO authority, backlink metrics, and WHOIS status analysis.
                </li>
                <li>
                  <strong>Saved Watchlists &amp; History:</strong> Domain records you bookmark or save to your account dashboard.
                </li>
                <li>
                  <strong>Technical &amp; Log Data:</strong> IP addresses, browser types, operating systems, referring URLs, and timestamps to ensure application performance, rate limiting, and security.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">3. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>To provide, operate, and maintain our domain authority and WHOIS analysis services.</li>
                <li>To authenticate your identity and secure your user dashboard.</li>
                <li>To store your search history, bulk audit reports, and saved watchlist domains.</li>
                <li>To prevent fraudulent activity, unauthorized scraping, and ensure system stability.</li>
                <li>To respond to your support inquiries and provide customer assistance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">4. Google API &amp; OAuth Data Compliance</h2>
              <p>
                OldUrl&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FC6B17] font-semibold"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements. We only request basic identification scopes (<code>openid</code>, <code>email</code>, <code>profile</code>) required to authenticate you into our platform. We never sell your Google account data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">5. Data Retention &amp; Security</h2>
              <p>
                We use industry-standard encryption protocols (TLS/HTTPS in transit and AES-256 at rest) via our managed database infrastructure (Supabase / AWS). Your authentication tokens and account data are protected with strict Row Level Security (RLS) policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">6. Your Rights &amp; Data Deletion</h2>
              <p>
                You have the right to access, export, or request the complete deletion of your account and search history at any time. You can clear your search history directly from your dashboard settings or email us at{' '}
                <a href="mailto:smashingninja.com@gmail.com" className="text-[#FC6B17] font-semibold">
                  smashingninja.com@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">7. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding this Privacy Policy, please contact our Data Protection team at:
              </p>
              <p className="mt-2 font-semibold text-[#0d1b3e]">
                OldUrl Support Team
                <br />
                Email: <a href="mailto:smashingninja.com@gmail.com" className="text-[#FC6B17]">smashingninja.com@gmail.com</a>
                <br />
                Website: <a href="https://oldurl.vercel.app" className="text-[#FC6B17]">https://oldurl.vercel.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} OldUrl.domains. All rights reserved.
      </footer>
    </div>
  );
}
