import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Expired Domain Finder & SEO Authority Auditor | OldUrl.domains',
  description:
    'Find and audit expired domains linked by Forbes, TechCrunch, Wikipedia & more. Check live WHOIS availability, Domain Rating (DR), referring domains, and Tier-1 authority backlinks.',
  keywords: [
    'expired domains',
    'expired domain finder',
    'domain audit tool',
    'domain rating checker',
    'expired domains with backlinks',
    'bulk domain checker',
    'referring domains',
    'OldUrl',
  ],
  authors: [{ name: 'OldUrl', url: 'https://oldurl.domains' }],
  metadataBase: new URL('https://oldurl.domains'),
  alternates: {
    canonical: 'https://oldurl.domains',
  },
  openGraph: {
    title: 'Expired Domain Finder & SEO Authority Auditor | OldUrl.domains',
    description:
      'Find and audit expired domains linked by Forbes, TechCrunch, Wikipedia & more. Check live WHOIS availability, DR, and backlinks.',
    url: 'https://oldurl.domains',
    siteName: 'OldUrl',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expired Domain Finder & SEO Authority Auditor | OldUrl.domains',
    description:
      'Find and audit expired domains linked by Forbes, TechCrunch, Wikipedia & more.',
    creator: '@oldurl_domains',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased selection:bg-[#FC6B17] selection:text-white bg-[#fdf5ee]">
        {children}
      </body>
    </html>
  );
}
