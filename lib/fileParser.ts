import * as XLSX from 'xlsx';

// Metadata URLs from XML/XLSX headers to ignore
const IGNORED_DOMAINS = new Set([
  'schemas.openxmlformats.org',
  'schemas.microsoft.com',
  'openxmlformats.org',
  'microsoft.com',
  'w3.org',
  'www.w3.org',
  'purl.org',
  'xmlsoap.org',
  'xml.org',
  'schema.org',
  'sitemaps.org',
  'www.sitemaps.org',
  'google.com/schemas',
]);

/**
 * Cleans, sanitizes, and validates a domain name or URL.
 */
export function cleanAndValidateDomain(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let d = raw
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, '')
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0]
    .replace(/[^a-z0-9.-]/g, '');

  // Remove leading/trailing dots and hyphens
  d = d.replace(/^\.+|\.+$/g, '').replace(/^-+|-+$/g, '');

  if (!d || !d.includes('.') || d.length < 3) return null;

  const lastDot = d.lastIndexOf('.');
  const tld = d.slice(lastDot + 1);
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) return null;

  // Ignore file extensions
  if (
    [
      'xml',
      'gz',
      'html',
      'htm',
      'php',
      'json',
      'png',
      'jpg',
      'jpeg',
      'css',
      'js',
      'svg',
      'webp',
      'pdf',
      'zip',
      'xlsx',
      'csv',
      'txt',
    ].includes(tld)
  ) {
    return null;
  }

  // Ignore schema boilerplate
  if (IGNORED_DOMAINS.has(d)) return null;

  return d;
}

/**
 * Universal file parser for Excel (.xlsx/.xls), XML sitemaps, CSV, TSV, and TXT files.
 */
export async function parseDomainsFromFile(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();
  const domainSet = new Set<string>();

  // 1. Process Excel (.xlsx, .xls) files cell-by-cell
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        for (const row of rows) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (cell !== undefined && cell !== null && cell !== '') {
                const cellStr = String(cell).trim();
                // Check if cell contains URLs or space/comma separated domains
                const pieces = cellStr.split(/[\s,;]+/);
                for (const piece of pieces) {
                  const cleaned = cleanAndValidateDomain(piece);
                  if (cleaned) domainSet.add(cleaned);
                }
              }
            }
          }
        }
      }

      if (domainSet.size > 0) {
        return Array.from(domainSet);
      }
    } catch (err) {
      console.warn('Excel parse error:', err);
    }
  }

  // 2. Process text files (XML, CSV, TXT)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';

      // If binary ZIP detected (e.g. .xlsx without standard extension)
      if (text.startsWith('PK\x03\x04') || text.startsWith('PK')) {
        const bufferReader = new FileReader();
        bufferReader.onload = (be) => {
          try {
            const buf = be.target?.result as ArrayBuffer;
            const wb = XLSX.read(buf, { type: 'array' });
            for (const sn of wb.SheetNames) {
              const sheet = wb.Sheets[sn];
              const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
              for (const r of rows) {
                if (Array.isArray(r)) {
                  for (const c of r) {
                    const cleaned = cleanAndValidateDomain(String(c));
                    if (cleaned) domainSet.add(cleaned);
                  }
                }
              }
            }
            resolve(Array.from(domainSet));
          } catch (err) {
            resolve([]);
          }
        };
        bufferReader.readAsArrayBuffer(file);
        return;
      }

      // XML Sitemap specific extraction (<loc>...</loc>)
      if (text.includes('<loc>') || text.includes('</loc>')) {
        const locRegex = /<loc>(.*?)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(text)) !== null) {
          const cleaned = cleanAndValidateDomain(match[1]);
          if (cleaned) domainSet.add(cleaned);
        }
      }

      // Standard multi-line and regex extraction
      const lines = text.split(/[\r\n,; \t]+/);
      for (const line of lines) {
        const cleaned = cleanAndValidateDomain(line);
        if (cleaned) domainSet.add(cleaned);
      }

      // Regex matching for embedded URLs inside text
      const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.[a-zA-Z]{2,})/gi;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(text)) !== null) {
        const cleaned = cleanAndValidateDomain(urlMatch[0]);
        if (cleaned) domainSet.add(cleaned);
      }

      resolve(Array.from(domainSet));
    };

    reader.onerror = () => resolve([]);
    reader.readAsText(file);
  });
}

/**
 * Extracts and cleans domains from any raw text string.
 */
export function extractDomainsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const domainSet = new Set<string>();

  // XML Sitemap specific extraction (<loc>...</loc>)
  if (text.includes('<loc>') || text.includes('</loc>')) {
    const locRegex = /<loc>(.*?)<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(text)) !== null) {
      const cleaned = cleanAndValidateDomain(match[1]);
      if (cleaned) domainSet.add(cleaned);
    }
  }

  const lines = text.split(/[\r\n,; \t]+/);
  for (const line of lines) {
    const cleaned = cleanAndValidateDomain(line);
    if (cleaned) domainSet.add(cleaned);
  }

  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.[a-zA-Z]{2,})/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const cleaned = cleanAndValidateDomain(urlMatch[0]);
    if (cleaned) domainSet.add(cleaned);
  }

  return Array.from(domainSet);
}
