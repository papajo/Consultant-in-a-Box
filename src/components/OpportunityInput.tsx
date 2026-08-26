import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileCheck,
  FileType,
  File as FileIcon,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  FolderUp,
  HelpCircle,
} from 'lucide-react';
import { SAMPLE_RFPS, SampleRFP } from '../data/sampleRFPs.ts';
import { ConsultantProfile } from '../types/agent.ts';

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  uploadedAt: string;
}

interface OpportunityInputProps {
  opportunityText: string;
  onChangeText: (text: string) => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
  activeProfile: ConsultantProfile;
}

export const OpportunityInput: React.FC<OpportunityInputProps> = ({
  opportunityText,
  onChangeText,
  onEvaluate,
  isEvaluating,
  activeProfile,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If user cleared text or switched, handle state
  useEffect(() => {
    if (!opportunityText && uploadedFile) {
      setUploadedFile(null);
    }
  }, [opportunityText]);

  const handleSelectSample = (sample: SampleRFP) => {
    setSelectedSampleId(sample.id);
    setUploadedFile(null);
    setParseError(null);
    onChangeText(sample.content);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setSelectedSampleId('');

    const fileName = file.name;
    const fileType = file.type || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      // 1. Direct browser read for small plain-text files
      if (['txt', 'md', 'markdown', 'json'].includes(extension) && file.size < 500000) {
        const text = await file.text();
        if (!text.trim()) {
          throw new Error('The uploaded file is empty.');
        }
        onChangeText(text);
        const words = text.trim().split(/\s+/).filter(Boolean);
        setUploadedFile({
          name: fileName,
          size: file.size,
          type: extension.toUpperCase(),
          wordCount: words.length,
          charCount: text.length,
          uploadedAt: new Date().toLocaleTimeString(),
        });
        setIsParsing(false);
        return;
      }

      // 2. Multi-format server parser for PDF, DOCX, Images (OCR), RTF, HTML, CSV
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 portion from data URL
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
        throw new Error(errData.error || `Server extraction failed (${response.status})`);
      }

      const parsedData = await response.json();
      if (!parsedData.text || !parsedData.text.trim()) {
        throw new Error('No readable text could be extracted from this document.');
      }

      onChangeText(parsedData.text);
      setUploadedFile({
        name: fileName,
        size: file.size,
        type: (extension || fileType.split('/')[1] || 'DOC').toUpperCase(),
        wordCount: parsedData.wordCount,
        charCount: parsedData.charCount,
        pageCount: parsedData.pageCount,
        uploadedAt: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error('[FileUpload] Error parsing document:', err);
      setParseError(err.message || 'Failed to parse the uploaded document.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  const handleClearDocument = () => {
    onChangeText('');
    setUploadedFile(null);
    setSelectedSampleId('');
    setParseError(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const wordCount = opportunityText.trim() ? opportunityText.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-amber-600" />
            <span>Opportunity / RFP Document Intake</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload your client RFP document (PDF, Word DOCX, Markdown, Text) or paste specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-stone-600 font-mono bg-stone-50 px-3 py-1 rounded-lg border border-stone-200">
            Evaluating as: <strong className="text-stone-900">{activeProfile.name}</strong>
          </div>
        </div>
      </div>

      {/* Input Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            id="tab-mode-upload"
            onClick={() => setInputMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Upload Your RFP</span>
            {uploadedFile && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            id="tab-mode-paste"
            onClick={() => setInputMode('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>Paste / Direct Edit</span>
            {opportunityText.length > 0 && !uploadedFile && (
              <span className="px-1.5 py-0.2 rounded bg-stone-200 text-[10px] font-mono">
                {wordCount}w
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-mode-samples"
            onClick={() => setInputMode('samples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              inputMode === 'samples'
                ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-900/5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Preset RFP Scenarios</span>
          </button>
        </div>

        {/* Clear / Reset action if content exists */}
        {opportunityText.trim().length > 0 && (
          <button
            type="button"
            onClick={handleClearDocument}
            disabled={isEvaluating || isParsing}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 font-medium transition cursor-pointer px-2 py-1 rounded hover:bg-stone-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Document</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.doc,.txt,.md,.markdown,.json,.rtf,.csv,.html,.png,.jpg,.jpeg,.webp"
        className="hidden"
        id="rfp-file-input"
      />

      {/* Parse Error Notification */}
      {parseError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Document Parsing Notice</div>
              <div className="text-rose-700 mt-0.5">{parseError}</div>
              <div className="text-[11px] text-rose-600 mt-1">
                Tip: You can also copy and paste the document text directly into the "Paste / Direct Edit" tab.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setParseError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MODE 1: Dedicated File Upload Dropzone */}
      {inputMode === 'upload' && (
        <div className="space-y-4">
          {/* If file is currently uploaded, show rich file status banner */}
          {uploadedFile ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {uploadedFile.type}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm truncate max-w-xs sm:max-w-md">
                        {uploadedFile.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Parsed & Ready
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                      <span>Size: <strong>{formatBytes(uploadedFile.size)}</strong></span>
                      <span>•</span>
                      <span>Extracted: <strong>{uploadedFile.wordCount.toLocaleString()} words</strong> ({uploadedFile.charCount.toLocaleString()} chars)</span>
                      {uploadedFile.pageCount && (
                        <>
                          <span>•</span>
                          <span>Pages: <strong>{uploadedFile.pageCount}</strong></span>
                        </>
                      )}
                      <span>•</span>
                      <span>Uploaded: {uploadedFile.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer shadow-xs transition"
                  >
                    {showExtractedPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                        <span>Hide Preview</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-stone-500" />
                        <span>Inspect Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isEvaluating || isParsing}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-100/60 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold cursor-pointer shadow-xs transition"
                  >
                    <FolderUp className="w-3.5 h-3.5" />
                    <span>Upload Different File</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Text Area Preview */}
              {showExtractedPreview && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                    <span className="font-semibold text-stone-700">Extracted Document Text (Editable):</span>
                    <span>You can edit or refine text before triggering triage</span>
                  </div>
                  <textarea
                    value={opportunityText}
                    onChange={(e) => onChangeText(e.target.value)}
                    disabled={isEvaluating}
                    className="w-full h-56 p-3 text-xs font-mono text-stone-800 bg-white rounded-lg border border-stone-200 resize-y focus:outline-hidden focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone Area */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60 scale-[1.005]'
                  : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-amber-400'
              }`}
            >
              {isParsing ? (
                <div className="py-8 space-y-3">
                  <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="font-bold text-stone-900 text-sm">
                    Extracting RFP Content & Formatting...
                  </div>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Parsing document tables, requirements, deliverables, and scope of work.
                  </p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Upload your RFP, Tender, or Job Specification Document
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                      Drag & drop your file here, or click to browse from your computer.
                    </p>
                  </div>

                  {/* Format Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-semibold">
                      PDF (.pdf)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-semibold">
                      Word (.docx)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-semibold">
                      Markdown (.md)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-semibold">
                      Text (.txt, .rtf)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-semibold">
                      Scanned Image OCR (.png, .jpg)
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      id="browse-files-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs cursor-pointer transition"
                    >
                      <FolderUp className="w-4 h-4 text-amber-400" />
                      <span>Browse Files</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Paste / Direct Edit */}
      {inputMode === 'paste' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`relative rounded-xl border-2 transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-50/40'
              : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
          }`}
        >
          <textarea
            id="opportunity-text-input"
            value={opportunityText}
            onChange={(e) => {
              onChangeText(e.target.value);
              if (selectedSampleId) setSelectedSampleId('');
              if (uploadedFile) setUploadedFile(null);
            }}
            disabled={isEvaluating}
            placeholder="Paste your client's RFP text, requirements specification, statement of work, budget constraints, timeline, or job post here..."
            className="w-full h-72 p-4 text-xs font-mono text-stone-800 bg-transparent resize-y focus:outline-hidden focus:ring-0 leading-relaxed placeholder:text-stone-400"
          />

          <div className="px-4 py-2 border-t border-stone-200/80 bg-white/70 rounded-b-xl flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{opportunityText.length} characters</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isEvaluating}
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition font-medium cursor-pointer text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>Upload Document Instead</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: Preset Benchmark Samples */}
      {inputMode === 'samples' && (
        <div className="space-y-3">
          <div className="text-xs text-stone-600 font-medium">
            Select a benchmark scenario to evaluate against your active consultant profile:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_RFPS.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <div
                  key={sample.id}
                  id={`sample-rfp-card-${sample.id}`}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-stone-50/70 text-stone-800 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isSelected
                          ? 'bg-white/10 text-amber-300'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {sample.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sample.expectedOutcome === 'GO'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : sample.expectedOutcome === 'PASS'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {sample.expectedOutcome === 'GO' && <CheckCircle2 className="w-3 h-3" />}
                        {sample.expectedOutcome === 'PASS' && <XCircle className="w-3 h-3" />}
                        {sample.expectedOutcome === 'REVIEW' && <AlertTriangle className="w-3 h-3" />}
                        {sample.expectedOutcome} EXPECTED
                      </span>
                    </div>

                    <h4 className="font-bold text-xs leading-snug">{sample.title}</h4>
                    <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {sample.clientName} • {sample.tagline}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-stone-200/40">
                    <span className={isSelected ? 'text-stone-400' : 'text-stone-400'}>
                      {sample.content.split(/\s+/).length} words
                    </span>
                    <span className={`font-bold flex items-center gap-0.5 ${isSelected ? 'text-amber-300' : 'text-stone-700'}`}>
                      {isSelected ? 'Loaded Active' : 'Load Scenario'} →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Preview of selected sample */}
          {selectedSampleId && (
            <div className="mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono text-stone-600 line-clamp-3">
              {opportunityText}
            </div>
          )}
        </div>
      )}

      {/* Action CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-stone-100">
        <div className="text-xs text-stone-500 leading-normal flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span>
            Autonomous 5-stage pipeline: <strong className="text-stone-700">Extract Requirements</strong> → <strong className="text-stone-700">Client Diligence</strong> → <strong className="text-stone-700">Evidence Matrix</strong> → <strong className="text-stone-700">Risk Matrix</strong> → <strong className="text-stone-700">Decision</strong>
          </span>
        </div>

        <button
          id="evaluate-opportunity-button"
          type="button"
          onClick={onEvaluate}
          disabled={isEvaluating || isParsing || !opportunityText.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group ring-1 ring-stone-900/10"
        >
          {isEvaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Agents Investigating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110" />
              <span>Run Agentic Triage</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
