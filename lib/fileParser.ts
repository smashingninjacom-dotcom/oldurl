import * as XLSX from 'xlsx';

/**
 * Robust domain extractor that parses plain text, XML sitemaps, CSV, and XLSX workbooks.
 */
export async function parseDomainsFromFile(file: File): Promise<string[]> {
  const fileName = file.name.toLowerCase();

  // 1. Handle Excel (.xlsx, .xls) files via XLSX parser
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      let allText = '';

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        for (const row of json) {
          if (Array.isArray(row)) {
            allText += ' ' + row.join(' ');
          }
        }
      }
      return extractDomainsFromText(allText);
    } catch (err) {
      console.warn('XLSX parsing note:', err);
    }
  }

  // 2. Handle XML, CSV, TXT files via text reading
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      // If binary garbage detected (e.g. zipped XML / PK header)
      if (text.startsWith('PK\x03\x04') || text.startsWith('PK')) {
        try {
          // Attempt binary xlsx read
          const readerBinary = new FileReader();
          readerBinary.onload = (be) => {
            try {
              const b = be.target?.result as ArrayBuffer;
              const wb = XLSX.read(b, { type: 'array' });
              let extracted = '';
              for (const sn of wb.SheetNames) {
                const sheet = wb.Sheets[sn];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                for (const r of rows) {
                  if (Array.isArray(r)) extracted += ' ' + r.join(' ');
                }
              }
              resolve(extractDomainsFromText(extracted));
            } catch (e) {
              resolve([]);
            }
          };
          readerBinary.readAsArrayBuffer(file);
          return;
        } catch (e) {
          resolve([]);
          return;
        }
      }

      resolve(extractDomainsFromText(text));
    };
    reader.onerror = () => resolve([]);
    reader.readAsText(file);
  });
}

/**
 * Extracts and cleans domains from any raw text (including XML sitemaps, CSVs, and URLs)
 */
export function extractDomainsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  // Ignore binary data
  if (text.startsWith('PK\x03\x04') || text.startsWith('PK')) return [];

  // Match URLs and domain patterns
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

    // Filter out file extensions & invalid domains
    if (
      clean &&
      clean.includes('.') &&
      clean.length >= 4 &&
      !clean.endsWith('.xml') &&
      !clean.endsWith('.gz') &&
      !clean.endsWith('.html') &&
      !clean.endsWith('.php') &&
      !clean.endsWith('.json') &&
      !clean.endsWith('.png') &&
      !clean.endsWith('.jpg') &&
      !clean.endsWith('.jpeg') &&
      !clean.endsWith('.css') &&
      !clean.endsWith('.js') &&
      !clean.startsWith('.')
    ) {
      unique.add(clean);
    }
  }

  // Fallback line-by-line split
  if (unique.size === 0) {
    text.split(/[\r\n,; \t]+/).forEach((line) => {
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
