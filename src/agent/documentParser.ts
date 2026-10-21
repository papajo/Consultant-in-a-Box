import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
// Static import registers globalThis.pdfjsWorker, so pdf.js runs in-process without
// dynamically loading a worker file (which serverless bundlers would not trace).
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import mammoth from 'mammoth';
import { getGeminiClient } from './modelProvider.ts';
import { groqChat, groqConfigured, groqVisionModel } from './groqClient.ts';

async function extractPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  try {
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((it: any) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join('').trim());
    }
    return { text: parts.join('\n\n'), pages: doc.numPages };
  } finally {
    await doc.loadingTask?.destroy?.();
  }
}

export interface ParsedDocumentResult {
  text: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  warning?: string;
}

export async function parseUploadedDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedDocumentResult> {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';
  let pageCount: number | undefined = undefined;

  // 1. PDF Documents
  if (extension === 'pdf' || mimeType.includes('pdf')) {
    try {
      const pdfData = await extractPdf(fileBuffer);
      extractedText = pdfData.text;
      pageCount = pdfData.pages;
    } catch (pdfErr: any) {
      console.warn('[DocumentParser] PDF text extraction failed, fallback to raw string extraction:', pdfErr);
      extractedText = fileBuffer.toString('utf-8');
    }
  }
  // 2. Microsoft Word .docx Documents
  else if (extension === 'docx' || mimeType.includes('wordprocessingml')) {
    try {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docxResult.value || '';
    } catch (docxErr: any) {
      console.warn('[DocumentParser] mammoth docx extraction failed:', docxErr);
      extractedText = fileBuffer.toString('utf-8');
    }
  }
  // 3. Image OCR via Gemini (PNG, JPEG, WebP)
  else if (
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(extension) ||
    mimeType.startsWith('image/')
  ) {
    const base64Data = fileBuffer.toString('base64');
    const imgMime = mimeType.startsWith('image/') ? mimeType : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    const ocrPrompt =
      'Extract and transcribe all text, RFP requirements, statements of work, budgets, timeline, criteria, and details from this document image accurately and completely. Maintain structure and headers.';
    const errors: string[] = [];

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: imgMime, data: base64Data } }, { text: ocrPrompt }] }],
        });
        extractedText = response.text || '';
      } catch (imgErr: any) {
        errors.push(`Gemini: ${imgErr.message}`);
      }
    } else {
      errors.push('Gemini: GEMINI_API_KEY not configured');
    }

    if (!extractedText && groqConfigured()) {
      try {
        extractedText = await groqChat(
          [
            {
              role: 'user',
              content: [
                { type: 'text', text: ocrPrompt },
                { type: 'image_url', image_url: { url: `data:${imgMime};base64,${base64Data}` } },
              ],
            },
          ],
          { model: groqVisionModel(), temperature: 0 },
        );
      } catch (groqErr: any) {
        errors.push(`Groq: ${groqErr.message}`);
      }
    }

    if (!extractedText) {
      console.warn('[DocumentParser] Image OCR failed:', errors.join('; '));
      throw new Error(`Failed to extract text from document image: ${errors.join('; ') || 'no AI provider configured'}`);
    }
  }
  // 4. Plain Text, Markdown, JSON, CSV, RTF, HTML, XML
  else {
    extractedText = fileBuffer.toString('utf-8');
    // If it's HTML, clean basic HTML tags
    if (extension === 'html' || extension === 'htm' || mimeType.includes('html')) {
      extractedText = extractedText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ');
    }
  }

  // Clean extracted text (remove NULL bytes, normalize linebreaks)
  extractedText = extractedText.replace(/\0/g, '').replace(/\r\n/g, '\n').trim();

  if (!extractedText) {
    throw new Error(`No readable text could be extracted from "${fileName}". Please ensure the file is not password-protected or empty.`);
  }

  const words = extractedText.split(/\s+/).filter(Boolean);

  return {
    text: extractedText,
    fileName,
    fileType: mimeType || extension,
    fileSizeBytes: fileBuffer.length,
    wordCount: words.length,
    charCount: extractedText.length,
    pageCount,
  };
}
