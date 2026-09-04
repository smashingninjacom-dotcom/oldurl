import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | OldUrl.domains',
  description: 'Terms of Service and usage agreement for OldUrl.domains.',
};

export default function TermsPage() {
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
            <FileText className="w-4 h-4" /> Terms &amp; Conditions
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0d1b3e] tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-xs text-gray-400 mb-8 font-medium">
            Last Updated: September 4, 2026 | Effective Date: September 4, 2026
          </p>

          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">1. Agreement to Terms</h2>
              <p>
                By accessing or using OldUrl (&quot;Service&quot;) located at{' '}
                <a href="https://oldurl.vercel.app" className="text-[#FC6B17] font-semibold">
                  https://oldurl.vercel.app
                </a>{' '}
                or{' '}
                <a href="https://oldurl.domains" className="text-[#FC6B17] font-semibold">
                  https://oldurl.domains
                </a>
                , you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">2. Description of Service</h2>
              <p>
                OldUrl is a search intelligence and analytics platform designed to check domain expiry status, Domain Rating (DR), referring domains, and historical backlink signals. We do not act as an ICANN accredited registrar; domain registrations take place on third-party registrars (e.g. Namecheap, Dynadot, GoDaddy) at standard retail rates.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">3. User Accounts</h2>
              <p>
                To access authenticated features, you must authenticate using your Google account via Google OAuth. You are responsible for maintaining the confidentiality of your session and all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">4. Acceptable Use Policy</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Use the Service for any unlawful purpose or in violation of any local, state, national, or international law.</li>
                <li>Attempt to reverse-engineer, bypass rate limits, or disrupt our scanning infrastructure.</li>
                <li>Resell access to the platform without prior written authorization.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">5. Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While we strive to provide real-time WHOIS and backlink metrics, we do not warrant that all registry data or third-party backlink data will be 100% error-free or uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0d1b3e] mb-2">6. Contact Information</h2>
              <p>
                Questions regarding these Terms of Service should be directed to:
              </p>
              <p className="mt-2 font-semibold text-[#0d1b3e]">
                OldUrl Team
                <br />
                Email: <a href="mailto:smashingninja.com@gmail.com" className="text-[#FC6B17]">smashingninja.com@gmail.com</a>
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
