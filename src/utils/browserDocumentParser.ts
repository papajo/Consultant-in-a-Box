import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker using unpkg or dynamic worker setup to avoid bundler worker path issues
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use official CDN worker matching the installed pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ClientParsedDocument {
  text: string;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  method: 'browser-pdfjs' | 'browser-mammoth' | 'browser-text' | 'server-fallback';
}

/**
 * Extract plain text from PDF ArrayBuffer directly in the browser using pdfjs-dist
 */
export async function extractPdfTextInBrowser(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items with appropriate spacing
    let lastY: number | null = null;
    let pageString = '';

    for (const item of textContent.items as any[]) {
      if (!('str' in item)) continue;
      
      const currentY = item.transform ? item.transform[5] : null;
      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
        // Line break detected
        pageString += '\n';
      } else if (pageString.length > 0 && !pageString.endsWith(' ') && !pageString.endsWith('\n')) {
        pageString += ' ';
      }

      pageString += item.str;
      lastY = currentY;
    }

    if (pageString.trim()) {
      pageTexts.push(`--- PAGE ${i} ---\n${pageString.trim()}`);
    }
  }

  const combinedText = pageTexts.join('\n\n');
  if (!combinedText.trim()) {
    throw new Error('No readable text found in PDF. The document may be scanned images or password protected.');
  }

  return {
    text: combinedText,
    pageCount: numPages,
  };
}

/**
 * Extract plain text from Word (.docx) ArrayBuffer directly in the browser using mammoth.js
 */
export async function extractDocxTextInBrowser(arrayBuffer: ArrayBuffer): Promise<{ text: string }> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || '';
  
  if (!rawText.trim()) {
    throw new Error('No text content could be extracted from Word document.');
  }

  return {
    text: rawText.trim(),
  };
}

/**
 * Main browser document extractor supporting PDF, DOCX, TXT, MD, Markdown, JSON, and server fallback
 */
export async function parseRFPDocumentInBrowser(file: File): Promise<ClientParsedDocument> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType = file.type || '';

  // 1. Plain text / Markdown / JSON directly via FileReader / file.text()
  if (['txt', 'md', 'markdown', 'json', 'rtf', 'csv', 'html', 'htm'].includes(extension) || fileType.startsWith('text/')) {
    const rawText = await file.text();
    let text = rawText.replace(/\0/g, '').replace(/\r\n/g, '\n').trim();
    if (extension === 'html' || extension === 'htm') {
      text = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ');
    }
    const words = text.split(/\s+/).filter(Boolean);
    return {
      text,
      wordCount: words.length,
      charCount: text.length,
      method: 'browser-text',
    };
  }

  // 2. PDF Documents via pdfjs-dist in the browser
  if (extension === 'pdf' || fileType.includes('pdf')) {
    try {
      const buffer = await file.arrayBuffer();
      const { text, pageCount } = await extractPdfTextInBrowser(buffer);
      const words = text.split(/\s+/).filter(Boolean);
      return {
        text,
        wordCount: words.length,
        charCount: text.length,
        pageCount,
        method: 'browser-pdfjs',
      };
    } catch (browserPdfErr: any) {
      console.warn('[PDF Browser Parser] Falling back to server parser:', browserPdfErr);
    }
  }

  // 3. Microsoft Word DOCX via mammoth.js in the browser
  if (extension === 'docx' || fileType.includes('wordprocessingml')) {
    try {
      const buffer = await file.arrayBuffer();
      const { text } = await extractDocxTextInBrowser(buffer);
      const words = text.split(/\s+/).filter(Boolean);
      return {
        text,
        wordCount: words.length,
        charCount: text.length,
        method: 'browser-mammoth',
      };
    } catch (browserDocxErr: any) {
      console.warn('[Mammoth Browser Parser] Falling back to server parser:', browserDocxErr);
    }
  }

  // 4. Fallback: Server-side document parser (for legacy .doc, scanned image OCR, or worker fallbacks)
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const response = await fetch('/api/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBase64: base64Data,
      fileName: fileName,
      mimeType: fileType,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Document extraction failed (${response.status})`);
  }

  const parsedData = await response.json();
  if (!parsedData.text || !parsedData.text.trim()) {
    throw new Error('No readable text could be extracted from this document.');
  }

  return {
    text: parsedData.text,
    wordCount: parsedData.wordCount,
    charCount: parsedData.charCount,
    pageCount: parsedData.pageCount,
    method: 'server-fallback',
  };
}
